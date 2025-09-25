// src/routes/consumer.route.js
const express = require('express');
const validate = require('../../middlewares/validate');
const { consumerController } = require('../../controllers');

const router = express.Router();

// Single API endpoint for complete product information
router.get('/product/:batchId',
    consumerController.getCompleteProductInfo
);

module.exports = router;
