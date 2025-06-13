const mongoose = require('mongoose');
const crypto = require('crypto');

const qrBundleSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    description: {
      type: String,
    },
    uuid: {
      type: String,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    qrCodeUrl: {
      type: String,
    },
    hmacSignature: {
      type: String,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QRUser',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: false,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: false,
    },
    documents: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document',
        },
      ],
      validate: {
        validator: function(documents) {
          // Check for duplicate document IDs
          const uniqueDocuments = new Set(documents.map(doc => doc.toString()));
          return uniqueDocuments.size === documents.length;
        },
        message: 'Duplicate documents are not allowed in a QR bundle'
      }
    },
    accessControl: {
      isPublic: {
        type: Boolean,
        default: false,
      },
      hasPasscode: {
        type: Boolean,
        default: false,
      },
      passcode: {
        type: String,
      },
      showLockStatus: {
        type: Boolean,
        default: false,
      },
      expiryDate: {
        type: Date,
      },
      publishDate: {
        type: Date,
        default: Date.now,
      },
      maxViews: {
        type: Number,
        default: 0, // 0 means unlimited
      },
      currentViews: {
        type: Number,
        default: 0,
      },
    },
    approvalStatus: {
      required: {
        type: Boolean,
        default: false,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'published'],
        default: 'published',
      },
      approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QRUser',
      },
      approvalDate: {
        type: Date,
      },
      approvalNotes: {
        type: String,
      },
    },
    customMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Method to check if QR bundle is accessible
qrBundleSchema.methods.isAccessible = function () {
  const now = new Date();
  
  // Check if published date is in future
  if (this.accessControl.publishDate && this.accessControl.publishDate > now) {
    return false;
  }

  // Check if expired
  if (this.accessControl.expiryDate && this.accessControl.expiryDate < now) {
    return false;
  }

  // Check if max views reached
  if (this.accessControl.maxViews > 0 && 
      this.accessControl.currentViews >= this.accessControl.maxViews) {
    return false;
  }

  // Check approval status if required
  if (this.approvalStatus.required && this.approvalStatus.status !== 'approved' && 
      this.approvalStatus.status !== 'published') {
    return false;
  }

  return true;
};

module.exports = mongoose.model('QRBundle', qrBundleSchema);