const mongoose = require('mongoose');

const documentSchema = mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    qrId: {
      type: String,
      unique: true,
      sparse: true, // This allows multiple documents without qrId field
    },
    fileSize: {
      type: Number,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
    },
    s3Url: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QRUser',
      required: false, // Changed to false to allow documents without a user
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
    tags: [String],
    description: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    optimizedUrl: {
      type: String,
    },
    bundle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QRBundle',
    },
    relatedDocuments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    }],
  },
  {
    timestamps: true,
  }
);

// Create a partial filter index on qrId field - only applies when qrId exists
documentSchema.index({ qrId: 1 }, { 
  unique: true, 
  background: true,
  partialFilterExpression: { qrId: { $exists: true } }
});

module.exports = mongoose.model('Document', documentSchema);