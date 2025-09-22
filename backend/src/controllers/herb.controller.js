// src/controllers/herb.controller.js
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const HerbService = require('../services/herb.service');

class HerbController {

    static createHerb = catchAsync(async (req, res) => {
        const result = await HerbService.createHerb(req.body);
        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Herb master record created successfully',
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
            message: 'Herb master record updated successfully',
            data: result
        });
    });

    static deleteHerb = catchAsync(async (req, res) => {
        const result = await HerbService.deleteHerb(req.params.id);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Herb master record deleted successfully',
            data: result
        });
    });

    static getAllHerbs = catchAsync(async (req, res) => {
        const filter = {
            name: req.query.name,
            category: req.query.category,
            scientificName: req.query.scientificName
        };

        // Remove undefined values
        Object.keys(filter).forEach(key => {
            if (filter[key] === undefined) delete filter[key];
        });

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sort: req.query.sort || { name: 1 }
        };

        const result = await HerbService.getAllHerbs(filter, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    static getHerbsByCategory = catchAsync(async (req, res) => {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10
        };

        const result = await HerbService.getHerbsByCategory(req.params.category, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    static searchHerbs = catchAsync(async (req, res) => {
        const { q: searchTerm } = req.query;
        if (!searchTerm) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Search term is required'
            });
        }

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10
        };

        const result = await HerbService.searchHerbs(searchTerm, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    static checkBlockchainStatus = catchAsync(async (req, res) => {
        const status = await HerbService.checkBlockchainStatus();
        res.status(httpStatus.OK).json({
            success: true,
            blockchain: status
        });
    });

}

module.exports = HerbController;
