const express = require('express');
const router = express.Router();
const {herbController} = require('../../controllers');

router.post('/', herbController.createHerb);
router.get('/', herbController.getAllHerbs);
router.get('/:id', herbController.getHerb);
router.put('/:id', herbController.updateHerb);
router.delete('/:id', herbController.deleteHerb);
router.post('/:id/transfer', herbController.transferHerb);

module.exports = router;
