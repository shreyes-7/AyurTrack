// src/validations/herb.validation.js
const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createHerb = {
    body: Joi.object().keys({
        id: Joi.string().required(),
        name: Joi.string().required(),
        scientificName: Joi.string().required(),
        commonNames: Joi.array().items(Joi.string()).optional(),
        category: Joi.string().required().valid('MEDICINAL', 'CULINARY', 'AROMATIC', 'ADAPTOGEN', 'DIGESTIVE', 'RESPIRATORY', 'IMMUNE', 'OTHER'),
        parts: Joi.array().items(Joi.string().valid('ROOT', 'LEAF', 'STEM', 'FLOWER', 'SEED', 'BARK', 'FRUIT', 'WHOLE_PLANT')).required(),

        speciesRules: Joi.object({
            geofence: Joi.object({
                center: Joi.object({
                    latitude: Joi.number().min(-90).max(90).required(),
                    longitude: Joi.number().min(-180).max(180).required()
                }).required(),
                radiusMeters: Joi.number().min(1000).required()
            }).optional(),
            allowedMonths: Joi.array().items(Joi.number().min(1).max(12)).optional(),
            qualityThresholds: Joi.object({
                moistureMax: Joi.number().min(0).max(100).optional(),
                pesticidePPMMax: Joi.number().min(0).optional(),
                activeCompounds: Joi.object().optional()
            }).optional()
        }).optional(),

        regulatoryInfo: Joi.object({
            authority: Joi.string().optional(),
            licenseRequired: Joi.boolean().optional(),
            certificationRequired: Joi.array().items(Joi.string()).optional()
        }).optional(),

        cultivationInfo: Joi.object({
            growingSeason: Joi.array().items(Joi.string()).optional(),
            harvestingMethod: Joi.string().optional(),
            dryingMethod: Joi.string().optional(),
            storageRequirements: Joi.string().optional()
        }).optional()
    }),
};

const getHerbs = {
    query: Joi.object().keys({
        id: Joi.string(),
        name: Joi.string(),
        category: Joi.string(),
        scientificName: Joi.string(),
        hasSpeciesRules: Joi.boolean(),
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        sortBy: Joi.string(),
    }),
};

const getHerb = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
};

const updateHerb = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
    body: Joi.object().keys({
        name: Joi.string(),
        scientificName: Joi.string(),
        commonNames: Joi.array().items(Joi.string()),
        category: Joi.string().valid('MEDICINAL', 'CULINARY', 'AROMATIC', 'ADAPTOGEN', 'DIGESTIVE', 'RESPIRATORY', 'IMMUNE', 'OTHER'),
        parts: Joi.array().items(Joi.string().valid('ROOT', 'LEAF', 'STEM', 'FLOWER', 'SEED', 'BARK', 'FRUIT', 'WHOLE_PLANT')),
        speciesRules: Joi.object({
            geofence: Joi.object({
                center: Joi.object({
                    latitude: Joi.number().min(-90).max(90).required(),
                    longitude: Joi.number().min(-180).max(180).required()
                }).required(),
                radiusMeters: Joi.number().min(1000).required()
            }),
            allowedMonths: Joi.array().items(Joi.number().min(1).max(12)),
            qualityThresholds: Joi.object({
                moistureMax: Joi.number().min(0).max(100),
                pesticidePPMMax: Joi.number().min(0),
                activeCompounds: Joi.object()
            })
        }),
        regulatoryInfo: Joi.object(),
        cultivationInfo: Joi.object()
    }).min(1),
};

const deleteHerb = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
};

const updateSpeciesRules = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
    body: Joi.object().keys({
        geofence: Joi.object({
            center: Joi.object({
                latitude: Joi.number().min(-90).max(90).required(),
                longitude: Joi.number().min(-180).max(180).required()
            }).required(),
            radiusMeters: Joi.number().min(1000).required()
        }).required(),
        allowedMonths: Joi.array().items(Joi.number().min(1).max(12)).required(),
        qualityThresholds: Joi.object({
            moistureMax: Joi.number().min(0).max(100).required(),
            pesticidePPMMax: Joi.number().min(0).required(),
            activeCompounds: Joi.object().optional()
        }).required()
    }),
};

const validateLocation = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
    body: Joi.object().keys({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required()
    }),
};

const validateSeason = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
    query: Joi.object().keys({
        month: Joi.number().min(1).max(12).optional()
    }),
};

const validateQuality = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
    body: Joi.object().keys({
        moisture: Joi.number().min(0).max(100).optional(),
        pesticidePPM: Joi.number().min(0).optional()
    }).min(1),
};

const searchHerbs = {
    query: Joi.object().keys({
        q: Joi.string().required(),
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
    }),
};

const getHerbsByCategory = {
    params: Joi.object().keys({
        category: Joi.string().required().valid('MEDICINAL', 'CULINARY', 'AROMATIC', 'ADAPTOGEN', 'DIGESTIVE', 'RESPIRATORY', 'IMMUNE', 'OTHER'),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
    }),
};

module.exports = {
    createHerb,
    getHerbs,
    getHerb,
    updateHerb,
    deleteHerb,
    updateSpeciesRules,
    validateLocation,
    validateSeason,
    validateQuality,
    searchHerbs,
    getHerbsByCategory,
};
