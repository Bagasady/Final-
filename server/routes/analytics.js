import express from 'express';
import { 
  getDashboardStats, 
  getBoxAnalytics,
  getRefillTrends 
} from '../controllers/analytics.js';
import { authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authorizeRole(['store', 'manager', 'admin']), getDashboardStats);
router.get('/boxes', authorizeRole(['store', 'manager', 'admin']), getBoxAnalytics);
router.get('/refills', authorizeRole(['store', 'manager', 'admin']), getRefillTrends);

export default router;