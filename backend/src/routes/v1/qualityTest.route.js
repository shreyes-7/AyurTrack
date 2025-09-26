// src/routes/qualityTest.route.js
const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const { qualityTestValidation } = require('../../validations')
const { qualityTestController } = require('../../controllers');

const router = express.Router();

// BLOCKCHAIN ROUTES (place first to avoid conflicts)
router.get('/blockchain/:batchId',
    auth('getQualityTests'),
    validate(qualityTestValidation.getBlockchainQualityTests),
    qualityTestController.getBlockchainQualityTests
);

// ANALYTICS AND DASHBOARD ROUTES
router.get('/statistics',
    auth('getQualityTests'),
    validate(qualityTestValidation.getQualityStatistics),
    qualityTestController.getQualityStatistics
);

router.get('/dashboard',
    auth('getQualityTests'),
    qualityTestController.getQualityTestDashboard
);

router.get('/compliance-report',
    auth('getQualityTests'),
    validate(qualityTestValidation.getQualityComplianceReport),
    qualityTestController.getQualityComplianceReport
);

router.get('/trend-analysis/:testType',
    auth('getQualityTests'),
    validate(qualityTestValidation.getQualityTrendAnalysis),
    qualityTestController.getQualityTrendAnalysis
);

router.get('/failed-analysis',
    auth('getQualityTests'),
    validate(qualityTestValidation.getFailedTestsAnalysis),
    qualityTestController.getFailedTestsAnalysis
);

// SPECIALIZED QUERY ROUTES
router.get('/batch/:batchId/report',
    auth('getQualityTests'),
    validate(qualityTestValidation.getQualityReport),
    qualityTestController.getQualityReport
);

router.get('/batch/:batchId',
    auth('getQualityTests'),
    validate(qualityTestValidation.getQualityTestsByBatch),
    qualityTestController.getQualityTestsByBatch
);

router.get('/lab/:labId',
    auth('getQualityTests'),
    validate(qualityTestValidation.getQualityTestsByLab),
    qualityTestController.getQualityTestsByLab
);

router.get('/lab/:labId/capacity',
    auth('getQualityTests'),
    validate(qualityTestValidation.getLabCapacity),
    qualityTestController.getLabCapacity
);

router.get('/type/:testType',
    auth('getQualityTests'),
    validate(qualityTestValidation.getQualityTestsByType),
    qualityTestController.getQualityTestsByType
);

// QUALITY TEST OPERATIONS ROUTES
router.post('/batch/:batchId/test',
    // auth('manageQualityTests'),
    // validate(qualityTestValidation.addQualityTest),
    qualityTestController.addQualityTest
);

router.get('/:testId/integrity',
    auth('validateQualityTests'),
    validate(qualityTestValidation.validateQualityTestIntegrity),
    qualityTestController.validateQualityTestIntegrity
);

router.post('/:testId/certificate',
    auth('manageQualityTests'),
    validate(qualityTestValidation.generateQualityCertificate),
    qualityTestController.generateQualityCertificate
);

// BASIC CRUD ROUTES
router.route('/')
    .get(auth('getQualityTests'), validate(qualityTestValidation.getQualityTests), qualityTestController.getQualityTests);

router.route('/:testId')
    .get(auth('getQualityTests'), validate(qualityTestValidation.getQualityTest), qualityTestController.getQualityTest);

module.exports = router;
