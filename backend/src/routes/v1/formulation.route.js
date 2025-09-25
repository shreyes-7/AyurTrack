// src/routes/formulation.route.js
const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const formulationValidation = require('../../validations/formulation.validation');
const { formulationController } = require('../../controllers');

const router = express.Router();

// BLOCKCHAIN ROUTES (place first to avoid conflicts)
router.get('/blockchain/formulations',
    // auth('getFormulations'),
    formulationController.getBlockchainFormulations
);

// PUBLIC QR SCAN ROUTE (no auth required for consumer access)
router.get('/qr/:qrToken',
    validate(formulationValidation.getFormulationByQR),
    formulationController.getFormulationByQR
);

// PUBLIC PRODUCT CATALOG (no auth required for consumer access)
router.get('/catalog',
    validate(formulationValidation.getProductCatalog),
    formulationController.getProductCatalog
);

// ANALYTICS AND DASHBOARD ROUTES
router.get('/statistics',
    auth('getFormulations'),
    validate(formulationValidation.getFormulationStatistics),
    formulationController.getFormulationStatistics
);

router.get('/dashboard',
    auth('getFormulations'),
    formulationController.getFormulationDashboard
);

router.get('/reports/batch-utilization',
    auth('getFormulations'),
    validate(formulationValidation.getBatchUtilizationReport),
    formulationController.getBatchUtilizationReport
);

router.get('/reports/quality-compliance/:manufacturerId?',
    auth('getFormulations'),
    validate(formulationValidation.getQualityComplianceReport),
    formulationController.getQualityComplianceReport
);

// FILTERED QUERY ROUTES
router.get('/manufacturer/:manufacturerId',
    auth('getFormulations'),
    validate(formulationValidation.getFormulationsByManufacturer),
    formulationController.getFormulationsByManufacturer
);

router.get('/product-type/:productType',
    auth('getFormulations'),
    validate(formulationValidation.getFormulationsByProductType),
    formulationController.getFormulationsByProductType
);

// FORMULATION OPERATIONS ROUTES
router.post('/:productBatchId/generate-qr',
    auth('manageFormulations'),
    validate(formulationValidation.generateQRCode),
    formulationController.generateQRCode
);

router.get('/:productBatchId/provenance',
    auth('getFormulations'),
    validate(formulationValidation.getProvenance),
    formulationController.getProvenance
);

router.get('/:productBatchId/blockchain/provenance',
    auth('getFormulations'),
    validate(formulationValidation.getProvenance),
    formulationController.getBlockchainProvenance
);

// BASIC CRUD ROUTES
router.route('/')
  .post(
    // auth('createFormulation'),  // <-- comment this out temporarily
    validate(formulationValidation.createFormulation),
    formulationController.createFormulation
  )
  .get(auth('getFormulations'), validate(formulationValidation.getFormulations), formulationController.getFormulations);


router.route('/:productBatchId')
    .get(auth('getFormulations'), validate(formulationValidation.getFormulation), formulationController.getFormulation);

module.exports = router;
