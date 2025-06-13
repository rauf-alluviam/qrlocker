const mongoose = require('mongoose');

const internalRequestSchema = mongoose.Schema(
  {
    requestTitle: {
      type: String,
      required: [true, 'Please add a request title'],
    },
    requestDescription: {
      type: String,
      required: [true, 'Please describe what documents you need'],
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QRUser',
      required: true,
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QRUser',
      required: true,
    }],
    status: {
      type: String,
      enum: ['pending', 'partially_fulfilled', 'fulfilled', 'cancelled'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    responses: [{
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QRUser',
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending',
      },
      responseMessage: {
        type: String,
      },
      sharedQrBundle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QRBundle',
      },
      documents: [{
        fileName: String,
        fileType: String,
        fileSize: Number,
        fileUrl: String,
        key: String,  // S3 key or storage reference
      }],
      respondedAt: {
        type: Date,
      },
    }],
    dueDate: {
      type: Date,
    },
    category: {
      type: String,
      enum: ['document_sharing', 'collaboration', 'review', 'approval', 'other'],
      default: 'document_sharing',
    },
    tags: [String],
    isUrgent: {
      type: Boolean,
      default: false,
    },
    notificationsSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
internalRequestSchema.index({ requester: 1, status: 1 });
internalRequestSchema.index({ recipients: 1, status: 1 });
internalRequestSchema.index({ createdAt: -1 });
internalRequestSchema.index({ dueDate: 1 });

// Virtual to get overall completion percentage
internalRequestSchema.virtual('completionPercentage').get(function() {
  if (this.recipients.length === 0) return 0;
  
  const acceptedResponses = this.responses.filter(r => r.status === 'accepted').length;
  return Math.round((acceptedResponses / this.recipients.length) * 100);
});

// Method to check if request is overdue
internalRequestSchema.methods.isOverdue = function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate && this.status !== 'fulfilled' && this.status !== 'cancelled';
};

// Method to update overall status based on responses
internalRequestSchema.methods.updateStatus = function() {
  const totalRecipients = this.recipients.length;
  const acceptedResponses = this.responses.filter(r => r.status === 'accepted').length;
  const declinedResponses = this.responses.filter(r => r.status === 'declined').length;
  const respondedCount = acceptedResponses + declinedResponses;

  if (acceptedResponses === totalRecipients) {
    this.status = 'fulfilled';
  } else if (acceptedResponses > 0) {
    this.status = 'partially_fulfilled';
  } else if (respondedCount === totalRecipients) {
    // All declined
    this.status = 'cancelled';
  } else {
    this.status = 'pending';
  }
};

module.exports = mongoose.model('InternalRequest', internalRequestSchema);
