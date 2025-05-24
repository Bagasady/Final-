import express from 'express';
import { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  uploadProducts 
} from '../controllers/products.js';
import { authorizeRole } from '../middleware/auth.js';
import { validateProduct, validateProductUpload } from '../middleware/validation.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:sku', getProduct);
router.post('/', authorizeRole(['admin']), validateProduct, createProduct);
router.put('/:sku', authorizeRole(['admin']), validateProduct, updateProduct);
router.delete('/:sku', authorizeRole(['admin']), deleteProduct);
router.post('/upload', authorizeRole(['admin']), validateProductUpload, uploadProducts);

export default router;