// src/controllers/consumer.controller.js
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ConsumerService = require('../services/consumer.service');

class ConsumerController {
    static getCompleteProductInfo = catchAsync(async (req, res) => {
        const { batchId } = req.params;

        const result = await ConsumerService.getCompleteProductInfo(batchId);

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Complete product information retrieved successfully',
            data: result
        });
    });
}

module.exports = ConsumerController;
