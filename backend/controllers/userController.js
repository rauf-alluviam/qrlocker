const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRUser = require('../models/userModel');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, organization, department } = req.body;

  // Check if user already exists
  const userExists = await QRUser.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create new user
  const user = await QRUser.create({
    name,
    email,
    password,
    role: role || 'user',
    organization,
    department,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      department: user.department,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, token } = req.body;

  // Check for user email
  const user = await QRUser.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // If 2FA is enabled, verify token
  if (user.twoFactorEnabled) {
    if (!token) {
      res.status(200).json({
        requireTwoFactor: true,
        message: 'Two-factor authentication required',
      });
      return;
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      res.status(401);
      throw new Error('Invalid two-factor authentication token');
    }
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    department: user.department,
    twoFactorEnabled: user.twoFactorEnabled,
    token: generateToken(user._id),
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await QRUser.findById(req.user._id).select('-password -twoFactorSecret');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await QRUser.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      organization: updatedUser.organization,
      department: updatedUser.department,
      twoFactorEnabled: updatedUser.twoFactorEnabled,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Setup 2FA for user
// @route   POST /api/users/2fa/setup
// @access  Private
const setup2FA = asyncHandler(async (req, res) => {
  const user = await QRUser.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Generate new secret
  const secret = speakeasy.generateSecret({
    name: `QRLocker:${user.email}`,
  });

  // Save the secret
  user.twoFactorSecret = secret.base32;
  await user.save();

  res.json({
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
  });
});

// @desc    Verify and enable 2FA
// @route   POST /api/users/2fa/verify
// @access  Private
const verify2FA = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await QRUser.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify token
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
  });

  if (!verified) {
    res.status(400);
    throw new Error('Invalid verification code');
  }

  // Enable 2FA
  user.twoFactorEnabled = true;
  await user.save();

  res.json({
    success: true,
    message: 'Two-factor authentication enabled',
  });
});

// @desc    Disable 2FA
// @route   POST /api/users/2fa/disable
// @access  Private
const disable2FA = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await QRUser.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid password');
  }

  // Verify token if 2FA is enabled
  if (user.twoFactorEnabled) {
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      res.status(400);
      throw new Error('Invalid verification code');
    }
  }

  // Disable 2FA
  user.twoFactorEnabled = false;
  user.twoFactorSecret = null;
  await user.save();

  res.json({
    success: true,
    message: 'Two-factor authentication disabled',
  });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await QRUser.find({})
    .select('-password -twoFactorSecret')
    .populate('organization', 'name')
    .populate('department', 'name');
  
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await QRUser.findById(req.params.id)
    .select('-password -twoFactorSecret')
    .populate('organization', 'name')
    .populate('department', 'name');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await QRUser.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.organization = req.body.organization || user.organization;
    user.department = req.body.department || user.department;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      organization: updatedUser.organization,
      department: updatedUser.department,
      twoFactorEnabled: updatedUser.twoFactorEnabled,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await QRUser.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  setup2FA,
  verify2FA,
  disable2FA,
};