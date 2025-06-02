const mongoose = require('mongoose');

const departmentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a department name'],
    },
    description: {
      type: String,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    settings: {
      requireApproval: {
        type: Boolean,
        default: false,
      },
      restrictedAccess: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure uniqueness of department name within an organization
departmentSchema.index({ name: 1, organization: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);