import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, name, role, branch, active, created_at FROM users'
    );
    
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, branch, password } = req.body;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      await pool.execute(
        'UPDATE users SET name = ?, role = ?, branch = ?, password = ? WHERE id = ?',
        [name, role, branch, hashedPassword, id]
      );
    } else {
      await pool.execute(
        'UPDATE users SET name = ?, role = ?, branch = ? WHERE id = ?',
        [name, role, branch, id]
      );
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      'UPDATE users SET active = 0 WHERE id = ?',
      [id]
    );

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
};