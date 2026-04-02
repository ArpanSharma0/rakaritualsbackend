import express from 'express';
import { createOrder, getUserOrders } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createOrder).get(protect, getUserOrders);
router.route('/myorders').get(protect, getUserOrders);

export default router;
