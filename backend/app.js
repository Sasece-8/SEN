import express from 'express';
import morgan from 'morgan';
import connectDB from './db/db.js';
import userRoute from './routes/userRoute.js';
import projectRoute from './routes/projectRoute.js';
import aiRoute from './routes/aiRoute.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';


connectDB();

const app = express();

app.use(cors());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/users', userRoute);
app.use('/projects', projectRoute);
app.use('/ai', aiRoute);


app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;

