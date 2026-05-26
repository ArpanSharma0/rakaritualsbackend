import User from '../models/User.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        address: user.address,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.email) {
        user.email = req.body.email;
      }
      if (req.body.password) {
        user.password = req.body.password;
      }
      
      // Update address object
      if (req.body.address) {
        user.address.fullName = req.body.address.fullName || user.address.fullName;
        user.address.phone = req.body.address.phone || user.address.phone;
        user.address.addressLine = req.body.address.addressLine || user.address.addressLine;
        user.address.city = req.body.address.city || user.address.city;
        user.address.state = req.body.address.state || user.address.state;
        user.address.postalCode = req.body.address.postalCode || user.address.postalCode;
        user.address.country = req.body.address.country || user.address.country;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        address: updatedUser.address,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};


// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getUserWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');

    if (user) {
      res.json(user.wishlist || []);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist
// @access  Private
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      if (user.wishlist.includes(productId)) {
        res.status(400);
        throw new Error('Product already in wishlist');
      }

      user.wishlist.push(productId);
      await user.save();

      // Return updated, populated wishlist
      const updatedUser = await User.findById(req.user._id).populate('wishlist');
      res.json(updatedUser.wishlist);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.wishlist = user.wishlist.filter(
        (id) => id.toString() !== req.params.productId
      );
      await user.save();

      // Return updated, populated wishlist
      const updatedUser = await User.findById(req.user._id).populate('wishlist');
      res.json(updatedUser.wishlist);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

export { getUserProfile, updateUserProfile, getUserWishlist, addToWishlist, removeFromWishlist };

