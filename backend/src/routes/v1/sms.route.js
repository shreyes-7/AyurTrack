// src/routes/sms.route.js
const express = require('express');
const validate = require('../../middlewares/validate');
const { smsController } = require('../../controllers');

const router = express.Router();

router.post('/create-collection',
    smsController.createCollectionFromSMS
);

module.exports = router;
