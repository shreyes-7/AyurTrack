const httpStatus = require('http-status');
const { User } = require('../models');
const blockchainService = require('./blockchain.service');
const ApiError = require('../utils/ApiError');

/**
 * Create a user with automatic blockchain enrollment
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // Validate location coordinates
  if (!userBody.location || !userBody.location.latitude || !userBody.location.longitude) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Location with latitude and longitude is required');
  }

  // Create user in MongoDB first
  const user = await User.create(userBody);

  // Attempt blockchain enrollment in background
  if (userBody.fabricOrganization) {
    setImmediate(async () => {
      try {
        console.log(`🔗 Attempting blockchain enrollment for user: ${user.email}`);

        const enrollmentResult = await blockchainService.enrollUser(
          user.blockchainUserId,
          userBody.fabricOrganization
        );

        if (enrollmentResult.success) {
          await User.findByIdAndUpdate(user.id, {
            isBlockchainEnrolled: true,
            blockchainEnrollmentDate: new Date()
          });
          console.log(`✅ User ${user.email} successfully enrolled in blockchain`);

          // Create participant in blockchain with location
          await createBlockchainParticipant(user);
        } else {
          console.log(`⚠️ Blockchain enrollment failed for ${user.email}: ${enrollmentResult.message}`);
        }
      } catch (error) {
        console.error(`❌ Blockchain enrollment error for ${user.email}:`, error.message);
      }
    });
  }

  return user;
};

/**
 * Create participant record in blockchain with geolocation
 */
const createBlockchainParticipant = async (user) => {
  try {
    // Fix the path - adjust based on your actual folder structure
    const { getContract } = require('../../fabric/fabricClient'); // Updated path
    const { contract, gateway } = await getContract('admin');

    const participantData = {
      type: user.participantType,
      id: user.blockchainUserId,
      name: user.name,
      location: user.getBlockchainLocation(), // "Address (lat, long)"
      mspId: getMSPId(user.fabricOrganization),
      contact: user.contact,
      certifications: user.certifications || [],
      license: user.license || ''
    };

    await contract.submitTransaction('CreateParticipant', JSON.stringify(participantData));
    await gateway.disconnect();

    console.log(`✅ Blockchain participant created for ${user.email} at location (${user.location.latitude}, ${user.location.longitude})`);
  } catch (error) {
    console.error(`❌ Failed to create blockchain participant:`, error.message);
  }
};

/**
 * Manual blockchain enrollment for existing users
 */
const enrollUserInBlockchain = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.isBlockchainEnrolled) {
    return {
      success: true,
      message: 'User already enrolled in blockchain',
      blockchainUserId: user.blockchainUserId
    };
  }

  const orgName = user.fabricOrganization || 'FarmerOrg';

  const enrollmentResult = await blockchainService.enrollUser(user.blockchainUserId, orgName);

  if (enrollmentResult.success) {
    await updateUserById(userId, {
      isBlockchainEnrolled: true,
      blockchainEnrollmentDate: new Date()
    });

    // Create participant in blockchain
    await createBlockchainParticipant(user);
  }

  return enrollmentResult;
};

/**
 * Get user with blockchain profile
 */
const getUserWithBlockchain = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  let blockchainProfile = null;
  if (user.isBlockchainEnrolled) {
    try {
      const { getContract } = require('../fabric/fabricClient');
      const { contract, gateway } = await getContract('admin');

      const result = await contract.evaluateTransaction(
        'ReadParticipant',
        user.participantType,
        user.blockchainUserId
      );

      blockchainProfile = JSON.parse(result.toString());
      await gateway.disconnect();
    } catch (error) {
      console.error('Failed to fetch blockchain profile:', error.message);
    }
  }

  return {
    ...user.toJSON(),
    blockchainProfile
  };
};

/**
 * Update user and sync with blockchain
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // Validate location coordinates if updating location
  if (updateBody.location) {
    if (!updateBody.location.latitude || !updateBody.location.longitude) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Location must include both latitude and longitude');
    }
  }

  Object.assign(user, updateBody);
  await user.save();

  // Update blockchain participant if enrolled and relevant fields changed
  if (user.isBlockchainEnrolled && (updateBody.name || updateBody.location || updateBody.contact)) {
    setImmediate(async () => {
      try {
        const { getContract } = require('../fabric/fabricClient');
        const { contract, gateway } = await getContract('admin');

        const updateData = {
          name: user.name,
          location: user.getBlockchainLocation(), // Updated location format
          contact: user.contact,
          certifications: user.certifications,
          license: user.license || ''
        };

        await contract.submitTransaction(
          'UpdateParticipant',
          user.participantType,
          user.blockchainUserId,
          JSON.stringify(updateData)
        );

        await gateway.disconnect();
        console.log(`✅ Blockchain participant updated for user ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to update blockchain participant:`, error.message);
      }
    });
  }

  return user;
};

/**
 * Create herb batch with location validation
 */
const createHerbBatch = async (batchData, collectorId) => {
  const user = await getUserById(collectorId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Collector not found');
  }

  if (!user.isBlockchainEnrolled) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User must be enrolled in blockchain to create batches');
  }

  try {
    const { getContract } = require('../fabric/fabricClient');
    const { contract, gateway } = await getContract(user.blockchainUserId);

    const result = await contract.submitTransaction(
      'CreateHerbBatch',
      batchData.batchId,
      batchData.collectionId,
      user.blockchainUserId,
      batchData.latitude.toString(),
      batchData.longitude.toString(),
      batchData.timestamp,
      batchData.species,
      batchData.quantity.toString(),
      JSON.stringify(batchData.quality || {})
    );

    await gateway.disconnect();

    return {
      success: true,
      batch: JSON.parse(result.toString()),
      collector: {
        id: user.blockchainUserId,
        name: user.name,
        location: user.getBlockchainLocation()
      }
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to create herb batch: ${error.message}`);
  }
};

// Helper function
const getMSPId = (fabricOrganization) => {
  const mspMap = {
    'FarmerOrg': 'Org1MSP',
    'ProcessorOrg': 'Org1MSP',
    'CollectorOrg': 'Org1MSP',
    'LabOrg': 'Org2MSP',
    'ManufacturerOrg': 'Org2MSP'
  };
  return mspMap[fabricOrganization] || 'Org1MSP';
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
  getUserWithBlockchain,
  createBlockchainParticipant,
  createHerbBatch,
};
