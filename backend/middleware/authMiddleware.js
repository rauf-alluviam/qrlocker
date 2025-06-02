const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error('Not authorized for this action');
    }
    
    next();
  };
};

// Check if user belongs to the same department or is an admin/supervisor
const checkDepartmentAccess = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.params.departmentId && req.user.department.toString() !== req.params.departmentId) {
    res.status(403);
    throw new Error('Not authorized to access resources from other departments');
  }

  next();
});

module.exports = { protect, authorize };