const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');

// @desc    Get all coupons (Admin only)
// @route   GET /api/coupons
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error('Fetch coupons error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
});

// @desc    Validate a coupon code
// @route   GET /api/coupons/validate/:code
// @access  Private
router.get('/validate/:code', protect, async (req, res) => {
  try {
    const { amount } = req.query;
    if (!amount) {
      return res.status(400).json({ success: false, message: 'Cart amount is required for validation' });
    }

    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon code not found' });
    }

    if (!coupon.active) {
      return res.status(400).json({ success: false, message: 'Coupon is inactive' });
    }

    if (new Date() > coupon.expiryDate) {
      return res.status(400).json({ success: false, message: 'Coupon code has expired' });
    }

    const cartAmount = Number(amount);
    if (cartAmount < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of Rs. ${coupon.minOrderValue} required for this coupon`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully!',
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to validate coupon code' });
  }
});

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, expiryDate } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      expiryDate: new Date(expiryDate)
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
});

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, expiryDate, active } = req.body;
    let coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (code) coupon.code = code.toUpperCase();
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
    if (expiryDate) coupon.expiryDate = new Date(expiryDate);
    if (active !== undefined) coupon.active = active;

    await coupon.save();
    res.status(200).json({ success: true, coupon });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
});

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await coupon.deleteOne();
    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
});

module.exports = router;
