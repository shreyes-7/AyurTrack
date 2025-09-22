const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const HerbService = require('../services/herb.service');

class HerbController {

    static createHerb = catchAsync(async (req, res) => {
        const result = await HerbService.createHerb(req.body);
        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Herb created successfully',
            data: result
        });
    });

    static getHerb = catchAsync(async (req, res) => {
        const result = await HerbService.getHerbById(req.params.id);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    static updateHerb = catchAsync(async (req, res) => {
        const result = await HerbService.updateHerb(req.params.id, req.body);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Herb updated successfully',
            data: result
        });
    });

    static deleteHerb = catchAsync(async (req, res) => {
        const result = await HerbService.deleteHerb(req.params.id);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Herb deleted successfully',
            data: result
        });
    });

    static transferHerb = catchAsync(async (req, res) => {
        const { newOwner } = req.body;
        const result = await HerbService.transferHerb(req.params.id, newOwner);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Herb transferred successfully',
            data: result
        });
    });

    static getAllHerbs = catchAsync(async (req, res) => {
        const result = await HerbService.getAllHerbs();
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    static getHerbHistory = catchAsync(async (req, res) => {
        const result = await HerbService.getHerbHistory(req.params.id);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    static getHerbsByOwner = catchAsync(async (req, res) => {
        const result = await HerbService.getHerbsByOwner(req.params.owner);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });
    // src/controllers/herb.controller.js (add this method)
    static checkBlockchainStatus = catchAsync(async (req, res) => {
        const status = await HerbService.checkBlockchainStatus();
        res.status(httpStatus.OK).json({
            success: true,
            blockchain: status
        });
    });

}

module.exports = HerbController;
