import pool from '../config/database.js';
import { logger } from '../index.js';

export const getProducts = async (req, res, next) => {
  try {
    const { branch } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];

    if (branch) {
      query += ' WHERE branch = ?';
      params.push(branch);
    }

    const [products] = await pool.execute(query, params);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const { sku } = req.params;
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE sku = ?',
      [sku]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(products[0]);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { sku, name, price, rackNumber, branch, stockNew } = req.body;

    // Check if SKU exists
    const [existing] = await pool.execute(
      'SELECT sku FROM products WHERE sku = ? AND branch = ?',
      [sku, branch]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'SKU already exists in this branch' });
    }

    await pool.execute(
      `INSERT INTO products (sku, name, price, rack_number, branch, stock_new) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sku, name, price, rackNumber, branch, stockNew]
    );

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (id, username, branch, action, details, sku) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [req.user.username, branch, 'input', `Added new product: ${sku}`, sku]
    );

    res.status(201).json({ message: 'Product created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { sku } = req.params;
    const { name, price, rackNumber, stockNew } = req.body;

    const [result] = await pool.execute(
      `UPDATE products 
       SET name = ?, price = ?, rack_number = ?, stock_new = ?
       WHERE sku = ?`,
      [name, price, rackNumber, stockNew, sku]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (id, username, branch, action, details, sku) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [req.user.username, req.user.branch, 'update', `Updated product: ${sku}`, sku]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { sku } = req.params;

    // Check if product is referenced in box_items
    const [boxItems] = await pool.execute(
      'SELECT COUNT(*) as count FROM box_items WHERE sku = ?',
      [sku]
    );

    if (boxItems[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete product that is referenced in boxes' 
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM products WHERE sku = ?',
      [sku]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (id, username, branch, action, details, sku) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [req.user.username, req.user.branch, 'update', `Deleted product: ${sku}`, sku]
    );

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const uploadProducts = async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { products, branch } = req.body;
    let added = 0;
    let updated = 0;

    for (const product of products) {
      const [existing] = await connection.execute(
        'SELECT sku FROM products WHERE sku = ? AND branch = ?',
        [product.sku, branch]
      );

      if (existing.length > 0) {
        // Update existing product
        await connection.execute(
          `UPDATE products 
           SET name = ?, price = ?, rack_number = ?, stock_new = ?
           WHERE sku = ? AND branch = ?`,
          [product.name, product.price, product.rackNumber, product.stockNew, product.sku, branch]
        );
        updated++;
      } else {
        // Insert new product
        await connection.execute(
          `INSERT INTO products (sku, name, price, rack_number, branch, stock_new) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [product.sku, product.name, product.price, product.rackNumber, branch, product.stockNew]
        );
        added++;
      }
    }

    // Log activity
    await connection.execute(
      'INSERT INTO activity_logs (id, username, branch, action, details) VALUES (UUID(), ?, ?, ?, ?)',
      [
        req.user.username, 
        branch, 
        'csv_upload', 
        `Uploaded CSV: ${added} new items, ${updated} updated items`
      ]
    );

    await connection.commit();
    res.json({ added, updated });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};