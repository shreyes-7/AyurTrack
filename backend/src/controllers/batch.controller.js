// src/controllers/batch.controller.js
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const BatchService = require('../services/batch.service');
const pick = require('../utils/pick');

class BatchController {

    // Create herb batch with collection
    static createHerbBatch = catchAsync(async (req, res) => {
        const result = await BatchService.createHerbBatch(req.body, req.user);
        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Herb batch created successfully',
            data: result
        });
    });

    // Get single batch
    static getBatch = catchAsync(async (req, res) => {
        const { batchId } = req.params;
        const includeDetails = req.query.details === 'true';

        const result = await BatchService.getBatchById(batchId, includeDetails);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Query batches with filters
    static getBatches = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['collectorId', 'species', 'status', 'currentOwner', 'createdFrom', 'createdTo']);
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await BatchService.queryBatches(filter, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Transfer batch ownership
    static transferBatch = catchAsync(async (req, res) => {
        const { batchId } = req.params;
        const { newOwnerId } = req.body;

        const result = await BatchService.transferBatch(batchId, newOwnerId, req.user);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Batch transferred successfully',
            data: result
        });
    });

    // Update batch status
    static updateBatchStatus = catchAsync(async (req, res) => {
        const { batchId } = req.params;
        const { status } = req.body;

        const result = await BatchService.updateBatchStatus(batchId, status, req.user);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Batch status updated successfully',
            data: result
        });
    });

    // Get batch provenance/traceability
    static getBatchProvenance = catchAsync(async (req, res) => {
        const { batchId } = req.params;

        const result = await BatchService.getBatchProvenance(batchId);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get batches by collector
    static getBatchesByCollector = catchAsync(async (req, res) => {
        const { collectorId } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await BatchService.getBatchesByCollector(collectorId, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get batches by species
    static getBatchesBySpecies = catchAsync(async (req, res) => {
        const { species } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await BatchService.getBatchesBySpecies(species, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get batches by status
    static getBatchesByStatus = catchAsync(async (req, res) => {
        const { status } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await BatchService.getBatchesByStatus(status, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get batch statistics
    static getBatchStatistics = catchAsync(async (req, res) => {
        const result = await BatchService.getBatchStatistics();
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Blockchain-specific endpoints
    static getBlockchainBatches = catchAsync(async (req, res) => {
        const result = await BatchService.getBlockchainBatches();

        if (result.status === 'SUCCESS') {
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Blockchain batches retrieved successfully',
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

    // Get blockchain provenance (direct blockchain call)
    static getBlockchainProvenance = catchAsync(async (req, res) => {
        const { batchId } = req.params;

        const result = await BatchService.getBlockchainProvenance(batchId);

        if (result.status === 'SUCCESS') {
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Blockchain provenance retrieved successfully',
                data: result.data
            });
        } else {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: result.message
            });
        }
    });

    // Utility endpoints
    static getValidStatusTransitions = catchAsync(async (req, res) => {
        const { currentStatus } = req.params;

        const validTransitions = BatchService.getValidStatusTransitions(currentStatus);
        res.status(httpStatus.OK).json({
            success: true,
            currentStatus,
            validTransitions
        });
    });

    // Dashboard summary
    static getDashboardSummary = catchAsync(async (req, res) => {
        const userId = req.user.blockchainUserId;
        const userType = req.user.participantType;

        let filter = {};

        // Filter based on user type
        switch (userType) {
            case 'farmer':
                filter.collectorId = userId;
                break;
            case 'processor':
            case 'lab':
            case 'manufacturer':
                filter.currentOwner = userId;
                break;
            default:
                // Admin can see all
                break;
        }

        const recentBatches = await BatchService.queryBatches(filter, {
            page: 1,
            limit: 5,
            sortBy: '-createdAt'
        });

        const statistics = await BatchService.getBatchStatistics();

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                recentBatches: recentBatches.results,
                statistics,
                userType,
                userId
            }
        });
    });
}

module.exports = BatchController;
