// src/validations/formulation.validation.js
const Joi = require('joi');

const createFormulation = {
    body: Joi.object().keys({
        inputBatches: Joi.array().items(Joi.string()).min(1).max(10).required(),
        formulationParams: Joi.object({
            product_type: Joi.string().required().valid('capsules', 'tablets', 'powder', 'syrup', 'oil'),
            dosage: Joi.string().required(),
            batch_size: Joi.string().required(),
            formula_ratio: Joi.object().optional(),
            excipients: Joi.array().items(Joi.string()).optional(),
            tablet_weight: Joi.string().optional(),
            capsule_size: Joi.string().optional(),
            powder_mesh_size: Joi.string().optional(),
            storage_conditions: Joi.string().optional()
        }).required()
    }),
};

const getFormulation = {
    params: Joi.object().keys({
        productBatchId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        details: Joi.boolean().optional()
    }),
};

const getFormulations = {
    query: Joi.object().keys({
        manufacturerId: Joi.string().optional(),
        productType: Joi.string().valid('capsules', 'tablets', 'powder', 'syrup', 'oil').optional(),
        qrToken: Joi.string().optional(),
        createdFrom: Joi.date().optional(),
        createdTo: Joi.date().optional(),
        productionFrom: Joi.date().optional(),
        productionTo: Joi.date().optional(),
        minBatchSize: Joi.number().integer().positive().optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getFormulationByQR = {
    params: Joi.object().keys({
        qrToken: Joi.string().required(),
    }),
};

const getProvenance = {
    params: Joi.object().keys({
        productBatchId: Joi.string().required(),
    }),
};

const generateQRCode = {
    params: Joi.object().keys({
        productBatchId: Joi.string().required(),
    }),
};

const getFormulationsByManufacturer = {
    params: Joi.object().keys({
        manufacturerId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getFormulationsByProductType = {
    params: Joi.object().keys({
        productType: Joi.string().required().valid('capsules', 'tablets', 'powder', 'syrup', 'oil'),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getFormulationStatistics = {
    query: Joi.object().keys({
        manufacturerId: Joi.string().optional(),
        dateFrom: Joi.date().optional(),
        dateTo: Joi.date().optional(),
    }),
};

const getProductCatalog = {
    query: Joi.object().keys({
        productType: Joi.string().valid('capsules', 'tablets', 'powder', 'syrup', 'oil').optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(50).optional(),
    }),
};

const getBatchUtilizationReport = {
    query: Joi.object().keys({
        dateFrom: Joi.date().optional(),
        dateTo: Joi.date().optional(),
    }),
};

const getQualityComplianceReport = {
    params: Joi.object().keys({
        manufacturerId: Joi.string().optional(),
    }),
};

module.exports = {
    createFormulation,
    getFormulation,
    getFormulations,
    getFormulationByQR,
    getProvenance,
    generateQRCode,
    getFormulationsByManufacturer,
    getFormulationsByProductType,
    getFormulationStatistics,
    getProductCatalog,
    getBatchUtilizationReport,
    getQualityComplianceReport,
};
