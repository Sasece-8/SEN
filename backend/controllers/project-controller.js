import projectModel from '../models/project-model.js';
import * as projectService from '../services/projectService.js';
import {validationResult} from 'express-validator';
import userModel from '../models/user-model.js';


export const createProject = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { name } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const userId = loggedInUser._id;

        const newProject = await projectService.createProject({ name, userId });

        res.status(201).json(newProject);

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
}


export const getAllProjects = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const getUserProjects = await projectService.getAllProjectsByUser(loggedInUser._id);
        res.status(200).json({ projects: getUserProjects });
    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
}

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, users } = req.body;

        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const userId = loggedInUser._id;

        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId
        });

        return res.status(200).json({ message: 'Users added to project successfully', project });
        
    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
}

export const getProjectById = async (req, res) => {
    const { projectId } = req.params;

    try{
        const project = await projectService.getProjectById({projectId});

        return res.status(200).json({project});
    }
    catch(err){
        console.log(err.message);
        res.status(400).json({error : err.message});
    }
}   

