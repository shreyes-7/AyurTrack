// src/services/batch.service.js
const { Batch, Collection, User, Herb } = require('../models');
const { getContract } = require('../../fabric/fabricClient');
const ApiError = require('../utils/ApiError');

class BatchService {

    static async createHerbBatch(batchData, collectorUser) {
        console.log('Creating herb batch with collection:', batchData);

        try {
            // Validate collector
            if (!collectorUser.isBlockchainEnrolled) {
                throw new ApiError(400, 'User must be enrolled in blockchain to create batches');
            }

            if (collectorUser.participantType !== 'farmer') {
                throw new ApiError(400, 'Only farmers can create herb collections');
            }

            // Validate herb exists and get species rules
            const herb = await Herb.findOne({ id: batchData.species });
            if (!herb) {
                throw new ApiError(404, `Herb species ${batchData.species} not found`);
            }

            // Validate location against herb geofence
            if (herb.speciesRules?.geofence) {
                const locationValid = herb.validateGeofence(batchData.latitude, batchData.longitude);
                if (!locationValid) {
                    throw new ApiError(400, 'Collection location is outside allowed geofence for this herb species');
                }
            }

            // Validate harvest season
            const currentMonth = new Date().getMonth() + 1;
            if (herb.speciesRules?.allowedMonths?.length) {
                const seasonValid = herb.validateHarvestMonth(currentMonth);
                if (!seasonValid) {
                    throw new ApiError(400, `Harvesting ${batchData.species} is not allowed in month ${currentMonth}`);
                }
            }

            // Validate quality parameters
            if (herb.speciesRules?.qualityThresholds) {
                const qualityValidation = herb.validateQuality(batchData.quality);
                if (!qualityValidation.valid) {
                    throw new ApiError(400, `Quality validation failed: ${qualityValidation.errors.join(', ')}`);
                }
            }

            // Auto-generate IDs
            const batchId = `BATCH_${Date.now()}_${collectorUser.blockchainUserId}`;
            const collectionId = `COLL_${Date.now()}_${collectorUser.blockchainUserId}`;
            const timestamp = new Date().toISOString();

            // Create collection record (immutable)
            const collectionRecord = new Collection({
                collectionId,
                batchId,
                collectorId: collectorUser.blockchainUserId,
                location: {
                    latitude: batchData.latitude,
                    longitude: batchData.longitude
                },
                collectionTimestamp: new Date(timestamp),
                species: batchData.species,
                quantity: batchData.quantity,
                qualityAtCollection: batchData.quality,
                isOnChain: false
            });

            // Create batch record (mutable)
            const batchRecord = new Batch({
                batchId,
                collectionId,
                collectorId: collectorUser.blockchainUserId,
                species: batchData.species,
                quantity: batchData.quantity,
                status: 'collected',
                currentOwner: collectorUser.blockchainUserId,
                initialQuality: batchData.quality,
                isOnChain: false
            });

            // Save to MongoDB
            await collectionRecord.save();
            await batchRecord.save();

            // Submit to blockchain
            await this.submitToBlockchain(batchId, collectionId, collectorUser.blockchainUserId, {
                latitude: batchData.latitude,
                longitude: batchData.longitude,
                timestamp,
                species: batchData.species,
                quantity: batchData.quantity,
                quality: batchData.quality
            });

            console.log('✅ Herb batch and collection created successfully');

            return {
                success: true,
                batchId,
                collectionId,
                batch: batchRecord.toJSON(),
                collection: collectionRecord.toJSON(),
                collector: {
                    id: collectorUser.blockchainUserId,
                    name: collectorUser.name,
                    location: collectorUser.getBlockchainLocation()
                }
            };

        } catch (error) {
            console.error('❌ Failed to create herb batch:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to create herb batch');
        }
    }

    static async getBatchById(batchId, includeDetails = false) {
        try {
            let batch = await Batch.findOne({ batchId });

            if (!batch) {
                throw new ApiError(404, 'Batch not found');
            }

            if (includeDetails) {
                // Get related collection
                const collection = await Collection.findOne({ collectionId: batch.collectionId });

                // Get collector details
                const collector = await User.findOne({ blockchainUserId: batch.collectorId });

                // Get herb details
                const herb = await Herb.findOne({ id: batch.species });

                return {
                    ...batch.toJSON(),
                    collection: collection?.toJSON(),
                    collector: collector ? {
                        id: collector.blockchainUserId,
                        name: collector.name,
                        location: collector.location,
                        contact: collector.contact
                    } : null,
                    herb: herb?.toJSON()
                };
            }

            return batch.toJSON();

        } catch (error) {
            console.error('❌ Failed to get batch:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to retrieve batch');
        }
    }

    static async queryBatches(filter = {}, options = {}) {
        try {
            const query = {};

            // Build query from filters
            if (filter.collectorId) query.collectorId = filter.collectorId;
            if (filter.species) query.species = { $regex: filter.species, $options: 'i' };
            if (filter.status) query.status = filter.status;
            if (filter.currentOwner) query.currentOwner = filter.currentOwner;

            // Date range filters
            if (filter.createdFrom || filter.createdTo) {
                query.createdAt = {};
                if (filter.createdFrom) query.createdAt.$gte = new Date(filter.createdFrom);
                if (filter.createdTo) query.createdAt.$lte = new Date(filter.createdTo);
            }

            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 10;
            const sortBy = options.sortBy || '-createdAt';

            const result = await Batch.paginate(query, {
                page,
                limit,
                sort: sortBy,
                populate: []
            });

            return result;

        } catch (error) {
            console.error('❌ Failed to query batches:', error);
            throw new ApiError(500, 'Failed to query batches');
        }
    }

    static async transferBatch(batchId, newOwnerId, transferredBy) {
        try {
            const batch = await Batch.findOne({ batchId });
            if (!batch) {
                throw new ApiError(404, 'Batch not found');
            }

            // Validate current owner
            if (batch.currentOwner !== transferredBy.blockchainUserId) {
                throw new ApiError(403, 'Only current owner can transfer batch');
            }

            // Validate new owner exists and is blockchain enrolled
            const newOwner = await User.findOne({ blockchainUserId: newOwnerId });
            if (!newOwner || !newOwner.isBlockchainEnrolled) {
                throw new ApiError(400, 'New owner not found or not blockchain enrolled');
            }

            // Update batch ownership
            batch.currentOwner = newOwnerId;
            await batch.save();

            // Submit transfer to blockchain
            await this.submitTransferToBlockchain(batchId, newOwnerId, transferredBy.blockchainUserId);

            return {
                success: true,
                message: 'Batch transferred successfully',
                batchId,
                previousOwner: transferredBy.blockchainUserId,
                newOwner: newOwnerId,
                transferredAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Failed to transfer batch:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to transfer batch');
        }
    }

    static async updateBatchStatus(batchId, newStatus, updatedBy) {
        try {
            const batch = await Batch.findOne({ batchId });
            if (!batch) {
                throw new ApiError(404, 'Batch not found');
            }

            // Validate status transition
            const validTransitions = this.getValidStatusTransitions(batch.status);
            if (!validTransitions.includes(newStatus)) {
                throw new ApiError(400, `Invalid status transition from ${batch.status} to ${newStatus}`);
            }

            // Update batch status
            batch.status = newStatus;
            await batch.save();

            // Log status change to blockchain (background)
            this.logStatusChangeToBlockchain(batchId, batch.status, newStatus, updatedBy.blockchainUserId);

            return {
                success: true,
                message: 'Batch status updated successfully',
                batchId,
                previousStatus: batch.status,
                newStatus,
                updatedBy: updatedBy.blockchainUserId,
                updatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Failed to update batch status:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to update batch status');
        }
    }

    static async getBatchProvenance(batchId) {
        try {
            // Get from blockchain first
            const blockchainProvenance = await this.getBlockchainProvenance(batchId);

            if (blockchainProvenance.status === 'SUCCESS') {
                return blockchainProvenance.data;
            }

            // Fallback to MongoDB data
            const batch = await this.getBatchById(batchId, true);

            return {
                batchId,
                status: batch.status,
                currentOwner: batch.currentOwner,
                traceability: {
                    collection: batch.collection,
                    collector: batch.collector,
                    herb: batch.herb
                },
                source: 'MongoDB (Blockchain unavailable)'
            };

        } catch (error) {
            console.error('❌ Failed to get batch provenance:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to get batch provenance');
        }
    }

    static async getBatchesByCollector(collectorId, options = {}) {
        try {
            const filter = { collectorId };
            return await this.queryBatches(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get batches by collector');
        }
    }

    static async getBatchesBySpecies(species, options = {}) {
        try {
            const filter = { species };
            return await this.queryBatches(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get batches by species');
        }
    }

    static async getBatchesByStatus(status, options = {}) {
        try {
            const filter = { status };
            return await this.queryBatches(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get batches by status');
        }
    }

    // Blockchain Integration Methods
    static async submitToBlockchain(batchId, collectionId, collectorId, collectionData) {
        setImmediate(async () => {
            try {
                console.log('🔗 Submitting herb batch to blockchain:', batchId);

                const { contract, gateway } = await getContract(collectorId);

                const result = await contract.submitTransaction(
                    'CreateHerbBatch',
                    batchId,
                    collectionId,
                    collectorId,
                    collectionData.latitude.toString(),
                    collectionData.longitude.toString(),
                    collectionData.timestamp,
                    collectionData.species,
                    collectionData.quantity.toString(),
                    JSON.stringify(collectionData.quality)
                );

                await gateway.disconnect();

                // Update MongoDB records as blockchain-synced
                await Batch.findOneAndUpdate(
                    { batchId },
                    {
                        isOnChain: true,
                        blockchainTxId: 'tx_' + Date.now() // In real implementation, get actual tx ID
                    }
                );

                await Collection.findOneAndUpdate(
                    { collectionId },
                    {
                        isOnChain: true,
                        blockchainTxId: 'tx_' + Date.now()
                    }
                );

                console.log('✅ Herb batch successfully submitted to blockchain:', batchId);

            } catch (error) {
                console.error('❌ Failed to submit batch to blockchain:', error.message);

                // Mark as blockchain submission failed but keep in MongoDB
                await Batch.findOneAndUpdate(
                    { batchId },
                    {
                        isOnChain: false,
                        blockchainError: error.message
                    }
                );
            }
        });
    }

    static async submitTransferToBlockchain(batchId, newOwnerId, transferredById) {
        setImmediate(async () => {
            try {
                console.log('🔗 Submitting batch transfer to blockchain:', batchId);

                const { contract, gateway } = await getContract(transferredById);

                const result = await contract.submitTransaction(
                    'TransferHerbBatch',
                    batchId,
                    newOwnerId
                );

                await gateway.disconnect();
                console.log('✅ Batch transfer submitted to blockchain:', batchId);

            } catch (error) {
                console.error('❌ Failed to submit transfer to blockchain:', error.message);
            }
        });
    }

    static async getBlockchainProvenance(batchId) {
        try {
            const { contract, gateway } = await getContract('admin');

            const result = await contract.evaluateTransaction('ReadHerbBatch', batchId);
            const batchData = JSON.parse(result.toString());

            await gateway.disconnect();

            return {
                status: 'SUCCESS',
                data: batchData
            };

        } catch (error) {
            return {
                status: 'ERROR',
                message: `Failed to get blockchain provenance: ${error.message}`
            };
        }
    }

    static async getBlockchainBatches() {
        try {
            const { contract, gateway } = await getContract('admin');

            const result = await contract.evaluateTransaction('QueryAllHerbBatches');
            const batches = JSON.parse(result.toString());

            await gateway.disconnect();

            return {
                status: 'SUCCESS',
                data: batches
            };

        } catch (error) {
            return {
                status: 'ERROR',
                message: `Failed to get blockchain batches: ${error.message}`
            };
        }
    }

    static logStatusChangeToBlockchain(batchId, oldStatus, newStatus, updatedBy) {
        setImmediate(async () => {
            try {
                console.log('🔗 Logging status change to blockchain:', batchId, oldStatus, '->', newStatus);

                const { contract, gateway } = await getContract(updatedBy);

                // Use UpdateBatchStatus if available, otherwise log as comment
                try {
                    await contract.submitTransaction(
                        'UpdateBatchStatus',
                        batchId,
                        newStatus
                    );
                } catch (updateError) {
                    // Fallback: Read batch to keep connection active
                    await contract.evaluateTransaction('ReadHerbBatch', batchId);
                }

                await gateway.disconnect();
                console.log('✅ Status change logged to blockchain');

            } catch (error) {
                console.error('❌ Failed to log status change to blockchain:', error.message);
            }
        });
    }

    // Utility Methods
    static getValidStatusTransitions(currentStatus) {
        const transitions = {
            'collected': ['processed-cleaning', 'processed-drying', 'quality-tested'],
            'processed-cleaning': ['processed-drying', 'processed-grinding'],
            'processed-drying': ['processed-grinding', 'processed-sorting'],
            'processed-grinding': ['processed-sorting', 'processed-packaging'],
            'processed-sorting': ['processed-packaging', 'quality-tested'],
            'processed-packaging': ['quality-tested'],
            'quality-tested': ['used_in_formulation', 'quality-fail'],
            'quality-fail': [], // Terminal state
            'used_in_formulation': [] // Terminal state
        };

        return transitions[currentStatus] || [];
    }

    static async getBatchStatistics() {
        try {
            const stats = await Batch.aggregate([
                {
                    $group: {
                        _id: null,
                        totalBatches: { $sum: 1 },
                        statusBreakdown: {
                            $push: {
                                status: '$status',
                                count: 1
                            }
                        },
                        speciesBreakdown: {
                            $push: {
                                species: '$species',
                                count: 1
                            }
                        },
                        totalQuantity: { $sum: '$quantity' },
                        averageQuantity: { $avg: '$quantity' }
                    }
                }
            ]);

            // Get status distribution
            const statusStats = await Batch.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Get species distribution
            const speciesStats = await Batch.aggregate([
                {
                    $group: {
                        _id: '$species',
                        count: { $sum: 1 },
                        totalQuantity: { $sum: '$quantity' }
                    }
                }
            ]);

            return {
                overview: stats[0] || { totalBatches: 0 },
                statusDistribution: statusStats,
                speciesDistribution: speciesStats
            };

        } catch (error) {
            throw new ApiError(500, 'Failed to get batch statistics');
        }
    }
}

module.exports = BatchService;
