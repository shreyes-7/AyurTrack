const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true,
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Enhanced blockchain-related fields
    blockchainUserId: {
      type: String,
      unique: true,
      sparse: true,
    },
    fabricOrganization: {
      type: String,
      default: 'FarmerOrg',
      enum: ['FarmerOrg', 'ProcessorOrg', 'CollectorOrg', 'LabOrg', 'ManufacturerOrg']
    },
    participantType: {
      type: String,
      enum: ['farmer', 'processor', 'lab', 'manufacturer'],
      default: 'farmer'
    },
    isBlockchainEnrolled: {
      type: Boolean,
      default: false,
    },
    blockchainEnrollmentDate: {
      type: Date
    },
    // Location as latitude and longitude (required for blockchain)
    location: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
        validate: {
          validator: function (value) {
            return !isNaN(value) && isFinite(value);
          },
          message: 'Latitude must be a valid number between -90 and 90'
        }
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
        validate: {
          validator: function (value) {
            return !isNaN(value) && isFinite(value);
          },
          message: 'Longitude must be a valid number between -180 and 180'
        }
      },
      address: {
        type: String,
        trim: true,
        required: true
      }
    },
    // Additional business fields
    contact: {
      type: String,
      trim: true,
      required: true
    },
    certifications: [{
      type: String,
      trim: true
    }],
    license: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
  }
);
userSchema.add({
  // Enhanced blockchain integration
  blockchainWallet: {
    address: String,
    privateKey: String, // Encrypted
    publicKey: String
  },

  // Supply chain specific fields
  operationalCapacity: {
    dailyCapacity: String,
    storageCapacity: String,
    processingTypes: [String]
  },

  // Certification tracking
  certificationDetails: [{
    type: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    certificateNumber: String
  }],

  // Performance metrics
  metrics: {
    totalBatchesHandled: { type: Number, default: 0 },
    averageQualityScore: { type: Number, default: 0 },
    complianceRate: { type: Number, default: 100 }
  }
});
// Add existing plugins and methods
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

// Add geospatial index for location queries
userSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

// Helper method to get formatted location for blockchain
userSchema.methods.getBlockchainLocation = function () {
  return `${this.location.address} (${this.location.latitude}, ${this.location.longitude})`;
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  // Generate blockchain user ID if not exists
  if (!user.blockchainUserId && !user.isModified('blockchainUserId')) {
    const prefix = user.participantType ? user.participantType.charAt(0).toUpperCase() : 'U';
    user.blockchainUserId = `${prefix}${String(Date.now()).slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
  }

  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
