import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// @desc    Get logged in user cart
// @route   GET /api/cart
// @access  Private
const getUserCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (cart) {
    res.json(cart);
  } else {
    res.json({ user: req.user._id, items: [] });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Validate stock before adding
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.countInStock <= 0) {
      return res.status(400).json({ message: `"${product.name}" is out of stock` });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        const newQty = cart.items[itemIndex].quantity + quantity;
        if (newQty > product.countInStock) {
          return res.status(400).json({ message: `Only ${product.countInStock} available in stock` });
        }
        cart.items[itemIndex].quantity = newQty;
      } else {
        if (quantity > product.countInStock) {
          return res.status(400).json({ message: `Only ${product.countInStock} available in stock` });
        }
        cart.items.push({ product: productId, quantity });
      }
      cart = await cart.save();
    } else {
      if (quantity > product.countInStock) {
        return res.status(400).json({ message: `Only ${product.countInStock} available in stock` });
      }
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity }],
      });
    }

    res.status(201).json(cart);
  } catch (error) {
    console.error('Error in addToCart:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;

    // Validate stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (quantity > product.countInStock) {
      return res.status(400).json({ message: `Only ${product.countInStock} available in stock` });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        res.json(cart);
      } else {
        res.status(404).json({ message: 'Item not found in cart' });
      }
    } else {
      res.status(404).json({ message: 'Cart not found' });
    }
  } catch (error) {
    console.error('Error in updateCartItem:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  const productId = req.params.productId;

  const cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();
    res.json(cart);
  } else {
    res.status(404);
    throw new Error('Cart not found');
  }
};

export { getUserCart, addToCart, updateCartItem, removeFromCart };
