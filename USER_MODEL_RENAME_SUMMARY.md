# User Model Rename Summary

## Overview
Successfully renamed the User model to QRUser to avoid conflicts with an existing user collection in the database.

## Changes Made

### 1. Model Definition
- **File**: `backend/models/userModel.js`
- **Change**: Updated `mongoose.model('User', userSchema)` to `mongoose.model('QRUser', userSchema)`

### 2. Controller Updates
Updated all import statements and usage of the User model:

#### userController.js
- Updated import: `const QRUser = require('../models/userModel')`
- Updated all `User.findOne()`, `User.findById()`, `User.find()`, `User.create()` calls to use `QRUser`

#### requestController.js
- Updated import: `const QRUser = require('../models/userModel')`
- Updated `QRUser.find()` call for finding admin users

#### internalRequestController.js
- Updated import: `const QRUser = require('../models/userModel')`
- Updated `QRUser.find()` call for validating recipients

#### authMiddleware.js
- Updated import: `const QRUser = require('../models/userModel')`
- Updated `QRUser.findById()` call in authentication middleware

### 3. Model References
Updated all model references in schema definitions:

#### internalRequestModel.js
- Updated `ref: 'User'` to `ref: 'QRUser'` for requester and recipients fields

#### documentRequestModel.js
- Updated `ref: 'User'` to `ref: 'QRUser'` for assignedTo field

#### documentModel.js
- Updated `ref: 'User'` to `ref: 'QRUser'` for uploadedBy field

#### scanLogModel.js
- Updated `ref: 'User'` to `ref: 'QRUser'` for user field

#### qrBundleModel.js
- Updated `ref: 'User'` to `ref: 'QRUser'` for creator and approver fields

### 4. Analytics Controller
- **File**: `backend/controllers/analyticsController.js`
- **Note**: This file uses `require('../models/userModel').countDocuments({})` which will automatically use the new QRUser model

## Database Impact
- The MongoDB collection name will change from `users` to `qrusers`
- Existing data will need to be migrated if there's existing user data
- The change resolves conflicts with any existing `users` collection

## Testing
- All modified files have been checked for syntax errors
- No compilation errors found
- The application should now use the QRUser model consistently throughout

## Next Steps
If you have existing user data in a `users` collection, you may need to:
1. Export the existing user data
2. Import it into the new `qrusers` collection
3. Update any references in other collections that point to user documents

The model rename has been completed successfully and is ready for use.
