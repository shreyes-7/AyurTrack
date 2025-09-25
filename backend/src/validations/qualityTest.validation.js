// src/validations/qualityTest.validation.js
const Joi = require('joi');

const addQualityTest = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
    body: Joi.object().keys({
        testType: Joi.string().required().valid('moisturetest', 'pesticidetest', 'activecompound', 'microbiological', 'heavy_metals'),
        results: Joi.when('testType', {
            switch: [
                {
                    is: 'moisturetest',
                    then: Joi.object({
                        moisture: Joi.number().required().min(0).max(100),
                        method: Joi.string().required(),
                        temperature: Joi.string().required(),
                        standard: Joi.string().optional(),
                        notes: Joi.string().optional()
                    })
                },
                {
                    is: 'pesticidetest',
                    then: Joi.object({
                        pesticidePPM: Joi.number().required().min(0),
                        compounds_tested: Joi.array().items(Joi.string()).required().min(1),
                        method: Joi.string().required(),
                        standard: Joi.string().optional(),
                        notes: Joi.string().optional()
                    })
                },
                {
                    is: 'activecompound',
                    then: Joi.object({
                        method: Joi.string().required(),
                        withanolides: Joi.number().optional().min(0),
                        curcumin: Joi.number().optional().min(0),
                        standard: Joi.string().optional(),
                        notes: Joi.string().optional()
                    })
                },
                {
                    is: 'microbiological',
                    then: Joi.object({
                        method: Joi.string().required(),
                        total_count: Joi.number().optional().min(0),
                        yeast_mold: Joi.number().optional().min(0),
                        ecoli: Joi.number().optional().min(0),
                        salmonella: Joi.number().optional().min(0),
                        standard: Joi.string().optional(),
                        notes: Joi.string().optional()
                    })
                },
                {
                    is: 'heavy_metals',
                    then: Joi.object({
                        method: Joi.string().required(),
                        lead: Joi.number().optional().min(0),
                        mercury: Joi.number().optional().min(0),
                        arsenic: Joi.number().optional().min(0),
                        cadmium: Joi.number().optional().min(0),
                        standard: Joi.string().optional(),
                        notes: Joi.string().optional()
                    })
                }
            ]
        })
    }),
};

const getQualityTest = {
    params: Joi.object().keys({
        testId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        details: Joi.boolean().optional()
    }),
};

const getQualityTests = {
    query: Joi.object().keys({
        batchId: Joi.string().optional(),
        labId: Joi.string().optional(),
        testType: Joi.string().valid('moisturetest', 'pesticidetest', 'activecompound', 'microbiological', 'heavy_metals').optional(),
        pass: Joi.boolean().optional(),
        testFrom: Joi.date().optional(),
        testTo: Joi.date().optional(),
        minMoisture: Joi.number().min(0).max(100).optional(),
        maxMoisture: Joi.number().min(0).max(100).optional(),
        maxPesticidePPM: Joi.number().min(0).optional(),
        minActiveCompound: Joi.number().min(0).optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getQualityTestsByBatch = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getQualityTestsByLab = {
    params: Joi.object().keys({
        labId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getQualityTestsByType = {
    params: Joi.object().keys({
        testType: Joi.string().required().valid('moisturetest', 'pesticidetest', 'activecompound', 'microbiological', 'heavy_metals'),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getQualityReport = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
};

const getQualityStatistics = {
    query: Joi.object().keys({
        labId: Joi.string().optional(),
        testType: Joi.string().valid('moisturetest', 'pesticidetest', 'activecompound', 'microbiological', 'heavy_metals').optional(),
        dateFrom: Joi.date().optional(),
        dateTo: Joi.date().optional(),
    }),
};

const getLabCapacity = {
    params: Joi.object().keys({
        labId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        from: Joi.date().optional(),
        to: Joi.date().optional(),
    }),
};

const getBlockchainQualityTests = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
};

const validateQualityTestIntegrity = {
    params: Joi.object().keys({
        testId: Joi.string().required(),
    }),
};

const getQualityComplianceReport = {
    query: Joi.object().keys({
        labId: Joi.string().optional(),
        testType: Joi.string().valid('moisturetest', 'pesticidetest', 'activecompound', 'microbiological', 'heavy_metals').optional(),
        dateFrom: Joi.date().optional(),
        dateTo: Joi.date().optional(),
    }),
};

const getQualityTrendAnalysis = {
    params: Joi.object().keys({
        testType: Joi.string().required().valid('moisturetest', 'pesticidetest', 'activecompound', 'microbiological', 'heavy_metals'),
    }),
    query: Joi.object().keys({
        labId: Joi.string().optional(),
        dateFrom: Joi.date().optional(),
        dateTo: Joi.date().optional(),
    }),
};

const getFailedTestsAnalysis = {
    query: Joi.object().keys({
        labId: Joi.string().optional(),
        testType: Joi.string().valid('moisturetest', 'pesticidetest', 'activecompound', 'microbiological', 'heavy_metals').optional(),
        dateFrom: Joi.date().optional(),
        dateTo: Joi.date().optional(),
    }),
};

const generateQualityCertificate = {
    params: Joi.object().keys({
        testId: Joi.string().required(),
    }),
};

module.exports = {
    addQualityTest,
    getQualityTest,
    getQualityTests,
    getQualityTestsByBatch,
    getQualityTestsByLab,
    getQualityTestsByType,
    getQualityReport,
    getQualityStatistics,
    getLabCapacity,
    getBlockchainQualityTests,
    validateQualityTestIntegrity,
    getQualityComplianceReport,
    getQualityTrendAnalysis,
    getFailedTestsAnalysis,
    generateQualityCertificate,
};
