// src/services/processing.service.js
const { Processing, Batch, User, Herb } = require('../models');
const { getContract } = require('../../fabric/fabricClient');
const ApiError = require('../utils/ApiError');

class ProcessingService {

    static async addProcessingStep(batchId, processingData, processorUser) {
        console.log('Adding processing step to batch:', batchId, processingData);

        try {
            // Validate processor
            if (!processorUser.isBlockchainEnrolled) {
                throw new ApiError(400, 'User must be enrolled in blockchain to add processing steps');
            }

            if (processorUser.participantType !== 'processor') {
                throw new ApiError(400, 'Only processors can add processing steps');
            }

            // Validate batch exists and is owned by processor
            const batch = await Batch.findOne({ batchId });
            if (!batch) {
                throw new ApiError(404, `Batch ${batchId} not found`);
            }

            if (batch.currentOwner !== processorUser.blockchainUserId) {
                throw new ApiError(403, 'You can only process batches you currently own');
            }

            // Validate processing step is allowed for current batch status
            const validSteps = this.getValidProcessingSteps(batch.status);
            if (!validSteps.includes(processingData.stepType)) {
                throw new ApiError(400, `Processing step ${processingData.stepType} not allowed for batch status ${batch.status}`);
            }

            // Validate step-specific parameters
            this.validateStepParameters(processingData.stepType, processingData.params);

            // Get herb species rules if available
            const herb = await Herb.findOne({ id: batch.species });
            if (herb?.speciesRules) {
                this.validateProcessingAgainstSpecies(processingData.stepType, processingData.params, herb.speciesRules);
            }

            // Auto-generate process ID
            const processId = `PROC_${Date.now()}_${processorUser.blockchainUserId}`;
            const timestamp = new Date().toISOString();

            // Create processing record
            const processingRecord = new Processing({
                processId,
                batchId,
                facilityId: processorUser.blockchainUserId,
                stepType: processingData.stepType,
                params: {
                    ...processingData.params,
                    operator: processorUser.name,
                    equipment: processingData.params?.equipment || 'Standard equipment',
                    startTime: timestamp,
                    notes: processingData.params?.notes || `${processingData.stepType} processing step`
                },
                timestamp: new Date(timestamp),
                isOnChain: false
            });

            // Save to MongoDB
            await processingRecord.save();

            // Update batch status
            const newStatus = `processed-${processingData.stepType}`;
            batch.status = newStatus;
            await batch.save();

            // Submit to blockchain
            await this.submitProcessingToBlockchain(
                processId,
                batchId,
                processorUser.blockchainUserId,
                processingData.stepType,
                processingData.params,
                timestamp
            );

            console.log('✅ Processing step added successfully');

            return {
                success: true,
                processId,
                processing: processingRecord.toJSON(),
                updatedBatch: {
                    batchId: batch.batchId,
                    previousStatus: batch.status,
                    newStatus,
                    currentOwner: batch.currentOwner
                },
                processor: {
                    id: processorUser.blockchainUserId,
                    name: processorUser.name,
                    location: processorUser.getBlockchainLocation()
                }
            };

        } catch (error) {
            console.error('❌ Failed to add processing step:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to add processing step');
        }
    }

    static async getProcessingStepById(processId, includeDetails = false) {
        try {
            const processing = await Processing.findOne({ processId });

            if (!processing) {
                throw new ApiError(404, 'Processing step not found');
            }

            if (includeDetails) {
                // Get related batch
                const batch = await Batch.findOne({ batchId: processing.batchId });

                // Get processor details
                const processor = await User.findOne({ blockchainUserId: processing.facilityId });

                // Get herb details
                const herb = batch ? await Herb.findOne({ id: batch.species }) : null;

                return {
                    ...processing.toJSON(),
                    batch: batch?.toJSON(),
                    processor: processor ? {
                        id: processor.blockchainUserId,
                        name: processor.name,
                        location: processor.location,
                        contact: processor.contact
                    } : null,
                    herb: herb?.toJSON()
                };
            }

            return processing.toJSON();

        } catch (error) {
            console.error('❌ Failed to get processing step:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to retrieve processing step');
        }
    }

    static async queryProcessingSteps(filter = {}, options = {}) {
        try {
            const query = {};

            // Build query from filters
            if (filter.batchId) query.batchId = filter.batchId;
            if (filter.facilityId) query.facilityId = filter.facilityId;
            if (filter.stepType) query.stepType = filter.stepType;

            // Date range filters
            if (filter.processedFrom || filter.processedTo) {
                query.timestamp = {};
                if (filter.processedFrom) query.timestamp.$gte = new Date(filter.processedFrom);
                if (filter.processedTo) query.timestamp.$lte = new Date(filter.processedTo);
            }

            // Parameter-based filters
            if (filter.temperature) {
                query['params.temperature'] = filter.temperature;
            }

            if (filter.method) {
                query['params.method'] = { $regex: filter.method, $options: 'i' };
            }

            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 10;
            const sortBy = options.sortBy || '-timestamp';

            const result = await Processing.paginate(query, {
                page,
                limit,
                sort: sortBy,
                populate: []
            });

            return result;

        } catch (error) {
            console.error('❌ Failed to query processing steps:', error);
            throw new ApiError(500, 'Failed to query processing steps');
        }
    }

    static async getProcessingStepsByBatch(batchId, options = {}) {
        try {
            const filter = { batchId };
            return await this.queryProcessingSteps(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get processing steps by batch');
        }
    }

    static async getProcessingStepsByFacility(facilityId, options = {}) {
        try {
            const filter = { facilityId };
            return await this.queryProcessingSteps(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get processing steps by facility');
        }
    }

    static async getProcessingStepsByType(stepType, options = {}) {
        try {
            const filter = { stepType };
            return await this.queryProcessingSteps(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get processing steps by type');
        }
    }

    static async getProcessingChain(batchId) {
        try {
            const processingSteps = await Processing.find({ batchId }).sort({ timestamp: 1 });

            if (processingSteps.length === 0) {
                throw new ApiError(404, 'No processing steps found for this batch');
            }

            // Get batch details
            const batch = await Batch.findOne({ batchId });

            // Build processing chain with facility details
            const processingChain = [];

            for (const step of processingSteps) {
                const facility = await User.findOne({ blockchainUserId: step.facilityId });

                processingChain.push({
                    ...step.toJSON(),
                    facility: facility ? {
                        id: facility.blockchainUserId,
                        name: facility.name,
                        location: facility.location,
                        certifications: facility.certifications
                    } : null
                });
            }

            return {
                batchId,
                batch: batch?.toJSON(),
                totalSteps: processingSteps.length,
                processingChain,
                firstProcessed: processingSteps[0].timestamp,
                lastProcessed: processingSteps[processingSteps.length - 1].timestamp
            };

        } catch (error) {
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to get processing chain');
        }
    }

    static async getProcessingStatistics(filter = {}) {
        try {
            // Build match stage
            const matchStage = {};
            if (filter.facilityId) matchStage.facilityId = filter.facilityId;
            if (filter.stepType) matchStage.stepType = filter.stepType;
            if (filter.dateFrom || filter.dateTo) {
                matchStage.timestamp = {};
                if (filter.dateFrom) matchStage.timestamp.$gte = new Date(filter.dateFrom);
                if (filter.dateTo) matchStage.timestamp.$lte = new Date(filter.dateTo);
            }

            // Overview statistics
            const overviewStats = await Processing.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalProcessingSteps: { $sum: 1 },
                        uniqueBatches: { $addToSet: '$batchId' },
                        uniqueFacilities: { $addToSet: '$facilityId' },
                        earliestProcessing: { $min: '$timestamp' },
                        latestProcessing: { $max: '$timestamp' }
                    }
                },
                {
                    $project: {
                        totalProcessingSteps: 1,
                        uniqueBatches: { $size: '$uniqueBatches' },
                        uniqueFacilities: { $size: '$uniqueFacilities' },
                        earliestProcessing: 1,
                        latestProcessing: 1
                    }
                }
            ]);

            // Step type distribution
            const stepTypeStats = await Processing.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$stepType',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Facility distribution
            const facilityStats = await Processing.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$facilityId',
                        count: { $sum: 1 },
                        stepTypes: { $addToSet: '$stepType' }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Processing efficiency (steps per batch)
            const efficiencyStats = await Processing.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$batchId',
                        stepCount: { $sum: 1 },
                        processingDuration: {
                            $max: '$timestamp'
                        },
                        firstStep: {
                            $min: '$timestamp'
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageStepsPerBatch: { $avg: '$stepCount' },
                        minStepsPerBatch: { $min: '$stepCount' },
                        maxStepsPerBatch: { $max: '$stepCount' }
                    }
                }
            ]);

            return {
                overview: overviewStats[0] || {
                    totalProcessingSteps: 0,
                    uniqueBatches: 0,
                    uniqueFacilities: 0
                },
                stepTypeDistribution: stepTypeStats,
                facilityDistribution: facilityStats,
                efficiency: efficiencyStats[0] || {
                    averageStepsPerBatch: 0,
                    minStepsPerBatch: 0,
                    maxStepsPerBatch: 0
                }
            };

        } catch (error) {
            throw new ApiError(500, 'Failed to get processing statistics');
        }
    }

    static async getProcessingCapacity(facilityId, dateRange = {}) {
        try {
            const matchStage = { facilityId };

            if (dateRange.from || dateRange.to) {
                matchStage.timestamp = {};
                if (dateRange.from) matchStage.timestamp.$gte = new Date(dateRange.from);
                if (dateRange.to) matchStage.timestamp.$lte = new Date(dateRange.to);
            }

            const capacity = await Processing.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
                        },
                        dailySteps: { $sum: 1 },
                        stepTypes: { $addToSet: '$stepType' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageDailySteps: { $avg: '$dailySteps' },
                        maxDailySteps: { $max: '$dailySteps' },
                        totalDays: { $sum: 1 }
                    }
                }
            ]);

            // Get facility details
            const facility = await User.findOne({ blockchainUserId: facilityId });

            return {
                facilityId,
                facilityName: facility?.name,
                capacity: capacity[0] || {
                    averageDailySteps: 0,
                    maxDailySteps: 0,
                    totalDays: 0
                },
                dateRange
            };

        } catch (error) {
            throw new ApiError(500, 'Failed to get processing capacity');
        }
    }

    // Validation Methods
    static getValidProcessingSteps(batchStatus) {
        const validSteps = {
            'collected': ['cleaning', 'drying'],
            'processed-cleaning': ['drying', 'sorting'],
            'processed-drying': ['grinding', 'sorting'],
            'processed-grinding': ['sorting', 'packaging'],
            'processed-sorting': ['packaging'],
            'processed-packaging': [] // Ready for quality testing
        };

        return validSteps[batchStatus] || [];
    }

    static validateStepParameters(stepType, params) {
        const validations = {
            cleaning: {
                required: [],
                optional: ['method', 'duration', 'equipment', 'notes']
            },
            drying: {
                required: ['temperature', 'duration', 'method'],
                optional: ['humidity', 'equipment', 'notes']
            },
            grinding: {
                required: ['mesh_size'],
                optional: ['temperature', 'equipment', 'notes']
            },
            sorting: {
                required: [],
                optional: ['method', 'criteria', 'equipment', 'notes']
            },
            packaging: {
                required: [],
                optional: ['container_type', 'seal_type', 'equipment', 'notes']
            }
        };

        const validation = validations[stepType];
        if (!validation) {
            throw new ApiError(400, `Unknown processing step type: ${stepType}`);
        }

        // Check required parameters
        for (const required of validation.required) {
            if (!params || !params[required]) {
                throw new ApiError(400, `Missing required parameter for ${stepType}: ${required}`);
            }
        }

        // Validate specific parameter values
        if (stepType === 'drying') {
            const temp = parseFloat(params.temperature);
            if (temp < 30 || temp > 80) {
                throw new ApiError(400, 'Drying temperature must be between 30°C and 80°C');
            }
        }

        if (stepType === 'grinding' && params.mesh_size) {
            const meshSize = parseInt(params.mesh_size);
            if (meshSize < 20 || meshSize > 200) {
                throw new ApiError(400, 'Mesh size must be between 20 and 200');
            }
        }
    }

    static validateProcessingAgainstSpecies(stepType, params, speciesRules) {
        // Add species-specific processing validation if rules exist
        // For example, certain herbs might have temperature limits for drying

        if (stepType === 'drying' && params.temperature && speciesRules.processingLimits?.dryingTempMax) {
            const temp = parseFloat(params.temperature);
            if (temp > speciesRules.processingLimits.dryingTempMax) {
                throw new ApiError(400, `Drying temperature ${temp}°C exceeds species limit of ${speciesRules.processingLimits.dryingTempMax}°C`);
            }
        }
    }

    // Blockchain Integration Methods
    static async submitProcessingToBlockchain(processId, batchId, facilityId, stepType, params, timestamp) {
        setImmediate(async () => {
            try {
                console.log('🔗 Submitting processing step to blockchain:', processId);

                const { contract, gateway } = await getContract(facilityId);

                const result = await contract.submitTransaction(
                    'AddProcessingStep',
                    processId,
                    batchId,
                    facilityId,
                    stepType,
                    JSON.stringify(params),
                    timestamp
                );

                await gateway.disconnect();

                // Update MongoDB record as blockchain-synced
                await Processing.findOneAndUpdate(
                    { processId },
                    {
                        isOnChain: true,
                        blockchainTxId: 'tx_' + Date.now()
                    }
                );

                console.log('✅ Processing step successfully submitted to blockchain:', processId);

            } catch (error) {
                console.error('❌ Failed to submit processing step to blockchain:', error.message);

                await Processing.findOneAndUpdate(
                    { processId },
                    {
                        isOnChain: false,
                        blockchainError: error.message.substring(0, 500)
                    }
                );
            }
        });
    }

    static async getBlockchainProcessingSteps(batchId) {
        try {
            const { contract, gateway } = await getContract('admin');

            // Query processing steps by batch
            const result = await contract.evaluateTransaction('QueryByPrefix', 'PROCESSING:');
            const allProcessing = JSON.parse(result.toString());

            const batchProcessing = allProcessing.filter(p => p.batchId === batchId);

            await gateway.disconnect();

            return {
                status: 'SUCCESS',
                data: batchProcessing
            };

        } catch (error) {
            return {
                status: 'ERROR',
                message: `Failed to get blockchain processing steps: ${error.message}`
            };
        }
    }

    static async validateProcessingIntegrity(processId) {
        try {
            // Get from MongoDB
            const mongoProcessing = await this.getProcessingStepById(processId);

            // Get from blockchain
            const blockchainResult = await this.getBlockchainProcessingSteps(mongoProcessing.batchId);

            if (blockchainResult.status === 'ERROR') {
                return {
                    valid: false,
                    source: 'blockchain_unavailable',
                    message: blockchainResult.message
                };
            }

            const blockchainProcessing = blockchainResult.data.find(p => p.processId === processId);

            if (!blockchainProcessing) {
                return {
                    valid: false,
                    source: 'not_on_blockchain',
                    message: 'Processing step not found on blockchain'
                };
            }

            // Compare key fields
            const discrepancies = [];

            if (mongoProcessing.facilityId !== blockchainProcessing.facilityId) {
                discrepancies.push('facilityId mismatch');
            }

            if (mongoProcessing.stepType !== blockchainProcessing.stepType) {
                discrepancies.push('stepType mismatch');
            }

            return {
                valid: discrepancies.length === 0,
                discrepancies,
                mongoData: mongoProcessing,
                blockchainData: blockchainProcessing
            };

        } catch (error) {
            throw new ApiError(500, 'Failed to validate processing integrity');
        }
    }
}

module.exports = ProcessingService;
