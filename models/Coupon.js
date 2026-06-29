const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a coupon code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: [0, 'Discount value cannot be negative']
  },
  minOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please specify an expiry date']
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Helper check if coupon is valid for a given order amount
CouponSchema.methods.isValid = function(amount) {
  const isExpired = new Date() > this.expiryDate;
  const isBelowMinVal = amount < this.minOrderValue;
  return this.active && !isExpired && !isBelowMinVal;
};

module.exports = mongoose.model('Coupon', CouponSchema);
