// src/routes/sms.route.js
const express = require('express');
const validate = require('../../middlewares/validate');
const smsValidation = require('../../validations/sms.validation');
const { smsController } = require('../../controllers');

const router = express.Router();

router.post('/create-collection',
    validate(smsValidation.createCollectionFromSMS),
    smsController.createCollectionFromSMS
);

module.exports = router;
