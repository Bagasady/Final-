import { create } from 'zustand';
import { Box, BoxItem } from '../types';
import pool from '../config/database';

interface BoxState {
  boxes: Box[];
  getBoxes: (branch?: string) => Promise<Box[]>;
  getBox: (id: string) => Promise<Box | undefined>;
  addBox: (category: 'A' | 'B' | 'C', branch: string) => Promise<Box>;
  addItemToBox: (boxId: string, item: BoxItem) => Promise<void>;
  updateItemQuantity: (boxId: string, sku: string, quantity: number) => Promise<void>;
  removeItem: (boxId: string, sku: string) => Promise<void>;
  isBoxEmpty: (boxId: string) => Promise<boolean>;
  getNextBoxNumber: (category: 'A' | 'B' | 'C', branch: string) => Promise<string>;
  searchBoxesBySku: (sku: string, branch?: string) => Promise<Box[]>;
}

export const useBoxStore = create<BoxState>((set, get) => ({
  boxes: [],
  
  getBoxes: async (branch?: string) => {
    try {
      let query = `
        SELECT b.*, bi.sku, bi.name, bi.quantity, bi.price 
        FROM boxes b 
        LEFT JOIN box_items bi ON b.id = bi.box_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (branch) {
        query += ' AND b.branch = ?';
        params.push(branch);
      }

      const [rows] = await pool.execute(query, params);
      const boxesMap = new Map<string, Box>();

      (rows as any[]).forEach(row => {
        if (!boxesMap.has(row.id)) {
          boxesMap.set(row.id, {
            id: row.id,
            category: row.category,
            number: row.number,
            branch: row.branch,
            items: []
          });
        }

        if (row.sku) {
          const box = boxesMap.get(row.id)!;
          box.items.push({
            sku: row.sku,
            name: row.name,
            quantity: row.quantity,
            price: row.price
          });
        }
      });

      return Array.from(boxesMap.values());
    } catch (error) {
      console.error('Error fetching boxes:', error);
      return [];
    }
  },
  
  getBox: async (id: string) => {
    try {
      const [rows] = await pool.execute(
        `SELECT b.*, bi.sku, bi.name, bi.quantity, bi.price 
         FROM boxes b 
         LEFT JOIN box_items bi ON b.id = bi.box_id 
         WHERE b.id = ?`,
        [id]
      );

      if ((rows as any[]).length === 0) return undefined;

      const box: Box = {
        id: (rows as any[])[0].id,
        category: (rows as any[])[0].category,
        number: (rows as any[])[0].number,
        branch: (rows as any[])[0].branch,
        items: []
      };

      (rows as any[]).forEach(row => {
        if (row.sku) {
          box.items.push({
            sku: row.sku,
            name: row.name,
            quantity: row.quantity,
            price: row.price
          });
        }
      });

      return box;
    } catch (error) {
      console.error('Error fetching box:', error);
      return undefined;
    }
  },
  
  addBox: async (category, branch) => {
    try {
      const newBoxNumber = await get().getNextBoxNumber(category, branch);
      const newBoxId = `${newBoxNumber}-${branch.replace(/\s+/g, '')}`;
      
      await pool.execute(
        'INSERT INTO boxes (id, category, number, branch) VALUES (?, ?, ?, ?)',
        [newBoxId, category, newBoxNumber, branch]
      );

      const newBox: Box = {
        id: newBoxId,
        category,
        number: newBoxNumber,
        branch,
        items: []
      };

      return newBox;
    } catch (error) {
      console.error('Error adding box:', error);
      throw error;
    }
  },
  
  addItemToBox: async (boxId, item) => {
    try {
      const [existingItems] = await pool.execute(
        'SELECT * FROM box_items WHERE box_id = ? AND sku = ?',
        [boxId, item.sku]
      );

      if ((existingItems as any[]).length > 0) {
        await pool.execute(
          'UPDATE box_items SET quantity = quantity + ? WHERE box_id = ? AND sku = ?',
          [item.quantity, boxId, item.sku]
        );
      } else {
        await pool.execute(
          'INSERT INTO box_items (box_id, sku, name, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [boxId, item.sku, item.name, item.quantity, item.price]
        );
      }
    } catch (error) {
      console.error('Error adding item to box:', error);
      throw error;
    }
  },
  
  updateItemQuantity: async (boxId, sku, quantity) => {
    try {
      if (quantity > 0) {
        await pool.execute(
          'UPDATE box_items SET quantity = ? WHERE box_id = ? AND sku = ?',
          [quantity, boxId, sku]
        );
      } else {
        await pool.execute(
          'DELETE FROM box_items WHERE box_id = ? AND sku = ?',
          [boxId, sku]
        );
      }
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  },
  
  removeItem: async (boxId, sku) => {
    try {
      await pool.execute(
        'DELETE FROM box_items WHERE box_id = ? AND sku = ?',
        [boxId, sku]
      );
    } catch (error) {
      console.error('Error removing item:', error);
      throw error;
    }
  },
  
  isBoxEmpty: async (boxId) => {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM box_items WHERE box_id = ?',
        [boxId]
      );
      return (rows as any[])[0].count === 0;
    } catch (error) {
      console.error('Error checking if box is empty:', error);
      return true;
    }
  },
  
  getNextBoxNumber: async (category, branch) => {
    try {
      const [rows] = await pool.execute(
        'SELECT number FROM boxes WHERE branch = ? AND category = ? ORDER BY number DESC LIMIT 1',
        [branch, category]
      );

      if ((rows as any[]).length === 0) {
        return `${category}001`;
      }

      const lastNumber = (rows as any[])[0].number;
      const match = lastNumber.match(/[A-C](\d+)/);
      const nextNumber = match ? parseInt(match[1], 10) + 1 : 1;
      return `${category}${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error getting next box number:', error);
      return `${category}001`;
    }
  },
  
  searchBoxesBySku: async (sku, branch) => {
    try {
      let query = `
        SELECT b.*, bi.sku, bi.name, bi.quantity, bi.price 
        FROM boxes b 
        INNER JOIN box_items bi ON b.id = bi.box_id 
        WHERE bi.sku LIKE ?
      `;
      const params: any[] = [`%${sku}%`];

      if (branch) {
        query += ' AND b.branch = ?';
        params.push(branch);
      }

      const [rows] = await pool.execute(query, params);
      const boxesMap = new Map<string, Box>();

      (rows as any[]).forEach(row => {
        if (!boxesMap.has(row.id)) {
          boxesMap.set(row.id, {
            id: row.id,
            category: row.category,
            number: row.number,
            branch: row.branch,
            items: []
          });
        }

        const box = boxesMap.get(row.id)!;
        box.items.push({
          sku: row.sku,
          name: row.name,
          quantity: row.quantity,
          price: row.price
        });
      });

      return Array.from(boxesMap.values());
    } catch (error) {
      console.error('Error searching boxes:', error);
      return [];
    }
  }
}));