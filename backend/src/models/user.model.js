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
    // New blockchain-related fields
    blockchainUserId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values to be non-unique
    },
    fabricOrganization: {
      type: String,
      default: 'FarmerOrg',
      enum: ['FarmerOrg', 'ProcessorOrg', 'CollectorOrg', 'LabOrg', 'ManufacturerOrg']
    },
    isBlockchainEnrolled: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

// Add existing plugins and methods
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  // Generate blockchain user ID if not exists
  if (!user.blockchainUserId && !user.isModified('blockchainUserId')) {
    user.blockchainUserId = `user_${user._id}_${Date.now()}`;
  }

  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
