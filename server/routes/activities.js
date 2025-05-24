import express from 'express';
import { getActivities, getActivityById } from '../controllers/activities.js';
import { authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authorizeRole(['store', 'manager', 'admin']), getActivities);
router.get('/:id', authorizeRole(['store', 'manager', 'admin']), getActivityById);

export default router;