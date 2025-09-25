// src/controllers/sms.controller.js
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const SmsService = require('../services/sms.service');

class SmsController {

    static createCollectionFromSMS = catchAsync(async (req, res) => {
        const { userId, herbId, quantity } = req.body;

        const result = await SmsService.createCollectionFromSMS(userId, herbId, quantity);

        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Collection created from SMS successfully',
            data: result
        });
    });
}

module.exports = SmsController;
