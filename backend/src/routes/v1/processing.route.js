// src/routes/processing.route.js
const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const processingValidation = require('../../validations/processing.validation');
const { processingController } = require('../../controllers');

const router = express.Router();

// BLOCKCHAIN ROUTES (place first to avoid conflicts)
router.get('/blockchain/:batchId',
    auth('getProcessing'),
    validate(processingValidation.getBlockchainProcessingSteps),
    processingController.getBlockchainProcessingSteps
);

// ANALYTICS AND DASHBOARD ROUTES
router.get('/statistics',
    auth('getProcessing'),
    validate(processingValidation.getProcessingStatistics),
    processingController.getProcessingStatistics
);

router.get('/dashboard',
    auth('getProcessing'),
    processingController.getProcessingDashboard
);

router.get('/efficiency-report/:facilityId?',
    auth('getProcessing'),
    validate(processingValidation.getProcessingEfficiencyReport),
    processingController.getProcessingEfficiencyReport
);

router.get('/quality-analysis/:stepType',
    auth('getProcessing'),
    validate(processingValidation.getQualityImpactAnalysis),
    processingController.getQualityImpactAnalysis
);

// UTILITY ROUTES
router.get('/valid-steps/:batchStatus',
    auth('getProcessing'),
    validate(processingValidation.getValidProcessingSteps),
    processingController.getValidProcessingSteps
);

// SPECIALIZED QUERY ROUTES
router.get('/batch/:batchId/chain',
    auth('getProcessing'),
    validate(processingValidation.getProcessingChain),
    processingController.getProcessingChain
);

router.get('/batch/:batchId/timeline',
    auth('getProcessing'),
    validate(processingValidation.getBatchProcessingTimeline),
    processingController.getBatchProcessingTimeline
);

router.get('/batch/:batchId',
    auth('getProcessing'),
    validate(processingValidation.getProcessingStepsByBatch),
    processingController.getProcessingStepsByBatch
);

router.get('/facility/:facilityId',
    auth('getProcessing'),
    validate(processingValidation.getProcessingStepsByFacility),
    processingController.getProcessingStepsByFacility
);

router.get('/facility/:facilityId/capacity',
    auth('getProcessing'),
    validate(processingValidation.getProcessingCapacity),
    processingController.getProcessingCapacity
);

router.get('/type/:stepType',
    auth('getProcessing'),
    validate(processingValidation.getProcessingStepsByType),
    processingController.getProcessingStepsByType
);

// PROCESSING OPERATIONS ROUTES
router.post('/batch/:batchId/step',
    auth('manageProcessing'),
    validate(processingValidation.addProcessingStep),
    processingController.addProcessingStep
);

router.get('/:processId/integrity',
    auth('validateProcessing'),
    validate(processingValidation.validateProcessingIntegrity),
    processingController.validateProcessingIntegrity
);

// BASIC CRUD ROUTES
router.route('/')
    .get(auth('getProcessing'), validate(processingValidation.getProcessingSteps), processingController.getProcessingSteps);

router.route('/:processId')
    .get(auth('getProcessing'), validate(processingValidation.getProcessingStep), processingController.getProcessingStep);

module.exports = router;
