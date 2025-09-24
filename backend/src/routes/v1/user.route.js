const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser)
  .get(auth('getUsers'), validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(auth('getUsers'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('manageUsers'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('manageUsers'), validate(userValidation.deleteUser), userController.deleteUser);

// Blockchain-specific routes
router
  .route('/:userId/blockchain')
  .get(auth('getUsers'), validate(userValidation.getUser), userController.getUserWithBlockchain);

router
  .route('/:userId/blockchain/enroll')
  .post(auth('manageUsers'), validate(userValidation.enrollUserBlockchain), userController.enrollUserInBlockchain);

router
  .route('/:userId/blockchain/status')
  .get(auth('getUsers'), validate(userValidation.getUser), userController.getUserBlockchainStatus);

router
  .route('/blockchain/participants/:participantType')
  .get(auth('getUsers'), validate(userValidation.queryParticipants), userController.queryBlockchainParticipants);

// Herb batch creation
router
  .route('/:collectorId/batches')
  .post(auth('manageUsers'), validate(userValidation.createHerbBatch), userController.createHerbBatch);

module.exports = router;
