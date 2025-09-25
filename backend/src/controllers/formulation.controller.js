// src/controllers/formulation.controller.js
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const FormulationService = require('../services/formulation.service');
const pick = require('../utils/pick');

class FormulationController {

    // Create product formulation
    static createFormulation = catchAsync(async (req, res) => {
        const result = await FormulationService.createFormulation(req.body, req.user);
        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Product formulation created successfully',
            data: result
        });
    });

    // Get single formulation
    static getFormulation = catchAsync(async (req, res) => {
        const { productBatchId } = req.params;
        const includeDetails = req.query.details === 'true';

        const result = await FormulationService.getFormulationById(productBatchId, includeDetails);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Query formulations with filters
    static getFormulations = catchAsync(async (req, res) => {
        const filter = pick(req.query, [
            'manufacturerId',
            'productType',
            'qrToken',
            'createdFrom',
            'createdTo',
            'productionFrom',
            'productionTo',
            'minBatchSize'
        ]);
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await FormulationService.queryFormulations(filter, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get formulation by QR code scan
    static getFormulationByQR = catchAsync(async (req, res) => {
        const { qrToken } = req.params;

        const result = await FormulationService.getFormulationByQR(qrToken);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get complete product provenance
    static getProvenance = catchAsync(async (req, res) => {
        const { productBatchId } = req.params;

        const result = await FormulationService.getProvenance(productBatchId);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Generate QR code for product
    static generateQRCode = catchAsync(async (req, res) => {
        const { productBatchId } = req.params;

        const result = await FormulationService.generateQRCode(productBatchId);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'QR code generated successfully',
            data: result
        });
    });

    // Get formulations by manufacturer
    static getFormulationsByManufacturer = catchAsync(async (req, res) => {
        const { manufacturerId } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await FormulationService.getFormulationsByManufacturer(manufacturerId, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get formulations by product type
    static getFormulationsByProductType = catchAsync(async (req, res) => {
        const { productType } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await FormulationService.getFormulationsByProductType(productType, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get formulation statistics
    static getFormulationStatistics = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['manufacturerId', 'dateFrom', 'dateTo']);

        const result = await FormulationService.getFormulationStatistics(filter);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Blockchain-specific endpoints
    static getBlockchainFormulations = catchAsync(async (req, res) => {
        const result = await FormulationService.getBlockchainFormulations();

        if (result.status === 'SUCCESS') {
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Blockchain formulations retrieved successfully',
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

    static getBlockchainProvenance = catchAsync(async (req, res) => {
        const { productBatchId } = req.params;

        const result = await FormulationService.getBlockchainProvenance(productBatchId);

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

    // Dashboard and analytics
    static getFormulationDashboard = catchAsync(async (req, res) => {
        const userId = req.user.blockchainUserId;
        const userType = req.user.participantType;

        let filter = {};

        // Filter based on user type
        if (userType === 'manufacturer') {
            filter.manufacturerId = userId;
        }
        // Admin can see all

        // Recent formulations
        const recentFormulations = await FormulationService.queryFormulations(filter, {
            page: 1,
            limit: 5,
            sortBy: '-timestamp'
        });

        // Statistics
        const statistics = await FormulationService.getFormulationStatistics(filter);

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                recentFormulations: recentFormulations.results,
                statistics,
                userType,
                userId
            }
        });
    });

    // Product catalog for consumers
    static getProductCatalog = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['productType']);
        const options = pick(req.query, ['page', 'limit']);

        // Get formulations with basic product info
        const formulations = await FormulationService.queryFormulations(filter, options);

        // Transform to consumer-friendly format
        const catalog = formulations.results.map(formulation => ({
            productBatchId: formulation.productBatchId,
            productType: formulation.formulationParams.product_type,
            dosage: formulation.formulationParams.dosage,
            batchSize: formulation.formulationParams.batch_size,
            productionDate: formulation.formulationParams.production_date,
            expiryDate: formulation.formulationParams.expiry_date,
            qrToken: formulation.qrToken,
            manufacturerId: formulation.manufacturerId,
            isExpired: FormulationService.isProductExpired(formulation.formulationParams.expiry_date)
        }));

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                products: catalog,
                pagination: {
                    page: formulations.page,
                    limit: formulations.limit,
                    totalPages: formulations.totalPages,
                    totalResults: formulations.totalResults
                }
            }
        });
    });

    // Batch utilization report
    static getBatchUtilizationReport = catchAsync(async (req, res) => {
        const { dateFrom, dateTo } = req.query;

        let filter = {};
        if (dateFrom || dateTo) {
            filter.createdFrom = dateFrom;
            filter.createdTo = dateTo;
        }

        // Get formulations in date range
        const formulations = await FormulationService.queryFormulations(filter, {
            limit: 1000
        });

        // Analyze batch utilization
        const batchUsage = {};
        const herbUsage = {};

        for (const formulation of formulations.results) {
            for (const batchId of formulation.inputBatches) {
                batchUsage[batchId] = batchUsage[batchId] || [];
                batchUsage[batchId].push(formulation.productBatchId);
            }
        }

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                totalFormulations: formulations.totalResults,
                uniqueBatchesUsed: Object.keys(batchUsage).length,
                batchUtilization: batchUsage,
                dateRange: { dateFrom, dateTo }
            }
        });
    });

    // Quality compliance report
    static getQualityComplianceReport = catchAsync(async (req, res) => {
        const { manufacturerId } = req.params;

        const filter = manufacturerId ? { manufacturerId } : {};
        const formulations = await FormulationService.queryFormulations(filter, {
            limit: 1000
        });

        // Analyze quality compliance (this would need batch quality data)
        let totalProducts = formulations.totalResults;
        let compliantProducts = 0;

        // In a real implementation, you'd check each product's input batch quality
        // For now, we'll simulate based on available data
        compliantProducts = Math.floor(totalProducts * 0.95); // 95% compliance rate simulation

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                totalProducts,
                compliantProducts,
                nonCompliantProducts: totalProducts - compliantProducts,
                complianceRate: totalProducts > 0 ? (compliantProducts / totalProducts * 100).toFixed(2) : 0,
                manufacturerId
            }
        });
    });
}

module.exports = FormulationController;
