import Router from 'express';
import * as projectController from '../controllers/project-controller.js';
import * as authMiddleware from '../middlewares/authMiddleware.js';
import { body } from 'express-validator';


const router = Router();

router.post('/create',
    authMiddleware.authUser,
    body('name').notEmpty().isString().withMessage('Project name is required'),
    projectController.createProject
);

router.get('/all',
    authMiddleware.authUser,
    projectController.getAllProjects
);

router.put('/add-user',
    authMiddleware.authUser,
    body('projectId').notEmpty().isString().withMessage('Project ID is required'),
    body('users').isArray({min:1}).withMessage('Users must be an array').bail()
    .custom((users) => users.every(user => typeof user === 'string')).withMessage('Each user must be a string'),
    projectController.addUserToProject
);

router.get('/get-project/:projectId',
    authMiddleware.authUser,
    projectController.getProjectById
);

export default router;