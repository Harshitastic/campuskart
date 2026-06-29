const express = require('express');
const router = express.Router();
const StudentListing = require('../models/StudentListing');
const { protect, admin } = require('../middleware/auth');

// @desc    Get all active student listings (with search, category, college, condition, price filters)
// @route   GET /api/listings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, category, college, condition, minPrice, maxPrice, includeSold = 'false' } = req.query;

    const query = { isSpam: false };

    // Handle sold listings filtering (hide sold by default unless requested)
    if (includeSold === 'false') {
      query.status = 'Available';
    }

    // Search query filter (matches title, description, college)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { college: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (college) {
      query.college = { $regex: college, $options: 'i' };
    }

    if (condition) {
      query.condition = condition;
    }

    if (minPrice || maxPrice) {
      query.expectedPrice = {};
      if (minPrice) query.expectedPrice.$gte = Number(minPrice);
      if (maxPrice) query.expectedPrice.$lte = Number(maxPrice);
    }

    const listings = await StudentListing.find(query)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error('Fetch listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student listings' });
  }
});

// @desc    Get current user's listings
// @route   GET /api/listings/my-listings
// @access  Private
router.get('/my-listings', protect, async (req, res) => {
  try {
    const listings = await StudentListing.find({ seller: req.user.id })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error('Fetch my listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your listings' });
  }
});

// @desc    Get all listings for admin view (including spam & sold)
// @route   GET /api/listings/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const listings = await StudentListing.find({})
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error('Admin fetch listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student listings' });
  }
});

// @desc    Get single listing details
// @route   GET /api/listings/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await StudentListing.findById(req.params.id)
      .populate('seller', 'name email');
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    res.status(200).json({ success: true, listing });
  } catch (error) {
    console.error('Fetch single listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch listing details' });
  }
});

// @desc    Create student listing
// @route   POST /api/listings
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, expectedPrice, category, condition, college, contactEmail, images } = req.body;

    if (!title || !description || expectedPrice === undefined || !category || !condition || !college || !contactEmail || !images || images.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const listing = await StudentListing.create({
      seller: req.user.id,
      title,
      description,
      expectedPrice,
      category,
      condition,
      college,
      contactEmail,
      images
    });

    res.status(201).json({ success: true, listing });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to create listing' });
  }
});

// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, expectedPrice, category, condition, college, contactEmail, images } = req.body;
    let listing = await StudentListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Check ownership
    if (listing.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this listing' });
    }

    if (title) listing.title = title;
    if (description) listing.description = description;
    if (expectedPrice !== undefined) listing.expectedPrice = expectedPrice;
    if (category) listing.category = category;
    if (condition) listing.condition = condition;
    if (college) listing.college = college;
    if (contactEmail) listing.contactEmail = contactEmail;
    if (images) listing.images = images;

    await listing.save();
    res.status(200).json({ success: true, listing });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to update listing' });
  }
});

// @desc    Update listing availability status (Available / Sold)
// @route   PUT /api/listings/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Available', 'Sold'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide valid status (Available or Sold)' });
    }

    let listing = await StudentListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Check ownership
    if (listing.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this listing' });
    }

    listing.status = status;
    await listing.save();

    res.status(200).json({ success: true, listing });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update listing status' });
  }
});

// @desc    Report listing as spam
// @route   PUT /api/listings/:id/report
// @access  Private
router.put('/:id/report', protect, async (req, res) => {
  try {
    let listing = await StudentListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Check if user already reported this listing
    if (listing.reports.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You have already reported this listing' });
    }

    listing.reports.push(req.user.id);
    
    // Auto-flag as spam if reported by 3 or more users
    if (listing.reports.length >= 3) {
      listing.isSpam = true;
    }

    await listing.save();

    res.status(200).json({ success: true, message: 'Listing has been reported successfully', listing });
  } catch (error) {
    console.error('Report listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to report listing' });
  }
});

// @desc    Delete listing
// @route   DELETE /api/listings/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await StudentListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Check ownership or admin status
    if (listing.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this listing' });
    }

    await listing.deleteOne();
    res.status(200).json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete listing' });
  }
});

module.exports = router;
