import pool from '../config/database.js';
import { logger } from '../index.js';

export const getActivities = async (req, res, next) => {
  try {
    const { branch, startDate, endDate, action } = req.query;
    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];

    if (branch) {
      query += ' AND branch = ?';
      params.push(branch);
    }

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    query += ' ORDER BY created_at DESC';

    const [activities] = await pool.execute(query, params);
    res.json(activities);
  } catch (error) {
    next(error);
  }
};

export const getActivityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [activities] = await pool.execute(
      'SELECT * FROM activity_logs WHERE id = ?',
      [id]
    );

    if (activities.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activities[0]);
  } catch (error) {
    next(error);
  }
};