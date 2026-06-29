const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Please add a comment'],
    trim: true
  },
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Enforce unique review per user per product
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to calculate average rating of a product
ReviewSchema.statics.calculateAverageRating = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        rating: { $avg: '$rating' },
        reviewsCount: { $sum: 1 }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      await this.model('Product').findByIdAndUpdate(productId, {
        rating: parseFloat(stats[0].rating.toFixed(1)),
        reviewsCount: stats[0].reviewsCount
      });
    } else {
      await this.model('Product').findByIdAndUpdate(productId, {
        rating: 0,
        reviewsCount: 0
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Re-calculate rating on save
ReviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.product);
});

// Re-calculate rating on delete
ReviewSchema.post('deleteOne', { document: true, query: false }, function() {
  this.constructor.calculateAverageRating(this.product);
});

module.exports = mongoose.model('Review', ReviewSchema);
