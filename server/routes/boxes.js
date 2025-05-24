import express from 'express';
import { 
  getBoxes,
  getBox,
  createBox,
  updateBox,
  deleteBox,
  addItemToBox,
  removeItemFromBox,
  updateItemQuantity
} from '../controllers/boxes.js';
import { authorizeRole } from '../middleware/auth.js';
import { validateBox, validateBoxItem } from '../middleware/validation.js';

const router = express.Router();

router.get('/', authorizeRole(['store', 'manager', 'admin']), getBoxes);
router.get('/:id', authorizeRole(['store', 'manager', 'admin']), getBox);
router.post('/', authorizeRole(['store', 'admin']), validateBox, createBox);
router.put('/:id', authorizeRole(['store', 'admin']), validateBox, updateBox);
router.delete('/:id', authorizeRole(['admin']), deleteBox);

router.post('/:id/items', authorizeRole(['store', 'admin']), validateBoxItem, addItemToBox);
router.delete('/:id/items/:sku', authorizeRole(['store', 'admin']), removeItemFromBox);
router.put('/:id/items/:sku', authorizeRole(['store', 'admin']), validateBoxItem, updateItemQuantity);

export default router;