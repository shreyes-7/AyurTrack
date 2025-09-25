// src/routes/herb.route.js
const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const herbValidation = require('../../validations/herb.validation');
const { herbController } = require('../../controllers');

const router = express.Router();

// BLOCKCHAIN ROUTES (place BEFORE other routes to avoid conflicts)
router.get('/blockchain/status', herbController.checkBlockchainStatus);
router.get('/blockchain/data/:type?', herbController.getBlockchainData);
router.get('/blockchain/farmers', herbController.getBlockchainFarmers);
router.get('/blockchain/batches', herbController.getBlockchainBatches);

// SEARCH AND FILTER ROUTES
router.get('/search', validate(herbValidation.searchHerbs), herbController.searchHerbs);
router.get('/category/:category', validate(herbValidation.getHerbsByCategory), herbController.getHerbsByCategory);

// SPECIES RULES ROUTES (before /:id routes)
router.put('/:id/species-rules',
    auth('manageSpeciesRules'),
    validate(herbValidation.updateSpeciesRules),
    herbController.updateSpeciesRules
);

router.get('/:id/species-rules',
    auth('getHerbs'),
    validate(herbValidation.getHerb),
    herbController.getSpeciesRules
);

router.get('/:id/species-rules/blockchain',
    auth('getHerbs'),
    validate(herbValidation.getHerb),
    herbController.getBlockchainSpeciesRules
);

// VALIDATION ROUTES
router.post('/:id/validate/location',
    auth('validateCollection'),
    validate(herbValidation.validateLocation),
    herbController.validateLocation
);

router.get('/:id/validate/season',
    auth('validateCollection'),
    validate(herbValidation.validateSeason),
    herbController.validateHarvestSeason
);

router.post('/:id/validate/quality',
    auth('validateCollection'),
    validate(herbValidation.validateQuality),
    herbController.validateQuality
);

// BASIC CRUD ROUTES
router.route('/')
    .post(auth('manageHerbs'), validate(herbValidation.createHerb), herbController.createHerb)
    .get(auth('getHerbs'), validate(herbValidation.getHerbs), herbController.getAllHerbs);

router.route('/:id')
    .get(auth('getHerbs'), validate(herbValidation.getHerb), herbController.getHerb)
    .put(auth('manageHerbs'), validate(herbValidation.updateHerb), herbController.updateHerb)
    .delete(auth('manageHerbs'), validate(herbValidation.deleteHerb), herbController.deleteHerb);

module.exports = router;
