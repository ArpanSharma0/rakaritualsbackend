import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_API_KEY || !process.env.RAZORPAY_API_SECRET) {
    console.error('Razorpay API keys are missing in environment variables!');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY || '',
    key_secret: process.env.RAZORPAY_API_SECRET || '',
  });
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    // 1. Fetch cart of user
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    // 2. Ensure cart is not empty
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 3. Ensure shipping address is provided
    const { shippingAddress, referralCode, referral, paymentMethod } = req.body;
    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    // 4. Convert cart items -> orderItems & calculate totalPrice server-side
    let totalPrice = 0;
    const orderItems = cart.items.map((item) => {
      const itemPrice = item.product.price;
      const itemTotal = itemPrice * item.quantity;
      totalPrice += itemTotal;

      return {
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: itemPrice,
      };
    });

    // 5. Save order in MongoDB
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      totalPrice,
      shippingAddress,
      referralCode,
      referral,
      paymentMethod: paymentMethod || 'Online',
      paymentStatus: paymentMethod === 'COD' ? 'COD' : 'Pending',
    });

    // 6. If Cash on Delivery, complete immediately without Razorpay
    if (paymentMethod === 'COD') {
      cart.items = [];
      await cart.save();
 
      return res.status(201).json({
        message: 'Order created successfully via Cash on Delivery!',
        order,
      });
    }

    // 7. Create Razorpay order
    const razorpayInstance = getRazorpayInstance();
    const options = {
      amount: Math.round(totalPrice * 100), // amount in paise
      currency: 'INR',
      receipt: order._id.toString(),
    };

    let razorpayOrder;
    try {
      razorpayOrder = await razorpayInstance.orders.create(options);
      // Save Razorpay Order ID to the database order
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();
    } catch (razorpayErr) {
      console.error('Razorpay Order Creation Failed:', razorpayErr);
      return res.status(500).json({
        message: 'Failed to create order on payment gateway',
        error: razorpayErr.message,
      });
    }

    // 7. Clear user cart
    cart.items = [];
    await cart.save();

    // 8. Response with both local order and Razorpay order info
    res.status(201).json({
      message: 'Order created successfully',
      order,
      razorpayOrder,
      razorpayKey: process.env.RAZORPAY_API_KEY,
    });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    // Fetch orders by logged-in user
    const orders = await Order.find({ user: req.user._id })
      .populate('orderItems.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error in getUserOrders:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to the logged-in user or if the user is an admin
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error in getOrderById:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Razorpay payment signature & update order to paid
// @route   POST /api/orders/:id/pay
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Payment credentials are required for verification' });
    }

    const order = await Order.findById(req.params.id).populate('orderItems.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_API_SECRET || '')
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      order.paymentStatus = 'Failed';
      await order.save();
      return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
    }

    // Payment is successful
    order.isPaid = true;
    order.paidAt = Date.now();
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentStatus = 'Success';

    const updatedOrder = await order.save();

    res.json({
      message: 'Payment verified and captured successfully!',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order delivery status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderDeliveryStatus = async (req, res) => {
  try {
    const { deliveryStatus } = req.body;

    if (!deliveryStatus || !['Placed', 'Dispatched', 'Delivered', 'Cancelled'].includes(deliveryStatus)) {
      return res.status(400).json({ message: 'Invalid delivery status value' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.deliveryStatus = deliveryStatus;
    if (deliveryStatus === 'Dispatched') {
      order.dispatchedAt = Date.now();
    } else if (deliveryStatus === 'Delivered') {
      if (!order.dispatchedAt) {
        order.dispatchedAt = Date.now(); // fallback
      }
      order.deliveredAt = Date.now();
    } else if (deliveryStatus === 'Cancelled') {
      order.cancelReason = 'Cancelled by Admin';
      order.cancelledAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error in updateOrderDeliveryStatus:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const { cancelReason, cancelComments } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order belongs to logged-in user or user is an admin
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(401).json({ message: 'Not authorized to cancel this order' });
    }

    // Can only cancel if order status is 'Placed'
    if (order.deliveryStatus !== 'Placed') {
      return res.status(400).json({ message: `Cannot cancel order in '${order.deliveryStatus}' status` });
    }

    order.deliveryStatus = 'Cancelled';
    order.cancelReason = cancelReason || 'Not Specified';
    order.cancelComments = cancelComments || '';
    order.cancelledAt = Date.now();

    const updatedOrder = await order.save();

    res.json({ message: 'Order cancelled successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error in cancelOrder:', error);
    res.status(500).json({ message: error.message });
  }
};

export { createOrder, getUserOrders, getOrderById, verifyPayment, getAllOrders, updateOrderDeliveryStatus, cancelOrder };
