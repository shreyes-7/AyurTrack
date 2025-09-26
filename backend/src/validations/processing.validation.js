const Joi = require('joi');

const addProcessingStep = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
    body: Joi.object().keys({
        // ✅ FIXED: Match frontend field names exactly
        processId: Joi.string().optional(),
        facilityId: Joi.string().optional(),
        stepType: Joi.string().required().valid('cleaning', 'drying', 'grinding', 'sorting', 'packaging'),
        timestamp: Joi.string().isoDate().optional(),
        
        // ✅ FIXED: Allow params as both object and string (for JSON.stringify)
        params: Joi.alternatives().try(
            Joi.object(),
            Joi.string()
        ).when('stepType', {
            switch: [
                {
                    is: 'drying',
                    then: Joi.alternatives().try(
                        Joi.object({
                            temperature: Joi.string().required(),
                            duration: Joi.string().required(),
                            method: Joi.string().required(),
                            humidity: Joi.string().optional(),
                            equipment: Joi.string().optional(),
                            operator: Joi.string().optional(),
                            notes: Joi.string().optional()
                        }),
                        Joi.string() // Allow JSON string
                    )
                },
                {
                    is: 'grinding',
                    then: Joi.alternatives().try(
                        Joi.object({
                            meshsize: Joi.string().required(),  // ✅ FIXED: chaincode uses 'meshsize'
                            temperature: Joi.string().optional(),
                            equipment: Joi.string().optional(),
                            operator: Joi.string().optional(),
                            notes: Joi.string().optional()
                        }),
                        Joi.string() // Allow JSON string
                    )
                },
                {
                    is: 'cleaning',
                    then: Joi.alternatives().try(
                        Joi.object({
                            method: Joi.string().optional(),
                            duration: Joi.string().optional(),
                            equipment: Joi.string().optional(),
                            operator: Joi.string().optional(),
                            notes: Joi.string().optional()
                        }).optional(),
                        Joi.string().optional() // Allow JSON string
                    )
                },
                {
                    is: 'sorting',
                    then: Joi.alternatives().try(
                        Joi.object({
                            method: Joi.string().optional(),
                            criteria: Joi.string().optional(),
                            equipment: Joi.string().optional(),
                            operator: Joi.string().optional(),
                            notes: Joi.string().optional()
                        }).optional(),
                        Joi.string().optional() // Allow JSON string
                    )
                },
                {
                    is: 'packaging',
                    then: Joi.alternatives().try(
                        Joi.object({
                            container_type: Joi.string().optional(),
                            seal_type: Joi.string().optional(),
                            equipment: Joi.string().optional(),
                            operator: Joi.string().optional(),
                            notes: Joi.string().optional()
                        }).optional(),
                        Joi.string().optional() // Allow JSON string
                    )
                }
            ]
        })
    }),
};

const getProcessingStep = {
    params: Joi.object().keys({
        processId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        details: Joi.boolean().optional()
    }),
};

const getProcessingSteps = {
    query: Joi.object().keys({
        batchId: Joi.string().optional(),
        facilityId: Joi.string().optional(),
        stepType: Joi.string().valid('cleaning', 'drying', 'grinding', 'sorting', 'packaging').optional(),
        processedFrom: Joi.date().optional(),
        processedTo: Joi.date().optional(),
        temperature: Joi.string().optional(),
        method: Joi.string().optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getProcessingStepsByBatch = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getProcessingStepsByFacility = {
    params: Joi.object().keys({
        facilityId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getProcessingStepsByType = {
    params: Joi.object().keys({
        stepType: Joi.string().required().valid('cleaning', 'drying', 'grinding', 'sorting', 'packaging'),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        sortBy: Joi.string().optional(),
    }),
};

const getProcessingChain = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
};

const getProcessingStatistics = {
    query: Joi.object().keys({
        facilityId: Joi.string().optional(),
        stepType: Joi.string().valid('cleaning', 'drying', 'grinding', 'sorting', 'packaging').optional(),
        dateFrom: Joi.date().optional(),
        dateTo: Joi.date().optional(),
    }),
};

const getProcessingCapacity = {
    params: Joi.object().keys({
        facilityId: Joi.string().required(),
    }),
    query: Joi.object().keys({
        from: Joi.date().optional(),
        to: Joi.date().optional(),
    }),
};

const getValidProcessingSteps = {
    params: Joi.object().keys({
        batchStatus: Joi.string().required().valid(
            'collected',
            'processed-cleaning',
            'processed-drying',
            'processed-grinding',
            'processed-sorting',
            'processed-packaging'
        ),
    }),
};

const getBlockchainProcessingSteps = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
};

const validateProcessingIntegrity = {
    params: Joi.object().keys({
        processId: Joi.string().required(),
    }),
};

const getProcessingEfficiencyReport = {
    params: Joi.object().keys({
        facilityId: Joi.string().optional(),
    }),
    query: Joi.object().keys({
        dateFrom: Joi.date().optional(),
        dateTo: Joi.date().optional(),
    }),
};

const getBatchProcessingTimeline = {
    params: Joi.object().keys({
        batchId: Joi.string().required(),
    }),
};

const getQualityImpactAnalysis = {
    params: Joi.object().keys({
        stepType: Joi.string().required().valid('cleaning', 'drying', 'grinding', 'sorting', 'packaging'),
    }),
};

module.exports = {
    addProcessingStep,
    getProcessingStep,
    getProcessingSteps,
    getProcessingStepsByBatch,
    getProcessingStepsByFacility,
    getProcessingStepsByType,
    getProcessingChain,
    getProcessingStatistics,
    getProcessingCapacity,
    getValidProcessingSteps,
    getBlockchainProcessingSteps,
    validateProcessingIntegrity,
    getProcessingEfficiencyReport,
    getBatchProcessingTimeline,
    getQualityImpactAnalysis,
};
