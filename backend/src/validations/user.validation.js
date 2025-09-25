const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('user', 'admin', 'farmer', 'processor', 'lab', 'manufacturer'),
    fabricOrganization: Joi.string().required().valid('FarmerOrg', 'ProcessorOrg', 'CollectorOrg', 'LabOrg', 'ManufacturerOrg'),
    participantType: Joi.string().required().valid('farmer', 'processor', 'lab', 'manufacturer'),
    location: Joi.object({
      latitude: Joi.number().required().min(-90).max(90),
      longitude: Joi.number().required().min(-180).max(180),
      address: Joi.string().required().trim()
    }).required(),
    contact: Joi.string().required(),
    certifications: Joi.array().items(Joi.string()).optional(),
    license: Joi.string().optional(),
    operationalCapacity: Joi.object({
      dailyCapacity: Joi.string().optional(),
      storageCapacity: Joi.string().optional(),
      processingTypes: Joi.array().items(Joi.string()).optional()
    }).optional(),
    certificationDetails: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        issuer: Joi.string().required(),
        issueDate: Joi.date().required(),
        expiryDate: Joi.date().required(),
        certificateNumber: Joi.string().required()
      })
    ).optional()
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    participantType: Joi.string().valid('farmer', 'processor', 'lab', 'manufacturer'),
    fabricOrganization: Joi.string(),
    isBlockchainEnrolled: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
      role: Joi.string().valid('user', 'admin', 'farmer', 'processor', 'lab', 'manufacturer'),
      fabricOrganization: Joi.string().valid('FarmerOrg', 'ProcessorOrg', 'CollectorOrg', 'LabOrg', 'ManufacturerOrg'),
      participantType: Joi.string().valid('farmer', 'processor', 'lab', 'manufacturer'),
      location: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
        address: Joi.string().trim()
      }),
      contact: Joi.string(),
      certifications: Joi.array().items(Joi.string()),
      license: Joi.string(),
      operationalCapacity: Joi.object({
        dailyCapacity: Joi.string(),
        storageCapacity: Joi.string(),
        processingTypes: Joi.array().items(Joi.string())
      }),
      certificationDetails: Joi.array().items(
        Joi.object({
          type: Joi.string().required(),
          issuer: Joi.string().required(),
          issueDate: Joi.date().required(),
          expiryDate: Joi.date().required(),
          certificateNumber: Joi.string().required()
        })
      )
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const enrollUserBlockchain = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    orgName: Joi.string().valid('FarmerOrg', 'ProcessorOrg', 'CollectorOrg', 'LabOrg', 'ManufacturerOrg').optional(),
  }),
};

const queryParticipants = {
  params: Joi.object().keys({
    participantType: Joi.string().valid('farmer', 'processor', 'lab', 'manufacturer'),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  enrollUserBlockchain,
  queryParticipants,
};
