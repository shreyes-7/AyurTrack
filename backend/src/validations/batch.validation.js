// src/validations/batch.validation.js
const Joi = require('joi');

const createHerbBatch = {
    body: Joi.object().keys({
        species: Joi.string().required(),
        quantity: Joi.number().required().positive().max(1000),
        latitude: Joi.number().required().min(-90).max(90),
        longitude: Joi.number().required().min(-180).max(180),
        quality: Joi.object({
            moisture: Joi.number().required().min(0).max(100),
            pesticidePPM: Joi.number().required().min(0).max(10)
        }).required()
    }),
};

const getBatch = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        details: Joi.boolean().optional()
    }),
};

const getBatches = {
    query: Joi.object().keys({
        collectorId: Joi.string().optional(),
        species: Joi.string().optional(),
        status: Joi.string().optional().valid(
            'collected',
            'processed-cleaning',
            'processed-drying',
            'processed-grinding',
            'processed-sorting',
            'processed-packaging',
            'quality-tested',
            'quality-fail',
            'used_in_formulation'
        ),
        currentOwner: Joi.string().optional(),
        createdFrom: Joi.date().optional(),
        createdTo: Joi.date().optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const transferBatch = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
    body: Joi.object().keys({
        newOwnerId: Joi.string().required()
    }),
};

const updateBatchStatus = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
    body: Joi.object().keys({
        status: Joi.string().required().valid(
            'collected',
            'processed-cleaning',
            'processed-drying',
            'processed-grinding',
            'processed-sorting',
            'processed-packaging',
            'quality-tested',
            'quality-fail',
            'used_in_formulation'
        )
    }),
};

const getBatchProvenance = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
};

const getBatchesByCollector = {
    params: Joi.object().keys({
        collectorId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getBatchesBySpecies = {
    params: Joi.object().keys({
        species: Joi.string().required(),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getBatchesByStatus = {
    params: Joi.object().keys({
        status: Joi.string().required().valid(
            'collected',
            'processed-cleaning',
            'processed-drying',
            'processed-grinding',
            'processed-sorting',
            'processed-packaging',
            'quality-tested',
            'quality-fail',
            'used_in_formulation'
        ),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getValidStatusTransitions = {
    params: Joi.object().keys({
        currentStatus: Joi.string().required().valid(
            'collected',
            'processed-cleaning',
            'processed-drying',
            'processed-grinding',
            'processed-sorting',
            'processed-packaging',
            'quality-tested',
            'quality-fail',
            'used_in_formulation'
        ),
    }),
};

module.exports = {
    createHerbBatch,
    getBatch,
    getBatches,
    transferBatch,
    updateBatchStatus,
    getBatchProvenance,
    getBatchesByCollector,
    getBatchesBySpecies,
    getBatchesByStatus,
    getValidStatusTransitions,
};
