import express from 'express';
import { getUsers, updateUser, deactivateUser } from '../controllers/users.js';
import { authorizeRole } from '../middleware/auth.js';
import { validateUserUpdate } from '../middleware/validation.js';

const router = express.Router();

router.get('/', authorizeRole(['admin']), getUsers);
router.put('/:id', authorizeRole(['admin']), validateUserUpdate, updateUser);
router.delete('/:id', authorizeRole(['admin']), deactivateUser);

export default router;