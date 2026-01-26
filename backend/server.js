import 'dotenv/config.js';
import http from 'http';
import app from './app.js';
import {Server} from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project-model.js';
import { generateResponse } from './services/aiService.js';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server , {
  cors: {
    origin: '*'
  }
});

io.use(async (socket, next) => {
  try{
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];

    const projectId = socket.handshake.query.projectId;
    if(!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error('Invalid project ID'));
    }

    socket.project = await projectModel.findById(projectId);

    if (!socket.project) {
      return next(new Error('Project not found')); 
    }

    if (!token) {
      return next(new Error('Authentication error'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error('Authentication error'));
    }
    socket.user = decoded
    next();
    
  }catch (error) {
    next(error);
  }
});

io.on('connection', socket => {
  console.log(socket);
  socket.roomId = socket.project._id.toString()
  console.log('A user connected:');

  socket.join(socket.roomId);

  socket.on('project-message', async data => {
    const message = data.message;
    const aiIsPresentInMessage = message.includes('@ai');

    // Broadcast the message to all users in the project room
    socket.broadcast.to(socket.roomId).emit('project-message', data);

    if (aiIsPresentInMessage) {
      try {
        const prompt = message.replace('@ai', '').trim();
        const aiResponse = await generateResponse(prompt);
        // console.log(aiResponse);
        io.emit('project-message', {
          message: aiResponse,
          sender: {
            _id: 'ai',
            email: 'AI'
          }
        });
      } catch (error) {
        console.error("AI Service Error:", error);
        io.emit('project-message', {
          message: "AI Request Failed: Quota exceeded or service unavailable. Please try again later.",
          sender: {
            _id: 'ai',
            email: 'AI'
          },
          isError: true
        });
      }

      return;
    }
  });

  socket.on('event', data => { /* … */ });
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    socket.leave(socket.roomId);
  });
});



server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});