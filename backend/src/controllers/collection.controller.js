// src/controllers/collection.controller.js
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const CollectionService = require('../services/collection.service');
const pick = require('../utils/pick');

class CollectionController {

    // Create herb collection
    static createHerbCollection = catchAsync(async (req, res) => {
        const result = await CollectionService.createHerbCollection(req.body, req.user);
        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Herb collection created successfully',
            data: result
        });
    });

    // Get single collection
    static getCollection = catchAsync(async (req, res) => {
        const { collectionId } = req.params;
        const includeDetails = req.query.details === 'true';

        const result = await CollectionService.getCollectionById(collectionId, includeDetails);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Query collections with filters
    static getCollections = catchAsync(async (req, res) => {
        const filter = pick(req.query, [
            'collectorId',
            'species',
            'batchId',
            'collectionFrom',
            'collectionTo',
            'latitude',
            'longitude',
            'radiusKm',
            'minMoisture',
            'maxMoisture',
            'maxPesticidePPM'
        ]);
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await CollectionService.queryCollections(filter, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get collections by collector
    static getCollectionsByCollector = catchAsync(async (req, res) => {
        const { collectorId } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await CollectionService.getCollectionsByCollector(collectorId, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get collections by species
    static getCollectionsBySpecies = catchAsync(async (req, res) => {
        const { species } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await CollectionService.getCollectionsBySpecies(species, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get collections by date range
    static getCollectionsByDateRange = catchAsync(async (req, res) => {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Both startDate and endDate are required'
            });
        }

        const options = pick(req.query, ['page', 'limit', 'sortBy']);
        const result = await CollectionService.getCollectionsByDateRange(startDate, endDate, options);

        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get collections by location (within radius)
    static getCollectionsByLocation = catchAsync(async (req, res) => {
        const { latitude, longitude, radiusKm } = req.query;

        if (!latitude || !longitude || !radiusKm) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'latitude, longitude, and radiusKm are required'
            });
        }

        const options = pick(req.query, ['page', 'limit', 'sortBy']);
        const result = await CollectionService.getCollectionsByLocation(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(radiusKm),
            options
        );

        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get collection quality analysis
    static getCollectionQualityAnalysis = catchAsync(async (req, res) => {
        const { collectionId } = req.params;

        const result = await CollectionService.getCollectionQualityAnalysis(collectionId);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get collection statistics
    static getCollectionStatistics = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['collectorId', 'species', 'dateFrom', 'dateTo']);

        const result = await CollectionService.getCollectionStatistics(filter);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Blockchain-specific endpoints
    static getBlockchainCollections = catchAsync(async (req, res) => {
        const result = await CollectionService.getBlockchainCollections();

        if (result.status === 'SUCCESS') {
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Blockchain collections retrieved successfully',
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

    static getBlockchainCollection = catchAsync(async (req, res) => {
        const { collectionId } = req.params;

        const result = await CollectionService.getBlockchainCollection(collectionId);

        if (result.status === 'SUCCESS') {
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Blockchain collection retrieved successfully',
                data: result.data
            });
        } else {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: result.message
            });
        }
    });

    // Validate collection data integrity between MongoDB and blockchain
    static validateCollectionIntegrity = catchAsync(async (req, res) => {
        const { collectionId } = req.params;

        const result = await CollectionService.validateCollectionIntegrity(collectionId);
        res.status(httpStatus.OK).json({
            success: true,
            validation: result
        });
    });

    // Dashboard and analytics endpoints
    static getCollectionDashboard = catchAsync(async (req, res) => {
        const userId = req.user.blockchainUserId;
        const userType = req.user.participantType;

        let filter = {};

        // Filter based on user type
        if (userType === 'farmer') {
            filter.collectorId = userId;
        }
        // For other user types, show all collections (with appropriate permissions)

        // Recent collections
        const recentCollections = await CollectionService.queryCollections(filter, {
            page: 1,
            limit: 5,
            sortBy: '-collectionTimestamp'
        });

        // Statistics
        const statistics = await CollectionService.getCollectionStatistics(filter);

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                recentCollections: recentCollections.results,
                statistics,
                userType,
                userId
            }
        });
    });

    // Get collections for map visualization
    static getCollectionsForMap = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['collectorId', 'species']);

        // Get collections with location data
        const collections = await CollectionService.queryCollections(filter, {
            limit: 1000, // High limit for map visualization
            sortBy: '-collectionTimestamp'
        });

        // Format for map display
        const mapData = collections.results.map(collection => ({
            collectionId: collection.collectionId,
            latitude: collection.location.latitude,
            longitude: collection.location.longitude,
            species: collection.species,
            quantity: collection.quantity,
            collectionDate: collection.collectionTimestamp,
            collectorId: collection.collectorId,
            qualityData: collection.qualityAtCollection
        }));

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                collections: mapData,
                total: collections.totalResults
            }
        });
    });

    // Export collections data
    static exportCollections = catchAsync(async (req, res) => {
        const filter = pick(req.query, [
            'collectorId',
            'species',
            'collectionFrom',
            'collectionTo'
        ]);

        // Get all matching collections without pagination
        const collections = await CollectionService.queryCollections(filter, {
            limit: 10000, // High limit for export
            sortBy: '-collectionTimestamp'
        });

        // Format for export (CSV-like structure)
        const exportData = collections.results.map(collection => ({
            collectionId: collection.collectionId,
            batchId: collection.batchId,
            collectorId: collection.collectorId,
            species: collection.species,
            quantity: collection.quantity,
            latitude: collection.location.latitude,
            longitude: collection.location.longitude,
            collectionDate: collection.collectionTimestamp,
            moisture: collection.qualityAtCollection?.moisture,
            pesticidePPM: collection.qualityAtCollection?.pesticidePPM,
            isOnBlockchain: collection.isOnChain
        }));

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                collections: exportData,
                totalRecords: collections.totalResults,
                exportDate: new Date().toISOString()
            }
        });
    });
}

module.exports = CollectionController;
