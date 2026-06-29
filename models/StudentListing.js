const mongoose = require('mongoose');

const StudentListingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title for the listing'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  expectedPrice: {
    type: Number,
    required: [true, 'Please add the expected price'],
    min: [0, 'Expected price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Please specify a category']
  },
  condition: {
    type: String,
    enum: ['New', 'Like New', 'Good', 'Fair'],
    required: [true, 'Please specify product condition']
  },
  college: {
    type: String,
    required: [true, 'Please enter your college name'],
    trim: true
  },
  contactEmail: {
    type: String,
    required: [true, 'Please enter contact email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ],
    lowercase: true,
    trim: true
  },
  images: [{
    type: String,
    required: true
  }],
  status: {
    type: String,
    enum: ['Available', 'Sold'],
    default: 'Available'
  },
  reports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isSpam: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index listings for searching
StudentListingSchema.index({ title: 'text', description: 'text', college: 'text' });

module.exports = mongoose.model('StudentListing', StudentListingSchema);
