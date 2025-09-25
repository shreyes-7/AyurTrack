// src/validations/collection.validation.js
const Joi = require('joi');

const createHerbCollection = {
    body: Joi.object().keys({
        species: Joi.string().required(),
        quantity: Joi.number().required().positive().max(1000),
        latitude: Joi.number().required().min(-90).max(90),
        longitude: Joi.number().required().min(-180).max(180),
        quality: Joi.object({
            moisture: Joi.number().required().min(0).max(100),
            pesticidePPM: Joi.number().required().min(0).max(10)
        }).optional(),
        // Optional override fields (system usually auto-generates)
        batchId: Joi.string().optional(),
        collectionId: Joi.string().optional(),
        timestamp: Joi.string().isoDate().optional()
    }),
};

const getCollection = {
    params: Joi.object().keys({
        collectionId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        details: Joi.boolean().optional()
    }),
};

const getCollections = {
    query: Joi.object().keys({
        collectorId: Joi.string().optional(),
        species: Joi.string().optional(),
        batchId: Joi.string().optional(),
        collectionFrom: Joi.date().optional(),
        collectionTo: Joi.date().optional(),

        // Location filters
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional(),
        radiusKm: Joi.number().positive().max(1000).optional(),

        // Quality filters
        minMoisture: Joi.number().min(0).max(100).optional(),
        maxMoisture: Joi.number().min(0).max(100).optional(),
        maxPesticidePPM: Joi.number().min(0).optional(),

        // Pagination
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getCollectionsByCollector = {
    params: Joi.object().keys({
        collectorId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getCollectionsBySpecies = {
    params: Joi.object().keys({
        species: Joi.string().required(),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getCollectionsByDateRange = {
    query: Joi.object().keys({
        startDate: Joi.date().required(),
        endDate: Joi.date().required().greater(Joi.ref('startDate')),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getCollectionsByLocation = {
    query: Joi.object().keys({
        latitude: Joi.number().required().min(-90).max(90),
        longitude: Joi.number().required().min(-180).max(180),
        radiusKm: Joi.number().required().positive().max(1000),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getCollectionQualityAnalysis = {
    params: Joi.object().keys({
        collectionId: Joi.string().required(),
    }),
};

const getCollectionStatistics = {
    query: Joi.object().keys({
        collectorId: Joi.string().optional(),
        species: Joi.string().optional(),
        dateFrom: Joi.date().optional(),
        dateTo: Joi.date().optional(),
    }),
};

const validateCollectionIntegrity = {
    params: Joi.object().keys({
        collectionId: Joi.string().required(),
    }),
};

const exportCollections = {
    query: Joi.object().keys({
        collectorId: Joi.string().optional(),
        species: Joi.string().optional(),
        collectionFrom: Joi.date().optional(),
        collectionTo: Joi.date().optional(),
    }),
};

module.exports = {
    createHerbCollection,
    getCollection,
    getCollections,
    getCollectionsByCollector,
    getCollectionsBySpecies,
    getCollectionsByDateRange,
    getCollectionsByLocation,
    getCollectionQualityAnalysis,
    getCollectionStatistics,
    validateCollectionIntegrity,
    exportCollections,
};
