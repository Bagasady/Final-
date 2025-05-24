import pool from '../config/database.js';
import { logger } from '../index.js';

export const getBoxes = async (req, res, next) => {
  try {
    const { branch } = req.query;
    let query = `
      SELECT b.*, bi.sku, bi.name, bi.quantity, bi.price 
      FROM boxes b 
      LEFT JOIN box_items bi ON b.id = bi.box_id
      WHERE 1=1
    `;
    const params = [];

    if (branch) {
      query += ' AND b.branch = ?';
      params.push(branch);
    }

    const [rows] = await pool.execute(query, params);
    
    // Group items by box
    const boxesMap = new Map();
    rows.forEach(row => {
      if (!boxesMap.has(row.id)) {
        boxesMap.set(row.id, {
          id: row.id,
          number: row.number,
          category: row.category,
          branch: row.branch,
          items: []
        });
      }

      if (row.sku) {
        boxesMap.get(row.id).items.push({
          sku: row.sku,
          name: row.name,
          quantity: row.quantity,
          price: row.price
        });
      }
    });

    res.json(Array.from(boxesMap.values()));
  } catch (error) {
    next(error);
  }
};

export const getBox = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT b.*, bi.sku, bi.name, bi.quantity, bi.price 
       FROM boxes b 
       LEFT JOIN box_items bi ON b.id = bi.box_id 
       WHERE b.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Box not found' });
    }

    const box = {
      id: rows[0].id,
      number: rows[0].number,
      category: rows[0].category,
      branch: rows[0].branch,
      items: rows.filter(row => row.sku).map(row => ({
        sku: row.sku,
        name: row.name,
        quantity: row.quantity,
        price: row.price
      }))
    };

    res.json(box);
  } catch (error) {
    next(error);
  }
};

export const createBox = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { category, branch } = req.body;

    // Get next box number
    const [lastBox] = await connection.execute(
      'SELECT number FROM boxes WHERE branch = ? AND category = ? ORDER BY number DESC LIMIT 1',
      [branch, category]
    );

    let nextNumber;
    if (lastBox.length === 0) {
      nextNumber = `${category}001`;
    } else {
      const lastNumber = lastBox[0].number;
      const match = lastNumber.match(/[A-C](\d+)/);
      const num = match ? parseInt(match[1], 10) + 1 : 1;
      nextNumber = `${category}${String(num).padStart(3, '0')}`;
    }

    // Create box
    const [result] = await connection.execute(
      'INSERT INTO boxes (id, number, category, branch) VALUES (UUID(), ?, ?, ?)',
      [nextNumber, category, branch]
    );

    // Log activity
    await connection.execute(
      'INSERT INTO activity_logs (id, username, branch, action, details, category) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [req.user.username, branch, 'input', `Created new box ${nextNumber}`, category]
    );

    await connection.commit();
    
    res.status(201).json({ 
      id: result.insertId,
      number: nextNumber,
      category,
      branch,
      items: []
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

export const updateBox = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { category } = req.body;

    const [result] = await connection.execute(
      'UPDATE boxes SET category = ? WHERE id = ?',
      [category, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Box not found' });
    }

    // Log activity
    await connection.execute(
      'INSERT INTO activity_logs (id, username, branch, action, details, category) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [req.user.username, req.user.branch, 'update', `Updated box ${id} category to ${category}`, category]
    );

    await connection.commit();
    res.json({ message: 'Box updated successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

export const deleteBox = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;

    // Check if box has items
    const [items] = await connection.execute(
      'SELECT COUNT(*) as count FROM box_items WHERE box_id = ?',
      [id]
    );

    if (items[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Cannot delete box that contains items' 
      });
    }

    const [result] = await connection.execute(
      'DELETE FROM boxes WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Box not found' });
    }

    // Log activity
    await connection.execute(
      'INSERT INTO activity_logs (id, username, branch, action, details) VALUES (UUID(), ?, ?, ?, ?)',
      [req.user.username, req.user.branch, 'update', `Deleted box ${id}`]
    );

    await connection.commit();
    res.json({ message: 'Box deleted successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

export const addItemToBox = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { sku, name, quantity, price } = req.body;

    // Check if item already exists in box
    const [existing] = await connection.execute(
      'SELECT quantity FROM box_items WHERE box_id = ? AND sku = ?',
      [id, sku]
    );

    if (existing.length > 0) {
      // Update existing item
      await connection.execute(
        'UPDATE box_items SET quantity = quantity + ? WHERE box_id = ? AND sku = ?',
        [quantity, id, sku]
      );
    } else {
      // Add new item
      await connection.execute(
        'INSERT INTO box_items (box_id, sku, name, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [id, sku, name, quantity, price]
      );
    }

    // Get box details for logging
    const [boxes] = await connection.execute(
      'SELECT number, category FROM boxes WHERE id = ?',
      [id]
    );

    // Log activity
    await connection.execute(
      'INSERT INTO activity_logs (id, username, branch, action, details, sku, box_id, category) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.username,
        req.user.branch,
        'input',
        `Added ${quantity} units of ${sku} to box ${boxes[0].number}`,
        sku,
        id,
        boxes[0].category
      ]
    );

    await connection.commit();
    res.json({ message: 'Item added successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

export const removeItemFromBox = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id, sku } = req.params;

    const [result] = await connection.execute(
      'DELETE FROM box_items WHERE box_id = ? AND sku = ?',
      [id, sku]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Item not found in box' });
    }

    // Get box details for logging
    const [boxes] = await connection.execute(
      'SELECT number, category FROM boxes WHERE id = ?',
      [id]
    );

    // Log activity
    await connection.execute(
      'INSERT INTO activity_logs (id, username, branch, action, details, sku, box_id, category) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.username,
        req.user.branch,
        'update',
        `Removed ${sku} from box ${boxes[0].number}`,
        sku,
        id,
        boxes[0].category
      ]
    );

    await connection.commit();
    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

export const updateItemQuantity = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id, sku } = req.params;
    const { quantity } = req.body;

    if (quantity > 0) {
      await connection.execute(
        'UPDATE box_items SET quantity = ? WHERE box_id = ? AND sku = ?',
        [quantity, id, sku]
      );
    } else {
      await connection.execute(
        'DELETE FROM box_items WHERE box_id = ? AND sku = ?',
        [id, sku]
      );
    }

    // Get box details for logging
    const [boxes] = await connection.execute(
      'SELECT number, category FROM boxes WHERE id = ?',
      [id]
    );

    // Log activity
    await connection.execute(
      'INSERT INTO activity_logs (id, username, branch, action, details, sku, box_id, category) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.username,
        req.user.branch,
        'update',
        `Updated quantity of ${sku} to ${quantity} in box ${boxes[0].number}`,
        sku,
        id,
        boxes[0].category
      ]
    );

    await connection.commit();
    res.json({ message: 'Item quantity updated successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};