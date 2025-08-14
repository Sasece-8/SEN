import e from 'express';
import projectModel from '../models/project-model.js';
import mongoose from 'mongoose';

export const createProject = async ({
    name, userId
}) => {
    if (!name) {
        throw new Error('Name is required')
    }
    if (!userId) {
        throw new Error('UserId is required')
    }

    let project;
    try {
        project = await projectModel.create({
            name,
            users: [ userId ]
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('Project name already exists');
        }
        throw error;
    }

    return project;

}

export const getAllProjectsByUser = async (userId) => {
    if (!userId) {
        throw new Error('UserId is required')
    }

    const projects = await projectModel.find({ users: userId });

    return projects;
}

export const addUsersToProject = async ({projectId, users, userId}) => {
    if (!projectId) {
        throw new Error('Project ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!users || !Array.isArray(users) || users.length === 0) {
        throw new Error('Users must be a non-empty array');
    }
    if (!userId) {
        throw new Error('UserId is required');
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId");
    }

    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    });

    if (!project) {
        throw new Error('User is not authorized to add users to this project');
    }

    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId },
        { 
            $addToSet: { 
                users: { 
                    $each: users 
                } 
            } 
        },
        { new: true }
    )

    return updatedProject;
}

export const getProjectById = async ({ projectId }) => {
    if (!projectId) {
        throw new Error('Project ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId");
    }

    const project = await projectModel.findOne({
        _id: projectId,
    }).populate('users'); // Populate users

    if (!project) {
        throw new Error('Project not found');
    }

    return project;
}
