const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

// @desc    Create a product review (Only verified purchasers)
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Product ID, rating, and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Verify user has purchased this product and the order was delivered
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      'items.product': productId,
      orderStatus: 'Delivered'
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'Only verified purchasers who have received this product can write a review.'
      });
    }

    // Check if user already reviewed this product
    const alreadyReviewed = await Review.findOne({ user: req.user.id, product: productId });
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      user: req.user.id,
      product: productId,
      rating: Number(rating),
      comment,
      verifiedPurchase: true
    });

    // Re-fetch review to populate user details
    const populatedReview = await Review.findById(review._id).populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review: populatedReview
    });
  } catch (error) {
    console.error('Submit review error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
});

// @desc    Get all reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Only creator of review or admin can delete
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();
    
    // Recalculate rating in product schema
    await Review.calculateAverageRating(review.product);

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
});

module.exports = router;
