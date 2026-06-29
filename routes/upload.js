const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadImage } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

// @desc    Upload a single image
// @route   POST /api/upload/single
// @access  Private
router.post('/single', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const imageUrl = await uploadImage(req.file);

    res.status(200).json({
      success: true,
      url: imageUrl
    });
  } catch (error) {
    console.error('Single upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Image upload failed' });
  }
});

// @desc    Upload multiple images (max 5)
// @route   POST /api/upload/multiple
// @access  Private
router.post('/multiple', protect, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one file' });
    }

    const uploadPromises = req.files.map(file => uploadImage(file));
    const imageUrls = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      urls: imageUrls
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Multiple image upload failed' });
  }
});

module.exports = router;
