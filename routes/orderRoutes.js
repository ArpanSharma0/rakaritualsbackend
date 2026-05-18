import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  verifyPayment,
  getAllOrders,
  updateOrderDeliveryStatus,
  cancelOrder,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createOrder).get(protect, admin, getAllOrders);
router.route('/myorders').get(protect, getUserOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').post(protect, verifyPayment);
router.route('/:id/status').put(protect, admin, updateOrderDeliveryStatus);
router.route('/:id/cancel').put(protect, cancelOrder);

export default router;
