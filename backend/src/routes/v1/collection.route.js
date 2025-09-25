// src/routes/collection.route.js
const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const collectionValidation = require('../../validations/collection.validation');
const { collectionController } = require('../../controllers');

const router = express.Router();

// BLOCKCHAIN ROUTES (place first to avoid conflicts)
router.get('/blockchain/collections',
    auth('getCollections'),
    collectionController.getBlockchainCollections
);

router.get('/:collectionId/blockchain',
    auth('getCollections'),
    validate(collectionValidation.getCollection),
    collectionController.getBlockchainCollection
);

// ANALYTICS AND DASHBOARD ROUTES
router.get('/statistics',
    auth('getCollections'),
    validate(collectionValidation.getCollectionStatistics),
    collectionController.getCollectionStatistics
);

router.get('/dashboard',
    auth('getCollections'),
    collectionController.getCollectionDashboard
);

router.get('/map',
    auth('getCollections'),
    collectionController.getCollectionsForMap
);

router.get('/export',
    auth('getCollections'),
    validate(collectionValidation.exportCollections),
    collectionController.exportCollections
);

// QUERY ROUTES BY SPECIFIC CRITERIA
router.get('/collector/:collectorId',
    auth('getCollections'),
    validate(collectionValidation.getCollectionsByCollector),
    collectionController.getCollectionsByCollector
);

router.get('/species/:species',
    auth('getCollections'),
    validate(collectionValidation.getCollectionsBySpecies),
    collectionController.getCollectionsBySpecies
);

router.get('/date-range',
    auth('getCollections'),
    validate(collectionValidation.getCollectionsByDateRange),
    collectionController.getCollectionsByDateRange
);

router.get('/location',
    auth('getCollections'),
    validate(collectionValidation.getCollectionsByLocation),
    collectionController.getCollectionsByLocation
);

// ANALYSIS ROUTES
router.get('/:collectionId/quality-analysis',
    auth('getCollections'),
    validate(collectionValidation.getCollectionQualityAnalysis),
    collectionController.getCollectionQualityAnalysis
);

router.get('/:collectionId/integrity',
    auth('validateCollections'),
    validate(collectionValidation.validateCollectionIntegrity),
    collectionController.validateCollectionIntegrity
);

// BASIC CRUD ROUTES
router.route('/')
    .post(auth('createCollection'), validate(collectionValidation.createHerbCollection), collectionController.createHerbCollection)
    .get(auth('getCollections'), validate(collectionValidation.getCollections), collectionController.getCollections);

router.route('/:collectionId')
    .get(auth('getCollections'), validate(collectionValidation.getCollection), collectionController.getCollection);

module.exports = router;
