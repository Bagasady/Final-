import pool from '../config/database.js';
import { logger } from '../index.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const { branch } = req.query;
    const params = [];
    let branchCondition = '';

    if (branch) {
      branchCondition = ' WHERE branch = ?';
      params.push(branch);
    }

    // Get box statistics
    const [boxStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_boxes,
        SUM(CASE WHEN category = 'A' THEN 1 ELSE 0 END) as boxes_a,
        SUM(CASE WHEN category = 'B' THEN 1 ELSE 0 END) as boxes_b,
        SUM(CASE WHEN category = 'C' THEN 1 ELSE 0 END) as boxes_c
      FROM boxes${branchCondition}
    `, params);

    // Get SKU statistics
    const [skuStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT bi.sku) as total_skus,
        SUM(CASE WHEN b.category = 'A' THEN 1 ELSE 0 END) as skus_a,
        SUM(CASE WHEN b.category = 'B' THEN 1 ELSE 0 END) as skus_b,
        SUM(CASE WHEN b.category = 'C' THEN 1 ELSE 0 END) as skus_c
      FROM box_items bi
      JOIN boxes b ON bi.box_id = b.id${branchCondition}
    `, params);

    // Get recent activities
    const [activities] = await pool.execute(`
      SELECT * FROM activity_logs${branchCondition}
      ORDER BY created_at DESC LIMIT 5
    `, params);

    res.json({
      boxes: boxStats[0],
      skus: skuStats[0],
      recentActivities: activities
    });
  } catch (error) {
    next(error);
  }
};

export const getBoxAnalytics = async (req, res, next) => {
  try {
    const { branch, period } = req.query;
    let timeFrame;

    switch (period) {
      case 'day':
        timeFrame = 'INTERVAL 1 DAY';
        break;
      case 'week':
        timeFrame = 'INTERVAL 7 DAY';
        break;
      case 'month':
        timeFrame = 'INTERVAL 30 DAY';
        break;
      default:
        timeFrame = 'INTERVAL 7 DAY';
    }

    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_boxes,
        SUM(CASE WHEN category = 'A' THEN 1 ELSE 0 END) as boxes_a,
        SUM(CASE WHEN category = 'B' THEN 1 ELSE 0 END) as boxes_b,
        SUM(CASE WHEN category = 'C' THEN 1 ELSE 0 END) as boxes_c
      FROM boxes
      WHERE created_at >= DATE_SUB(CURRENT_DATE, ${timeFrame})
        ${branch ? 'AND branch = ?' : ''}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const [results] = await pool.execute(query, branch ? [branch] : []);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

export const getRefillTrends = async (req, res, next) => {
  try {
    const { branch, period } = req.query;
    let timeFrame;

    switch (period) {
      case 'day':
        timeFrame = 'INTERVAL 24 HOUR';
        break;
      case 'week':
        timeFrame = 'INTERVAL 7 DAY';
        break;
      case 'month':
        timeFrame = 'INTERVAL 30 DAY';
        break;
      default:
        timeFrame = 'INTERVAL 7 DAY';
    }

    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_refills,
        SUM(CASE WHEN category = 'A' THEN 1 ELSE 0 END) as refills_a,
        SUM(CASE WHEN category = 'B' THEN 1 ELSE 0 END) as refills_b,
        SUM(CASE WHEN category = 'C' THEN 1 ELSE 0 END) as refills_c
      FROM activity_logs
      WHERE action = 'refill'
        AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, ${timeFrame})
        ${branch ? 'AND branch = ?' : ''}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const [results] = await pool.execute(query, branch ? [branch] : []);
    res.json(results);
  } catch (error) {
    next(error);
  }
};