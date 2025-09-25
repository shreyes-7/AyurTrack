const Joi = require('joi');
const { password } = require('./custom.validation');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('user', 'admin', 'farmer', 'processor', 'lab', 'manufacturer'),

    // Enhanced blockchain fields
    fabricOrganization: Joi.string().required().valid('FarmerOrg', 'ProcessorOrg', 'CollectorOrg', 'LabOrg', 'ManufacturerOrg'),
    participantType: Joi.string().required().valid('farmer', 'processor', 'lab', 'manufacturer'),

    // Required location for blockchain geofencing
    location: Joi.object({
      latitude: Joi.number().required().min(-90).max(90),
      longitude: Joi.number().required().min(-180).max(180),
      address: Joi.string().required().trim().min(5).max(200)
    }).required(),

    // Required contact for supply chain
    contact: Joi.string().required().pattern(/^\+\d{2}-\d{10}$/),

    // Optional certification and business fields
    certifications: Joi.array().items(Joi.string().trim()).optional(),
    license: Joi.string().trim().optional(),

    // Enhanced business capacity fields
    operationalCapacity: Joi.object({
      dailyCapacity: Joi.string().optional(),
      storageCapacity: Joi.string().optional(),
      processingTypes: Joi.array().items(Joi.string()).optional()
    }).optional(),

    // Certification details
    certificationDetails: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        issuer: Joi.string().required(),
        issueDate: Joi.date().required(),
        expiryDate: Joi.date().greater(Joi.ref('issueDate')).required(),
        certificateNumber: Joi.string().required()
      })
    ).optional()
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
