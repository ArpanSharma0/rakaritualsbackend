import Coupon from '../models/Coupon.js';

// @desc    Get active, unexpired coupons
// @route   GET /api/coupons
// @access  Public
const getCoupons = async (req, res) => {
  try {
    const today = new Date();
    // Query where isActive is true and (expiryDate is missing, or expiryDate is in the future)
    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: today } }
      ]
    }).sort({ createdAt: -1 });

    res.json(coupons);
  } catch (error) {
    console.error('Error in getCoupons:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons/admin
// @access  Private/Admin
const getCouponsAdmin = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error('Error in getCouponsAdmin:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minPurchase, description, expiryDate, isActive } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }

    if (discountValue === undefined || discountValue < 0) {
      return res.status(400).json({ message: 'Valid discount value is required' });
    }

    const uppercaseCode = code.trim().toUpperCase();

    // Check if code already exists
    const existing = await Coupon.findOne({ code: uppercaseCode });
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: uppercaseCode,
      discountType: discountType || 'percentage',
      discountValue,
      minPurchase: minPurchase || 0,
      description: description.trim(),
      expiryDate: expiryDate || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(coupon);
  } catch (error) {
    console.error('Error in createCoupon:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a coupon (Admin)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const { code, discountType, discountValue, minPurchase, description, expiryDate, isActive } = req.body;

    if (code) {
      const uppercaseCode = code.trim().toUpperCase();
      // If code is changing, check for uniqueness
      if (uppercaseCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: uppercaseCode });
        if (existing) {
          return res.status(400).json({ message: 'Coupon code already exists' });
        }
        coupon.code = uppercaseCode;
      }
    }

    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) {
      if (discountValue < 0) {
        return res.status(400).json({ message: 'Discount value cannot be negative' });
      }
      coupon.discountValue = discountValue;
    }
    if (minPurchase !== undefined) {
      if (minPurchase < 0) {
        return res.status(400).json({ message: 'Minimum purchase cannot be negative' });
      }
      coupon.minPurchase = minPurchase;
    }
    if (description !== undefined) coupon.description = description.trim();
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate || null;
    if (isActive !== undefined) coupon.isActive = isActive;

    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
  } catch (error) {
    console.error('Error in updateCoupon:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (coupon) {
      await coupon.deleteOne();
      res.json({ message: 'Coupon removed' });
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    console.error('Error in deleteCoupon:', error);
    res.status(500).json({ message: error.message });
  }
};

export {
  getCoupons,
  getCouponsAdmin,
  createCoupon,
  updateCoupon,
  deleteCoupon
};
