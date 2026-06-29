const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify user session
const protect = async (req, res, next) => {
  let token;

  // Retrieve token from cookies or Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, login required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campuskart_jwt_secret_token_1234567890');

    // Fetch user from DB, exclude password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User session expired or user not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth protect error:', error);
    return res.status(401).json({ success: false, message: 'Session invalid or expired' });
  }
};

// Grant access to specific roles only
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
};

module.exports = { protect, admin };
