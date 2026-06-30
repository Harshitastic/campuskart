require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('../config/db');

const app = express();

// Configure CORS - Allow cross-origin requests with credentials
const corsOptions = {
  origin: true, // Allow all origins dynamically, or configure to specific origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Built-in body parsing middlewares
app.use(express.json({ limit: '10mb' })); // Support larger Base64 payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Middleware to ensure DB connection is active
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error in middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// Mount API Endpoints
app.use('/api/auth', require('../routes/auth'));
app.use('/api/categories', require('../routes/categories'));
app.use('/api/products', require('../routes/products'));
app.use('/api/listings', require('../routes/studentListings'));
app.use('/api/orders', require('../routes/orders'));
app.use('/api/coupons', require('../routes/coupons'));
app.use('/api/reviews', require('../routes/reviews'));
app.use('/api/upload', require('../routes/upload'));
app.use('/api/admin', require('../routes/admin'));

// Fallback: Send index.html for undefined requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Run server only when executed directly
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`CampusKart Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Export app for Vercel Serverless Function compatibility
module.exports = app;
