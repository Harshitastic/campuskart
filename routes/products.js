const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

// @desc    Get all products (with search, category filter, price bounds, sorting, pagination)
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sortBy, page = 1, limit = 9 } = req.query;

    const query = {};

    // Search query filter (matches name, brand, description)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter (accepts category slug or ID)
    if (category) {
      const categoryObj = await Category.findOne({
        $or: [{ slug: category }, { name: category }]
      });
      if (categoryObj) {
        query.category = categoryObj._id;
      } else if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      }
    }

    // Price boundary filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Setup sorting configuration
    let sortConfig = { createdAt: -1 }; // Default: Latest arrivals
    if (sortBy) {
      if (sortBy === 'priceAsc') sortConfig = { price: 1 };
      else if (sortBy === 'priceDesc') sortConfig = { price: -1 };
      else if (sortBy === 'rating') sortConfig = { rating: -1 };
      else if (sortBy === 'latest') sortConfig = { createdAt: -1 };
    }

    // Execution of pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalProducts / limitNum),
        totalProducts
      }
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch catalog' });
  }
});

// @desc    Get related products (products under same category, excluding the main product)
// @route   GET /api/products/:id/related
// @access  Public
router.get('/:id/related', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    })
      .populate('category', 'name slug')
      .limit(4);

    res.status(200).json({ success: true, products: related });
  } catch (error) {
    console.error('Fetch related products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch related products' });
  }
});

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Fetch single product error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product details' });
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, brand, category, price, discountPrice, description, specifications, images, stock } = req.body;

    if (!name || !brand || !category || !price || !description || !images || images.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const product = await Product.create({
      name,
      brand,
      category,
      price,
      discountPrice: discountPrice || 0,
      description,
      specifications: specifications || [],
      images,
      stock
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// @desc    Update product details
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, brand, category, price, discountPrice, description, specifications, images, stock } = req.body;
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (name) product.name = name;
    if (brand) product.brand = brand;
    if (category) product.category = category;
    if (price !== undefined) product.price = price;
    if (discountPrice !== undefined) product.discountPrice = discountPrice;
    if (description) product.description = description;
    if (specifications) product.specifications = specifications;
    if (images) product.images = images;
    if (stock !== undefined) product.stock = stock;

    await product.save();
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.deleteOne();
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

module.exports = router;
