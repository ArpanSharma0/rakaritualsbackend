import Order from '../models/Order.js';
import Cart from '../models/Cart.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  // 1. Fetch cart of user
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  // 2. Ensure cart is not empty
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  // 3. Ensure shipping address is provided
  const { shippingAddress } = req.body;
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

  // 4. Save order
  const order = await Order.create({
    user: req.user._id,
    orderItems,
    totalPrice,
    shippingAddress,
  });

  // 5. Clear user cart
  cart.items = [];
  await cart.save();

  // 6. Response
  res.status(201).json({
    order,
  });
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  // Fetch orders by logged-in user
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
};

export { createOrder, getUserOrders };
