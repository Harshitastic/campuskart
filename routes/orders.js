const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');
const Razorpay = require('razorpay');

// Initialize Razorpay
const hasRazorpayKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
let razorpay;
if (hasRazorpayKeys) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('Razorpay Service Configured');
} else {
  console.log('Razorpay keys missing. Razorpay payments will run in Mock Mode.');
}

// Helper: Reduce product inventory stock
const reduceStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity }
    });
  }
};

// @desc    Create a new order (COD or Razorpay initialization)
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in cart' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    if (!['COD', 'Razorpay'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    // Verify prices and stock levels against database
    let subtotal = 0;
    const validatedItems = [];

    for (const cartItem of items) {
      const product = await Product.findById(cartItem.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${cartItem.name} not found` });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available stock: ${product.stock}`
        });
      }

      const itemPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      subtotal += itemPrice * cartItem.quantity;

      validatedItems.push({
        product: product._id,
        name: product.name,
        price: itemPrice,
        quantity: cartItem.quantity,
        image: product.images[0]
      });
    }

    // Process coupons
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isValid(subtotal)) {
        if (coupon.discountType === 'percentage') {
          discount = Math.round(subtotal * (coupon.discountValue / 100));
        } else {
          discount = coupon.discountValue;
        }
        // Ensure discount is not greater than subtotal
        discount = Math.min(discount, subtotal);
      }
    }

    // Shipping fee setup: Free shipping above Rs. 499, otherwise flat Rs. 40
    const shippingCharges = subtotal - discount >= 499 ? 0 : 40;
    const grandTotal = subtotal - discount + shippingCharges;

    // Create base order record
    const orderData = {
      user: req.user.id,
      items: validatedItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'Pending',
      subtotal,
      discount,
      shippingCharges,
      grandTotal,
      orderStatus: 'Pending'
    };

    if (paymentMethod === 'COD') {
      // Create COD order immediately
      const order = await Order.create(orderData);
      
      // Deduct inventory stock
      await reduceStock(validatedItems);

      return res.status(201).json({
        success: true,
        order,
        message: 'Order placed successfully using COD!'
      });
    } else {
      // Payment method is Razorpay
      // Create order in database first
      const order = await Order.create(orderData);

      // Create Razorpay Order
      let razorpayOrder;
      const razorpayOptions = {
        amount: grandTotal * 100, // Amount in paise
        currency: 'INR',
        receipt: `receipt_order_${order._id.toString().slice(-6)}`
      };

      if (hasRazorpayKeys) {
        try {
          razorpayOrder = await razorpay.orders.create(razorpayOptions);
          order.razorpayOrderId = razorpayOrder.id;
          await order.save();
        } catch (rzpErr) {
          console.error('Razorpay API Error, fallback to mock mode:', rzpErr);
          // Setup mock Razorpay order id if API fails
          order.razorpayOrderId = `rzp_mock_${Math.random().toString(36).slice(2, 10)}`;
          await order.save();
        }
      } else {
        // Mock mode (offline keys)
        order.razorpayOrderId = `rzp_mock_${Math.random().toString(36).slice(2, 10)}`;
        await order.save();
      }

      return res.status(201).json({
        success: true,
        order,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_keys',
        razorpayOrderId: order.razorpayOrderId,
        isMockMode: !hasRazorpayKeys
      });
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
});

// @desc    Verify Razorpay payment status
// @route   POST /api/orders/verify
// @access  Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayPaymentId) {
      return res.status(400).json({ success: false, message: 'Payment validation fields are missing' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Associated order not found' });
    }

    // Verify signature if keys are active
    if (hasRazorpayKeys && razorpaySignature) {
      const crypto = require('crypto');
      const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      shasum.update(`${order.razorpayOrderId}|${razorpayPaymentId}`);
      const digest = shasum.digest('hex');

      if (digest !== razorpaySignature) {
        order.paymentStatus = 'Failed';
        order.orderStatus = 'Cancelled';
        await order.save();
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    }

    // Update payment details
    order.paymentStatus = 'Paid';
    order.orderStatus = 'Confirmed';
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    // Deduct stock levels on payment success
    await reduceStock(order.items);

    res.status(200).json({
      success: true,
      message: 'Payment verified and order placed successfully!',
      order
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment details' });
  }
});

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Fetch my orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Allow user to view their own order or admins to view any order
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Fetch order details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order details' });
  }
});

// ==========================================
// ADMIN ORDER MANAGEMENT ROUTES
// ==========================================

// @desc    Get all orders list (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Admin fetch orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders list' });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const allowedStatuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status type' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = orderStatus;
    
    // Automatically flag payment status if marked as delivered for COD
    if (orderStatus === 'Delivered' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'Paid';
    }

    await order.save();
    res.status(200).json({ success: true, order, message: `Order status updated to "${orderStatus}"` });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

module.exports = router;
