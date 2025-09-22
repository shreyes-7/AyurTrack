const httpStatus = require('http-status');
const { User } = require('../models');
const blockchainService = require('./blockchain.service');
const ApiError = require('../utils/ApiError');

const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // Create user in MongoDB
  const user = await User.create(userBody);

  // Attempt blockchain enrollment
  try {
    const enrollmentResult = await blockchainService.enrollUser(
      user.blockchainUserId,
      user.fabricOrganization
    );

    if (enrollmentResult.success) {
      user.isBlockchainEnrolled = true;
      await user.save();
    }
  } catch (error) {
    console.error('Blockchain enrollment failed during user creation:', error);
    // Don't fail user creation if blockchain enrollment fails
  }

  return user;
};

// Add blockchain enrollment method
const enrollUserInBlockchain = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.isBlockchainEnrolled) {
    return { message: 'User already enrolled in blockchain' };
  }

  const enrollmentResult = await blockchainService.enrollUser(
    user.blockchainUserId,
    user.fabricOrganization
  );

  if (enrollmentResult.success) {
    user.isBlockchainEnrolled = true;
    await user.save();
  }

  return enrollmentResult;
};

// Keep existing methods
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

const getUserById = async (id) => {
  return User.findById(id);
};

const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  enrollUserInBlockchain,
};
