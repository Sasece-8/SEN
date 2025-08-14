import jwt from 'jsonwebtoken';
import redisClient from '../services/redisService.js';

export const authUser = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorised User' });
    }

    const blackListedToken = await redisClient.get(token);
    if (blackListedToken) {
        res.cookie('token', '');
        return res.status(401).json({ error: 'Unauthorised User' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).send({ error: 'Unauthorised User' });
    }
}