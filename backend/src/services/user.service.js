const httpStatus = require('http-status');
const { User } = require('../models');
const blockchainService = require('./blockchain.service');
const ApiError = require('../utils/ApiError');

/**
 * Create a user with enhanced blockchain enrollment
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const generatePassword = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+[]{}|;:,.<>?";

    // Random length between 8 and 12
    const length = Math.floor(Math.random() * (12 - 8 + 1)) + 8;

    // Ensure at least one letter and one number
    let password = '';
    password += letters.charAt(Math.floor(Math.random() * letters.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));

    const allChars = letters + numbers + symbols;
    for (let i = 2; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle password to avoid predictable pattern
    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    return password;
  };


  const generatedPassword = generatePassword();
  userBody.password = generatedPassword;

  // Validate required fields for blockchain participants
  if (userBody.participantType !== 'user') {
    if (!userBody.location || !userBody.location.latitude || !userBody.location.longitude) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Location with latitude and longitude is required for supply chain participants');
    }
    if (!userBody.contact) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Contact information is required for supply chain participants');
    }
    if (!userBody.fabricOrganization) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Fabric organization is required for supply chain participants');
    }
  }

  // Create user in MongoDB
  const user = await User.create(userBody);
  
  const subject = "Your Account is Created!";
  const html = `
  <p>Hi ${user.name},</p>
  <p>Your account has been created by the admin.</p>
  <p><strong>Email:</strong> ${user.email}</p>
  <p><strong>Password:</strong> ${password}</p> 
  <p>Cheers,<br/>Team, AyurTrace</p>
`;

  await sendMail(user.email, subject, html);


  // Attempt blockchain enrollment for supply chain participants
  if (userBody.participantType !== 'user' && userBody.fabricOrganization) {
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

          // Create participant in blockchain
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
 * Create participant record in blockchain
 */
const createBlockchainParticipant = async (user) => {
  try {
    const { getContract } = require('../fabric/fabricClient');
    const { contract, gateway } = await getContract('admin');

    const participantData = {
      type: user.participantType,
      id: user.blockchainUserId,
      name: user.name,
      location: user.getBlockchainLocation(),
      mspId: getMSPId(user.fabricOrganization),
      contact: user.contact,
      certifications: user.certifications || [],
      license: user.license || '',
      operationalCapacity: user.operationalCapacity || {}
    };

    await contract.submitTransaction('CreateParticipant', JSON.stringify(participantData));
    await gateway.disconnect();

    console.log(`✅ Blockchain participant created for ${user.email}`);

    // Initialize user metrics
    await User.findByIdAndUpdate(user.id, {
      'metrics.totalBatchesHandled': 0,
      'metrics.averageQualityScore': 0,
      'metrics.complianceRate': 100
    });

  } catch (error) {
    console.error(`❌ Failed to create blockchain participant:`, error.message);
    throw error;
  }
};

/**
 * Manual blockchain enrollment
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

  const enrollmentResult = await blockchainService.enrollUser(
    user.blockchainUserId,
    user.fabricOrganization
  );

  if (enrollmentResult.success) {
    await updateUserById(userId, {
      isBlockchainEnrolled: true,
      blockchainEnrollmentDate: new Date()
    });
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
 * Update user with blockchain sync
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // Validate location coordinates if updating
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
          location: user.getBlockchainLocation(),
          contact: user.contact,
          certifications: user.certifications,
          license: user.license || '',
          operationalCapacity: user.operationalCapacity || {}
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
 * Query blockchain participants
 */
const queryBlockchainParticipants = async (participantType) => {
  try {
    const { getContract } = require('../fabric/fabricClient');
    const { contract, gateway } = await getContract('admin');

    const result = await contract.evaluateTransaction('QueryParticipants', participantType);
    const participants = JSON.parse(result.toString());

    await gateway.disconnect();
    return participants;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to query blockchain participants: ${error.message}`);
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
  queryBlockchainParticipants,
};
