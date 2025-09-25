// src/routes/batch.route.js
const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const batchValidation = require('../../validations/batch.validation');
const { batchController } = require('../../controllers');

const router = express.Router();

// BLOCKCHAIN ROUTES (place first to avoid conflicts)
router.get('/blockchain/batches',
    auth('getBatches'),
    batchController.getBlockchainBatches
);

router.get('/:batchId/blockchain/provenance',
    auth('getBatches'),
    validate(batchValidation.getBatchProvenance),
    batchController.getBlockchainProvenance
);

// STATISTICS AND DASHBOARD ROUTES
router.get('/statistics',
    auth('getBatches'),
    batchController.getBatchStatistics
);

router.get('/dashboard',
    auth('getBatches'),
    batchController.getDashboardSummary
);

// UTILITY ROUTES
router.get('/status/:currentStatus/transitions',
    auth('getBatches'),
    validate(batchValidation.getValidStatusTransitions),
    batchController.getValidStatusTransitions
);

// FILTERED QUERY ROUTES
router.get('/collector/:collectorId',
    auth('getBatches'),
    validate(batchValidation.getBatchesByCollector),
    batchController.getBatchesByCollector
);

router.get('/species/:species',
    auth('getBatches'),
    validate(batchValidation.getBatchesBySpecies),
    batchController.getBatchesBySpecies
);

router.get('/status/:status',
    auth('getBatches'),
    validate(batchValidation.getBatchesByStatus),
    batchController.getBatchesByStatus
);

// BATCH OPERATIONS ROUTES
router.post('/:batchId/transfer',
    auth('manageBatches'),
    validate(batchValidation.transferBatch),
    batchController.transferBatch
);

router.patch('/:batchId/status',
    auth('manageBatches'),
    validate(batchValidation.updateBatchStatus),
    batchController.updateBatchStatus
);

router.get('/:batchId/provenance',
    auth('getBatches'),
    validate(batchValidation.getBatchProvenance),
    batchController.getBatchProvenance
);

// BASIC CRUD ROUTES
router.route('/')
    .post(auth('createBatch'), validate(batchValidation.createHerbBatch), batchController.createHerbBatch)
    .get(auth('getBatches'), validate(batchValidation.getBatches), batchController.getBatches);

router.route('/:batchId')
    .get(auth('getBatches'), validate(batchValidation.getBatch), batchController.getBatch);

module.exports = router;
