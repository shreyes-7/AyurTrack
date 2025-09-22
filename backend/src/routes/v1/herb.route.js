const express = require('express');
const router = express.Router();
const { herbController } = require('../../controllers');

// BLOCKCHAIN ROUTES (place BEFORE other routes to avoid conflicts with /:id)
router.post('/blockchain/init', herbController.initializeBlockchain);
router.get('/blockchain/status', herbController.checkBlockchainStatus);
router.get('/blockchain/test', herbController.testBlockchainConnection);
router.get('/blockchain/data/:type?', herbController.getBlockchainData);

// Specific blockchain data endpoints
router.get('/blockchain/farmers', herbController.getBlockchainFarmers);
router.get('/blockchain/batches', herbController.getBlockchainBatches);
router.get('/blockchain/species', herbController.getBlockchainSpecies);
router.get('/blockchain/processors', herbController.getBlockchainProcessors);
router.get('/blockchain/labs', herbController.getBlockchainLabs);
router.get('/blockchain/manufacturers', herbController.getBlockchainManufacturers);

// Legacy blockchain status route (for backward compatibility)
router.get('/blockchain-status', herbController.checkBlockchainStatus);

// Regular CRUD routes
router.post('/', herbController.createHerb);
router.get('/', herbController.getAllHerbs);
router.get('/:id', herbController.getHerb);
router.put('/:id', herbController.updateHerb);
router.delete('/:id', herbController.deleteHerb);

module.exports = router;
