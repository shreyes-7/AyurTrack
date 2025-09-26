// src/controllers/herb.controller.js
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const HerbService = require('../services/herb.service');
const pick = require('../utils/pick');

class HerbController {

    // Basic CRUD Operations
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

    static getAllHerbs = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['herbId', 'name', 'category', 'scientificName', 'hasSpeciesRules']);
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await HerbService.getAllHerbs(filter, options);
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

    // Species Rules Management
    static updateSpeciesRules = catchAsync(async (req, res) => {
        const result = await HerbService.updateSpeciesRules(req.params.id, req.body);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Species rules updated successfully',
            data: result
        });
    });

    static getSpeciesRules = catchAsync(async (req, res) => {
        const result = await HerbService.getSpeciesRules(req.params.id);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Validation Endpoints
    static validateLocation = catchAsync(async (req, res) => {
        const { id } = req.params;
        const { latitude, longitude } = req.body;

        const result = await HerbService.validateLocationForCollection(id, latitude, longitude);
        res.status(httpStatus.OK).json({
            success: true,
            validation: result
        });
    });

    static validateHarvestSeason = catchAsync(async (req, res) => {
        const { id } = req.params;
        const { month } = req.query;

        const result = await HerbService.validateHarvestSeason(id, month ? parseInt(month) : null);
        res.status(httpStatus.OK).json({
            success: true,
            validation: result
        });
    });

    static validateQuality = catchAsync(async (req, res) => {
        const { id } = req.params;
        const qualityData = req.body;

        const result = await HerbService.validateQualityParameters(id, qualityData);
        res.status(httpStatus.OK).json({
            success: true,
            validation: result
        });
    });

    // Blockchain Operations
    static checkBlockchainStatus = catchAsync(async (req, res) => {
        const status = await HerbService.checkBlockchainStatus();
        res.status(httpStatus.OK).json({
            success: true,
            blockchain: status
        });
    });

    static getBlockchainData = catchAsync(async (req, res) => {
        const dataType = req.params.type || req.query.type || 'farmers';
        const result = await HerbService.getBlockchainData(dataType);

        if (result.status === 'SUCCESS') {
            res.status(httpStatus.OK).json({
                success: true,
                dataType: result.dataType,
                count: result.data ? result.data.length : 0,
                data: result.data
            });
        } else {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: result.message
            });
        }
    });

    static getBlockchainSpeciesRules = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await HerbService.getBlockchainSpeciesRules(id);

        if (result.status === 'SUCCESS') {
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Blockchain species rules retrieved successfully',
                data: result.data
            });
        } else {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: result.message
            });
        }
    });

    // Specific blockchain data endpoints
    static getBlockchainFarmers = catchAsync(async (req, res) => {
        const result = await HerbService.getBlockchainData('farmers');

        res.status(httpStatus.OK).json({
            success: result.status === 'SUCCESS',
            message: result.status === 'SUCCESS' ? 'Farmers retrieved successfully' : result.message,
            count: result.data ? result.data.length : 0,
            data: result.data || []
        });
    });

    static getBlockchainBatches = catchAsync(async (req, res) => {
        const result = await HerbService.getBlockchainData('batches');

        res.status(httpStatus.OK).json({
            success: result.status === 'SUCCESS',
            message: result.status === 'SUCCESS' ? 'Herb batches retrieved successfully' : result.message,
            count: result.data ? result.data.length : 0,
            data: result.data || []
        });
    });

    // Search functionality
    static searchHerbs = catchAsync(async (req, res) => {
        const { q: searchTerm } = req.query;
        if (!searchTerm) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Search term is required'
            });
        }

        const options = pick(req.query, ['page', 'limit']);

        try {
            const result = await HerbService.searchHerbs(searchTerm, options);
            res.status(httpStatus.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Search failed',
                error: error.message
            });
        }
    });

    // Category-based retrieval
    static getHerbsByCategory = catchAsync(async (req, res) => {
        const { category } = req.params;
        const options = pick(req.query, ['page', 'limit']);

        const result = await HerbService.getAllHerbs({ category }, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });
}

module.exports = HerbController;
