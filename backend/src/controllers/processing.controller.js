// src/controllers/processing.controller.js - FIXED
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ProcessingService = require('../services/processing.service');
const pick = require('../utils/pick');

class ProcessingController {
    static addProcessingStep = catchAsync(async (req, res) => {
        console.log('=== PROCESSING CONTROLLER DEBUG ===');
        console.log('Headers:', {
            authorization: req.headers.authorization ? 'Present' : 'Missing',
            'content-type': req.headers['content-type']
        });
        console.log('Batch ID from params:', req.params.batchId);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        // ✅ CRITICAL FIX: Check and validate req.user
        console.log('req.user exists:', !!req.user);
        console.log('Full req.user:', req.user);
        
        if (!req.user) {
            console.error('❌ req.user is null/undefined - authentication failed');
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Authentication failed - user not found in request',
                debug: 'req.user is null or undefined'
            });
        }

        // ✅ FIXED: Ensure user has required properties with defaults
        const processUser = {
            id: req.user.id || req.user._id,
            blockchainUserId: req.user.blockchainUserId || req.user.id,
            participantType: req.user.participantType || req.user.role,
            isBlockchainEnrolled: req.user.isBlockchainEnrolled !== undefined ? req.user.isBlockchainEnrolled : true,
            name: req.user.name || 'Unknown User',
            role: req.user.role,
            location: req.user.location
        };

        console.log('Processed user object:', JSON.stringify(processUser, null, 2));

        // ✅ FIXED: Additional validation
        if (!processUser.blockchainUserId) {
            console.error('❌ User missing blockchainUserId');
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'User must have blockchain ID'
            });
        }

        try {
            const { batchId } = req.params;
            
            console.log('✅ Calling ProcessingService.addProcessingStep...');
            const result = await ProcessingService.addProcessingStep(batchId, req.body, processUser);
            console.log('✅ ProcessingService returned:', result);

            res.status(httpStatus.CREATED).json({
                success: true,
                message: 'Processing step added successfully',
                data: result
            });

        } catch (error) {
            console.error('❌ Processing Controller Error:', error);
            console.error('Error stack:', error.stack);
            
            res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'Failed to add processing step',
                error: process.env.NODE_ENV === 'development' ? {
                    stack: error.stack,
                    statusCode: error.statusCode
                } : undefined
            });
        }
    });

    // Get single processing step
    static getProcessingStep = catchAsync(async (req, res) => {
        const { processId } = req.params;
        const includeDetails = req.query.details === 'true';

        const result = await ProcessingService.getProcessingStepById(processId, includeDetails);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Query processing steps with filters
    static getProcessingSteps = catchAsync(async (req, res) => {
        const filter = pick(req.query, [
            'batchId',
            'facilityId',
            'stepType',
            'processedFrom',
            'processedTo',
            'temperature',
            'method'
        ]);
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await ProcessingService.queryProcessingSteps(filter, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get processing steps by batch
    static getProcessingStepsByBatch = catchAsync(async (req, res) => {
        const { batchId } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await ProcessingService.getProcessingStepsByBatch(batchId, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get processing steps by facility
    static getProcessingStepsByFacility = catchAsync(async (req, res) => {
        const { facilityId } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await ProcessingService.getProcessingStepsByFacility(facilityId, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get processing steps by type
    static getProcessingStepsByType = catchAsync(async (req, res) => {
        const { stepType } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await ProcessingService.getProcessingStepsByType(stepType, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get complete processing chain for a batch
    static getProcessingChain = catchAsync(async (req, res) => {
        const { batchId } = req.params;

        const result = await ProcessingService.getProcessingChain(batchId);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get processing statistics
    static getProcessingStatistics = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['facilityId', 'stepType', 'dateFrom', 'dateTo']);

        const result = await ProcessingService.getProcessingStatistics(filter);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get processing capacity for facility
    static getProcessingCapacity = catchAsync(async (req, res) => {
        const { facilityId } = req.params;
        const dateRange = pick(req.query, ['from', 'to']);

        const result = await ProcessingService.getProcessingCapacity(facilityId, dateRange);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get valid processing steps for batch status
    static getValidProcessingSteps = catchAsync(async (req, res) => {
        const { batchStatus } = req.params;

        const validSteps = ProcessingService.getValidProcessingSteps(batchStatus);
        res.status(httpStatus.OK).json({
            success: true,
            data: {
                batchStatus,
                validSteps,
                stepDescriptions: {
                    cleaning: 'Remove impurities, foreign matter, and contaminants',
                    drying: 'Reduce moisture content to safe storage levels',
                    grinding: 'Reduce particle size for better processing',
                    sorting: 'Separate by size, quality, or grade',
                    packaging: 'Prepare for storage or next stage'
                }
            }
        });
    });

    // Blockchain-specific endpoints
    static getBlockchainProcessingSteps = catchAsync(async (req, res) => {
        const { batchId } = req.params;

        const result = await ProcessingService.getBlockchainProcessingSteps(batchId);

        if (result.status === 'SUCCESS') {
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Blockchain processing steps retrieved successfully',
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

    // Validate processing data integrity
    static validateProcessingIntegrity = catchAsync(async (req, res) => {
        const { processId } = req.params;

        const result = await ProcessingService.validateProcessingIntegrity(processId);
        res.status(httpStatus.OK).json({
            success: true,
            validation: result
        });
    });

    // Dashboard and analytics
    static getProcessingDashboard = catchAsync(async (req, res) => {
        const userId = req.user.blockchainUserId;
        const userType = req.user.participantType;

        let filter = {};

        if (userType === 'processor') {
            filter.facilityId = userId;
        }

        const recentProcessing = await ProcessingService.queryProcessingSteps(filter, {
            page: 1,
            limit: 10,
            sortBy: '-timestamp'
        });

        const statistics = await ProcessingService.getProcessingStatistics(filter);

        let capacity = null;
        if (userType === 'processor') {
            capacity = await ProcessingService.getProcessingCapacity(userId, {
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                to: new Date().toISOString()
            });
        }

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                recentProcessing: recentProcessing.results,
                statistics,
                capacity,
                userType,
                userId
            }
        });
    });

    // Processing efficiency report
    static getProcessingEfficiencyReport = catchAsync(async (req, res) => {
        const { facilityId } = req.params;
        const filter = pick(req.query, ['dateFrom', 'dateTo']);

        if (facilityId) {
            filter.facilityId = facilityId;
        }

        const statistics = await ProcessingService.getProcessingStatistics(filter);

        const efficiencyMetrics = {
            ...statistics,
            processingScore: statistics.efficiency.averageStepsPerBatch > 0
                ? Math.min(100, (statistics.efficiency.averageStepsPerBatch / 5) * 100)
                : 0,
            recommendations: []
        };

        if (statistics.efficiency.averageStepsPerBatch < 3) {
            efficiencyMetrics.recommendations.push('Consider adding quality control steps');
        }

        if (statistics.overview.uniqueFacilities < 2) {
            efficiencyMetrics.recommendations.push('Consider distributing processing across multiple facilities');
        }

        res.status(httpStatus.OK).json({
            success: true,
            data: efficiencyMetrics
        });
    });

    // Batch processing timeline
    static getBatchProcessingTimeline = catchAsync(async (req, res) => {
        const { batchId } = req.params;

        const processingChain = await ProcessingService.getProcessingChain(batchId);

        const timeline = processingChain.processingChain.map((step, index) => ({
            step: index + 1,
            processId: step.processId,
            stepType: step.stepType,
            facility: step.facility,
            timestamp: step.timestamp,
            duration: index > 0
                ? new Date(step.timestamp) - new Date(processingChain.processingChain[index - 1].timestamp)
                : 0,
            parameters: step.params
        }));

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                batchId,
                totalSteps: timeline.length,
                totalProcessingTime: processingChain.lastProcessed && processingChain.firstProcessed
                    ? new Date(processingChain.lastProcessed) - new Date(processingChain.firstProcessed)
                    : 0,
                timeline
            }
        });
    });

    // Quality impact analysis
    static getQualityImpactAnalysis = catchAsync(async (req, res) => {
        const { stepType } = req.params;
        const filter = { stepType };

        const processingSteps = await ProcessingService.queryProcessingSteps(filter, {
            limit: 1000
        });

        const parameterAnalysis = {};
        const temperatureDistribution = [];
        const durationDistribution = [];

        processingSteps.results.forEach(step => {
            if (step.params) {
                Object.keys(step.params).forEach(param => {
                    if (!parameterAnalysis[param]) {
                        parameterAnalysis[param] = { values: [], frequency: 0 };
                    }
                    parameterAnalysis[param].values.push(step.params[param]);
                    parameterAnalysis[param].frequency++;
                });

                if (step.params.temperature) {
                    temperatureDistribution.push(parseFloat(step.params.temperature) || 0);
                }

                if (step.params.duration) {
                    durationDistribution.push(step.params.duration);
                }
            }
        });

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                stepType,
                totalAnalyzed: processingSteps.totalResults,
                parameterAnalysis,
                distributions: {
                    temperature: temperatureDistribution.length > 0 ? {
                        min: Math.min(...temperatureDistribution),
                        max: Math.max(...temperatureDistribution),
                        average: temperatureDistribution.reduce((a, b) => a + b, 0) / temperatureDistribution.length
                    } : null,
                    duration: durationDistribution
                }
            }
        });
    });
}

module.exports = ProcessingController;
