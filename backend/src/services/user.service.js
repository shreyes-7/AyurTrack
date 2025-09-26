const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { sendMail } = require('../config/sendMail');
const { registerAndEnrollUser, getContract, userExists, safeDisconnect } = require('../../fabric/fabricClient');

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

  // Random length between 8 and 12
  const length = Math.floor(Math.random() * (12 - 8 + 1)) + 8;

  // Ensure at least one letter and one number
  let password = '';
  password += letters.charAt(Math.floor(Math.random() * letters.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));

  const allChars = letters + numbers; // only alphanumeric
  for (let i = 2; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle password to avoid predictable pattern
  password = password.split('').sort(() => 0.5 - Math.random()).join('');
  return password;
};


  const generatedPassword = generatePassword();
  console.log("Generated Password:", generatedPassword);
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
    <p><strong>Password:</strong> ${generatedPassword}</p> 
    <p>Cheers,<br/>Team, AyurTrace</p>
  `;

  try {
    await sendMail(user.email, subject, html);
    console.log(`✅ Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${user.email}:`, error.message);
  }

  // Attempt blockchain enrollment for supply chain participants
  if (userBody.participantType !== 'user' && userBody.fabricOrganization) {
    setImmediate(async () => {
      try {
        console.log(`🔗 Attempting blockchain enrollment for user: ${user.email}`);
        
        const enrollmentResult = await enrollUserInBlockchain(user.id);

        if (enrollmentResult.success) {
          console.log(`✅ User ${user.email} successfully enrolled in blockchain`);
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
  let gateway = null;
  
  try {
    console.log(`🔗 Creating blockchain participant for user: ${user.email}`);
    
    const { contract, gateway: gw } = await getContract('admin');
    gateway = gw;

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

    console.log(`Creating participant with data:`, participantData);
    await contract.submitTransaction('CreateParticipant', JSON.stringify(participantData));

    console.log(`✅ Blockchain participant created for ${user.email}`);

    // Initialize user metrics
    await User.findByIdAndUpdate(user.id, {
      'metrics.totalBatchesHandled': 0,
      'metrics.averageQualityScore': 0,
      'metrics.complianceRate': 100
    });

    return { success: true, message: 'Participant created successfully' };

  } catch (error) {
    console.error(`❌ Failed to create blockchain participant for ${user.email}:`, error.message);
    throw error;
  } finally {
    await safeDisconnect(gateway);
  }
};

/**
 * Manual blockchain enrollment with improved error handling
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

  try {
    console.log(`🔗 Enrolling user ${user.blockchainUserId} with role ${user.participantType}...`);
    
    // Check if user already exists in blockchain wallet
    const exists = await userExists(user.blockchainUserId);
    if (exists) {
      console.log(`User ${user.blockchainUserId} already exists in blockchain wallet`);
    } else {
      // Register and enroll user with blockchain
      const enrollmentResult = await registerAndEnrollUser(
        user.blockchainUserId, 
        user.participantType
      );

      if (!enrollmentResult.success) {
        throw new Error(enrollmentResult.message || 'Enrollment failed');
      }
      
      console.log(`✅ User ${user.blockchainUserId} enrolled successfully in blockchain`);
    }

    // Update user status in MongoDB
    await updateUserById(userId, {
      isBlockchainEnrolled: true,
      blockchainEnrollmentDate: new Date()
    });

    // Create participant in blockchain
    await createBlockchainParticipant(user);

    return {
      success: true,
      message: 'User enrolled successfully in blockchain',
      blockchainUserId: user.blockchainUserId
    };

  } catch (error) {
    console.error(`❌ Blockchain enrollment failed for user ${user.email}:`, error.message);
    
    // Provide specific error messages based on error type
    let errorMessage = 'Blockchain enrollment failed';
    if (error.message.includes('Authentication failure')) {
      errorMessage = 'Blockchain authentication failed. Please ensure admin is enrolled.';
    } else if (error.message.includes('already enrolled')) {
      errorMessage = 'User already enrolled in blockchain';
    } else if (error.message.includes('fabric-ca request register failed')) {
      errorMessage = 'Certificate Authority registration failed';
    }

    return {
      success: false,
      message: errorMessage,
      error: error.message
    };
  }
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
  let gateway = null;

  if (user.isBlockchainEnrolled) {
    try {
      const { contract, gateway: gw } = await getContract('admin');
      gateway = gw;

      const result = await contract.evaluateTransaction(
        'ReadParticipant',
        user.participantType,
        user.blockchainUserId
      );

      blockchainProfile = JSON.parse(result.toString());

    } catch (error) {
      console.error(`Failed to fetch blockchain profile for ${user.email}:`, error.message);
      blockchainProfile = { error: 'Failed to load blockchain profile' };
    } finally {
      await safeDisconnect(gateway);
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
      let gateway = null;
      try {
        const { contract, gateway: gw } = await getContract('admin');
        gateway = gw;

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

        console.log(`✅ Blockchain participant updated for user ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to update blockchain participant for ${user.email}:`, error.message);
      } finally {
        await safeDisconnect(gateway);
      }
    });
  }

  return user;
};

/**
 * Query blockchain participants
 */
const queryBlockchainParticipants = async (participantType) => {
  let gateway = null;
  
  try {
    const { contract, gateway: gw } = await getContract('admin');
    gateway = gw;

    const result = await contract.evaluateTransaction('QueryParticipants', participantType);
    const participants = JSON.parse(result.toString());

    return participants;
  } catch (error) {
    console.error(`Failed to query blockchain participants:`, error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to query blockchain participants: ${error.message}`);
  } finally {
    await safeDisconnect(gateway);
  }
};

/**
 * Bulk enrollment for existing users
 */
const bulkEnrollUsersInBlockchain = async () => {
  try {
    const unenrolledUsers = await User.find({ 
      participantType: { $ne: 'user' },
      isBlockchainEnrolled: false
    });

    console.log(`🔗 Found ${unenrolledUsers.length} users to enroll in blockchain`);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const user of unenrolledUsers) {
      try {
        const result = await enrollUserInBlockchain(user.id);
        if (result.success) {
          results.success++;
          console.log(`✅ Enrolled ${user.email}`);
        } else {
          results.failed++;
          results.errors.push(`${user.email}: ${result.message}`);
          console.log(`❌ Failed to enroll ${user.email}: ${result.message}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${user.email}: ${error.message}`);
        console.error(`❌ Error enrolling ${user.email}:`, error.message);
      }
    }

    return results;
  } catch (error) {
    console.error('❌ Bulk enrollment failed:', error.message);
    throw error;
  }
};

// Helper function - Updated MSP mapping
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
  bulkEnrollUsersInBlockchain,
};
