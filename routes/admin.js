const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const StudentListing = require('../models/StudentListing');
const Order = require('../models/Order');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

// @desc    Get dashboard analytics metrics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', protect, admin, async (req, res) => {
  try {
    // 1. Gather Total Counts
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments({});
    const totalListings = await StudentListing.countDocuments({});
    const totalOrders = await Order.countDocuments({});

    // 2. Calculate Total Revenue (only count paid orders or non-cancelled COD orders)
    const revenueStats = await Order.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: 'Paid' },
            { paymentMethod: 'COD', orderStatus: { $ne: 'Cancelled' } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' }
        }
      }
    ]);
    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

    // 3. Find Low Stock Products (Stock < 10)
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .populate('category', 'name')
      .limit(5);

    // 4. Fetch Recent Orders
    const recentOrders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Aggregate Best Selling Products
    const bestSellers = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
          totalQty: { $sum: '$items.quantity' },
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ]);

    // 6. Aggregate Category-wise Sales
    const categorySales = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      // Join with Products to get Category ID
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      // Join with Categories to get Category Name
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.category',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      { $unwind: '$categoryDetails' },
      {
        $group: {
          _id: '$categoryDetails.name',
          salesValue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          unitsSold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { salesValue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        totalProducts,
        totalListings,
        totalOrders,
        totalRevenue,
        lowStockProducts,
        recentOrders,
        bestSellers,
        categorySales
      }
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    res.status(500).json({ success: false, message: 'Failed to compile dashboard analytics' });
  }
});

module.exports = router;
