import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { logger } from '../index.js';

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.execute(
      'SELECT id, username, password, name, role, branch FROM users WHERE username = ? AND active = 1',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role,
        branch: user.branch 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log login activity
    await pool.execute(
      'INSERT INTO activity_logs (id, username, branch, action, details) VALUES (UUID(), ?, ?, ?, ?)',
      [user.username, user.branch, 'login', `User ${user.username} logged in`]
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        branch: user.branch
      }
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { username, password, name, role, branch } = req.body;

    // Check if username exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    await pool.execute(
      `INSERT INTO users (id, username, password, name, role, branch, active) 
       VALUES (UUID(), ?, ?, ?, ?, ?, 1)`,
      [username, hashedPassword, name, role, branch]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    next(error);
  }
};