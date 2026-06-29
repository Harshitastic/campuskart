const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'campuskart_jwt_secret_token_1234567890', {
    expiresIn: '30d'
  });
};

// Helper to send token response in HTTP-Only Cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  // Remove password from output
  const userOutput = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    addresses: user.addresses,
    wishlist: user.wishlist
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: userOutput
    });
};

// @desc    Register a new student user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Try again.' });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Try again.' });
  }
});

// @desc    Logout user / Clear Cookie
// @route   POST /api/auth/logout
// @access  Public
router.post('/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email is already in use' });
      }
      req.user.email = email;
    }

    if (name) req.user.name = name;

    const updatedUser = await req.user.save();
    
    res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        addresses: updatedUser.addresses,
        wishlist: updatedUser.wishlist
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Profile update failed' });
  }
});

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Provide current and new password' });
    }

    // Get user with password field
    const user = await User.findById(req.user.id);
    
    // Check current password
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ success: false, message: 'Password update failed' });
  }
});

// @desc    Add a saved shipping address
// @route   POST /api/auth/addresses
// @access  Private
router.post('/addresses', protect, async (req, res) => {
  try {
    const { name, phone, address, city, state, pinCode, isDefault } = req.body;

    if (!name || !phone || !address || !city || !state || !pinCode) {
      return res.status(400).json({ success: false, message: 'All address fields are required' });
    }

    const user = await User.findById(req.user.id);

    // If setting as default, clear any other default address
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // Add address
    user.addresses.push({
      name,
      phone,
      address,
      city,
      state,
      pinCode,
      isDefault: isDefault || user.addresses.length === 0 // Default if it is first address
    });

    await user.save();
    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ success: false, message: 'Failed to save address' });
  }
});

// @desc    Edit saved address
// @route   PUT /api/auth/addresses/:addressId
// @access  Private
router.put('/addresses/:addressId', protect, async (req, res) => {
  try {
    const { name, phone, address, city, state, pinCode, isDefault } = req.body;
    const user = await User.findById(req.user.id);

    const addr = user.addresses.id(req.params.addressId);
    if (!addr) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
      addr.isDefault = true;
    } else {
      addr.isDefault = isDefault !== undefined ? isDefault : addr.isDefault;
    }

    if (name) addr.name = name;
    if (phone) addr.phone = phone;
    if (address) addr.address = address;
    if (city) addr.city = city;
    if (state) addr.state = state;
    if (pinCode) addr.pinCode = pinCode;

    await user.save();
    res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('Edit address error:', error);
    res.status(500).json({ success: false, message: 'Failed to update address' });
  }
});

// @desc    Delete saved address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
router.delete('/addresses/:addressId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Find address index
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === req.params.addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If we deleted the default address, set the first remaining one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
});

// ==========================================
// ADMIN USER MANAGEMENT ROUTES
// ==========================================

// @desc    Get all users list
// @route   GET /api/auth/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// @desc    Block or Unblock a user
// @route   PUT /api/auth/users/:id/block
// @access  Private/Admin
router.put('/users/:id/block', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot block administrator accounts' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ success: false, message: 'Failed to block/unblock user' });
  }
});

module.exports = router;
