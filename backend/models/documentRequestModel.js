const mongoose = require('mongoose');

const documentRequestSchema = mongoose.Schema(
  {
    requesterName: {
      type: String,
      required: [true, 'Please add your name'],
    },
    requesterEmail: {
      type: String,
      required: [true, 'Please add your email'],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    requestTitle: {
      type: String,
      required: [true, 'Please add a request title'],
    },
    requestDescription: {
      type: String,
      required: [true, 'Please describe what documents you need'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'fulfilled'],
      default: 'pending',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    responseMessage: {
      type: String,
    },
    sharedQrBundle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QRBundle',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DocumentRequest', documentRequestSchema);