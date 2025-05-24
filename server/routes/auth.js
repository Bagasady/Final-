import express from 'express';
import { login, register } from '../controllers/auth.js';
import { validateLogin, validateRegister } from '../middleware/validation.js';

const router = express.Router();

router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);

export default router;