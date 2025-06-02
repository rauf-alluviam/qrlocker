const mongoose = require('mongoose');

const organizationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add an organization name'],
      unique: true,
    },
    description: {
      type: String,
    },
    logo: {
      type: String,
    },
    settings: {
      requireApproval: {
        type: Boolean,
        default: false,
      },
      defaultExpiryDays: {
        type: Number,
        default: 30,
      },
      maxViewsDefault: {
        type: Number,
        default: 0, // 0 means unlimited
      },
      ipWhitelisting: {
        enabled: {
          type: Boolean,
          default: false,
        },
        ips: [String],
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Organization', organizationSchema);