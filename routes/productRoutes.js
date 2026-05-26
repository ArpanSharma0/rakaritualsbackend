import express from 'express';
import {
  getProducts,
  getProductById,
  getBestProducts,
  getFeaturedProduct,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/best', getBestProducts);
router.get('/featured', getFeaturedProduct);
router.get('/categories', getCategories);
router.get('/:id', getProductById);
router.post('/:id/reviews', protect, createProductReview);

// Admin Routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;
