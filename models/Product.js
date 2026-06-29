const mongoose = require('mongoose');

const SpecificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true }
});

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Please add a brand name'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please associate a category']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be positive']
  },
  discountPrice: {
    type: Number,
    default: 0,
    validate: {
      validator: function(val) {
        return val < this.price;
      },
      message: 'Discount price must be less than regular price'
    }
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  specifications: [SpecificationSchema],
  images: [{
    type: String,
    required: true
  }],
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound search index for searching products
ProductSchema.index({ name: 'text', brand: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
