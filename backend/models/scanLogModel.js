const mongoose = require('mongoose');

const scanLogSchema = mongoose.Schema(
  {
    qrBundle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QRBundle',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    geoLocation: {
      country: String,
      region: String,
      city: String,
    },
    action: {
      type: String,
      enum: ['scan', 'view', 'download', 'passcode_attempt'],
      default: 'scan',
    },
    success: {
      type: Boolean,
      default: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster analytics queries
scanLogSchema.index({ timestamp: -1 });
scanLogSchema.index({ qrBundle: 1, timestamp: -1 });
scanLogSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('ScanLog', scanLogSchema);