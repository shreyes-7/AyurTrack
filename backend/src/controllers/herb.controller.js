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
            id: req.query.id,
            name: req.query.name,
            category: req.query.category,
            scientificName: req.query.scientificName
        };

        Object.keys(filter).forEach(key => {
            if (filter[key] === undefined) delete filter[key];
        });

        const result = await HerbService.getAllHerbs(filter);
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

    // NEW BLOCKCHAIN METHODS ADDED
    static initializeBlockchain = catchAsync(async (req, res) => {
        console.log('🚀 Received blockchain initialization request');
        const result = await HerbService.initializeBlockchain();
        
        res.status(result.status === 'SUCCESS' ? httpStatus.OK : httpStatus.INTERNAL_SERVER_ERROR).json({
            success: result.status === 'SUCCESS',
            message: result.message,
            data: result.result || null
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

    // ADDITIONAL BLOCKCHAIN UTILITY METHODS
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

    static getBlockchainSpecies = catchAsync(async (req, res) => {
        const result = await HerbService.getBlockchainData('species');
        
        res.status(httpStatus.OK).json({
            success: result.status === 'SUCCESS',
            message: result.status === 'SUCCESS' ? 'Species rules retrieved successfully' : result.message,
            count: result.data ? result.data.length : 0,
            data: result.data || []
        });
    });

    static getBlockchainProcessors = catchAsync(async (req, res) => {
        const result = await HerbService.getBlockchainData('processors');
        
        res.status(httpStatus.OK).json({
            success: result.status === 'SUCCESS',
            message: result.status === 'SUCCESS' ? 'Processors retrieved successfully' : result.message,
            count: result.data ? result.data.length : 0,
            data: result.data || []
        });
    });

    static getBlockchainLabs = catchAsync(async (req, res) => {
        const result = await HerbService.getBlockchainData('labs');
        
        res.status(httpStatus.OK).json({
            success: result.status === 'SUCCESS',
            message: result.status === 'SUCCESS' ? 'Labs retrieved successfully' : result.message,
            count: result.data ? result.data.length : 0,
            data: result.data || []
        });
    });

    static getBlockchainManufacturers = catchAsync(async (req, res) => {
        const result = await HerbService.getBlockchainData('manufacturers');
        
        res.status(httpStatus.OK).json({
            success: result.status === 'SUCCESS',
            message: result.status === 'SUCCESS' ? 'Manufacturers retrieved successfully' : result.message,
            count: result.data ? result.data.length : 0,
            data: result.data || []
        });
    });

    // TEST BLOCKCHAIN CONNECTION METHOD
    static testBlockchainConnection = catchAsync(async (req, res) => {
        const startTime = Date.now();
        
        try {
            // Test multiple operations
            const farmersResult = await HerbService.getBlockchainData('farmers');
            const speciesResult = await HerbService.getBlockchainData('species');
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            res.status(httpStatus.OK).json({
                success: true,
                message: 'Blockchain connection test completed',
                testResults: {
                    farmersTest: {
                        success: farmersResult.status === 'SUCCESS',
                        count: farmersResult.data ? farmersResult.data.length : 0,
                        error: farmersResult.status === 'ERROR' ? farmersResult.message : null
                    },
                    speciesTest: {
                        success: speciesResult.status === 'SUCCESS',
                        count: speciesResult.data ? speciesResult.data.length : 0,
                        error: speciesResult.status === 'ERROR' ? speciesResult.message : null
                    },
                    performance: {
                        responseTime: `${responseTime}ms`,
                        timestamp: new Date().toISOString()
                    }
                }
            });
        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Blockchain connection test failed',
                error: error.message,
                responseTime: `${responseTime}ms`
            });
        }
    });
}

module.exports = HerbController;
