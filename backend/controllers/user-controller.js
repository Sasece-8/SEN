import userModel from '../models/user-model.js';
import * as userService from '../services/userService.js';
import { validationResult } from 'express-validator';
import redisClient from '../services/redisService.js';

export const createUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let { email, password } = req.body;

    try {
        const user = await userService.createUser({ email, password });
        const token = user.generateJWT();
        delete user._doc.password; // Remove password from response
        res.status(201).json({
            user,
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const loginUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = user.generateJWT();
        delete user._doc.password; // Remove password from response
        res.status(200).json({
            user,
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getUserProfileController = async (req, res) => {
    res.status(200).json({
        user: req.user
    });
}

export const logoutUserController = async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorised User' });
    }

    try {
        redisClient.set(token, 'logged_out', 'EX', 60 * 60 * 24); // Store token in Redis with 24 hour expiration
        res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getAllUsersController = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({email : req.user.email});

        const getAllUsers = await userService.getAllUsers({userId: loggedInUser._id});
        res.status(200).json({
            users: getAllUsers});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}