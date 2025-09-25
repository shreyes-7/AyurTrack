// src/routes/consumer.route.js
const express = require('express');
const validate = require('../../middlewares/validate');
const consumerValidation = require('../../validations/consumer.validation');
const { consumerController } = require('../../controllers');

const router = express.Router();

// Single API endpoint for complete product information
router.get('/product/:batchId',
    validate(consumerValidation.getBatchTraceability),
    consumerController.getCompleteProductInfo
);

module.exports = router;
