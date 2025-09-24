const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('user', 'admin', 'farmer', 'processor', 'lab', 'manufacturer'),
    fabricOrganization: Joi.string().valid('FarmerOrg', 'ProcessorOrg', 'CollectorOrg', 'LabOrg', 'ManufacturerOrg'),
    participantType: Joi.string().valid('farmer', 'processor', 'lab', 'manufacturer'),
    location: Joi.object({
      latitude: Joi.number().required().min(-90).max(90),
      longitude: Joi.number().required().min(-180).max(180),
      address: Joi.string().required().trim()
    }).required(),
    contact: Joi.string().required(),
    certifications: Joi.array().items(Joi.string()).optional(),
    license: Joi.string().optional(),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    participantType: Joi.string(),
    fabricOrganization: Joi.string(),
    isBlockchainEnrolled: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
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

const createHerbBatch = {
  params: Joi.object().keys({
    collectorId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    batchId: Joi.string().required(),
    collectionId: Joi.string().required(),
    latitude: Joi.number().required().min(-90).max(90),
    longitude: Joi.number().required().min(-180).max(180),
    timestamp: Joi.string().required(),
    species: Joi.string().required(),
    quantity: Joi.number().required().positive(),
    quality: Joi.object().optional(),
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
  createHerbBatch,
};
