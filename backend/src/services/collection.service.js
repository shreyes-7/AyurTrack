// src/services/collection.service.js
const { Collection, Batch, User, Herb } = require('../models');
const { getContract } = require('../../fabric/fabricClient');
const ApiError = require('../utils/ApiError');

class CollectionService {

    static async createHerbCollection(collectionData, collectorUser) {
        console.log('Creating herb collection event:', collectionData);

        try {
            // Validate collector
            if (!collectorUser.isBlockchainEnrolled) {
                throw new ApiError(400, 'User must be enrolled in blockchain to create collections');
            }

            if (collectorUser.participantType !== 'farmer') {
                throw new ApiError(400, 'Only farmers can create herb collections');
            }

            // Validate herb exists and get species rules
            const herb = await Herb.findOne({ id: collectionData.species });
            if (!herb) {
                throw new ApiError(404, `Herb species ${collectionData.species} not found`);
            }

            // Validate location against herb geofence
            if (herb.speciesRules?.geofence) {
                const locationValid = herb.validateGeofence(collectionData.latitude, collectionData.longitude);
                if (!locationValid) {
                    throw new ApiError(400, 'Collection location is outside allowed geofence for this herb species');
                }
            }

            // Validate harvest season
            const currentMonth = new Date().getMonth() + 1;
            if (herb.speciesRules?.allowedMonths?.length) {
                const seasonValid = herb.validateHarvestMonth(currentMonth);
                if (!seasonValid) {
                    throw new ApiError(400, `Harvesting ${collectionData.species} is not allowed in month ${currentMonth}`);
                }
            }

            // Validate quality parameters
            if (herb.speciesRules?.qualityThresholds && collectionData.quality) {
                const qualityValidation = herb.validateQuality(collectionData.quality);
                if (!qualityValidation.valid) {
                    throw new ApiError(400, `Quality validation failed: ${qualityValidation.errors.join(', ')}`);
                }
            }

            // Auto-generate IDs if not provided
            const batchId = collectionData.batchId || `BATCH_${Date.now()}_${collectorUser.blockchainUserId}`;
            const collectionId = collectionData.collectionId || `COLL_${Date.now()}_${collectorUser.blockchainUserId}`;
            const timestamp = collectionData.timestamp || new Date().toISOString();

            // Create immutable collection record
            const collectionRecord = new Collection({
                collectionId,
                batchId,
                collectorId: collectorUser.blockchainUserId,
                location: {
                    latitude: collectionData.latitude,
                    longitude: collectionData.longitude
                },
                collectionTimestamp: new Date(timestamp),
                species: collectionData.species,
                quantity: collectionData.quantity,
                qualityAtCollection: collectionData.quality || {},
                isOnChain: false
            });

            // Save to MongoDB
            await collectionRecord.save();
            console.log('✅ Collection record created in MongoDB');

            // Submit to blockchain in background
            await this.submitCollectionToBlockchain(collectionRecord, collectorUser.blockchainUserId);

            return {
                success: true,
                collectionId,
                batchId,
                collection: collectionRecord.toJSON(),
                collector: {
                    id: collectorUser.blockchainUserId,
                    name: collectorUser.name,
                    location: collectorUser.getBlockchainLocation()
                },
                herb: {
                    id: herb.id,
                    name: herb.name,
                    scientificName: herb.scientificName
                }
            };

        } catch (error) {
            console.error('❌ Failed to create herb collection:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to create herb collection');
        }
    }

    static async getCollectionById(collectionId, includeDetails = false) {
        try {
            const collection = await Collection.findOne({ collectionId });

            if (!collection) {
                throw new ApiError(404, 'Collection not found');
            }

            if (includeDetails) {
                // Get related batch
                const batch = await Batch.findOne({ collectionId: collection.collectionId });

                // Get collector details
                const collector = await User.findOne({ blockchainUserId: collection.collectorId });

                // Get herb details
                const herb = await Herb.findOne({ id: collection.species });

                return {
                    ...collection.toJSON(),
                    batch: batch?.toJSON(),
                    collector: collector ? {
                        id: collector.blockchainUserId,
                        name: collector.name,
                        location: collector.location,
                        contact: collector.contact
                    } : null,
                    herb: herb?.toJSON()
                };
            }

            return collection.toJSON();

        } catch (error) {
            console.error('❌ Failed to get collection:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to retrieve collection');
        }
    }

    static async queryCollections(filter = {}, options = {}) {
        try {
            const query = {};

            // Build query from filters
            if (filter.collectorId) query.collectorId = filter.collectorId;
            if (filter.species) query.species = { $regex: filter.species, $options: 'i' };
            if (filter.batchId) query.batchId = filter.batchId;

            // Date range filters
            if (filter.collectionFrom || filter.collectionTo) {
                query.collectionTimestamp = {};
                if (filter.collectionFrom) query.collectionTimestamp.$gte = new Date(filter.collectionFrom);
                if (filter.collectionTo) query.collectionTimestamp.$lte = new Date(filter.collectionTo);
            }

            // Location-based filters (within radius)
            if (filter.latitude && filter.longitude && filter.radiusKm) {
                query['location'] = {
                    $geoWithin: {
                        $centerSphere: [
                            [filter.longitude, filter.latitude],
                            filter.radiusKm / 6371 // Convert km to radians
                        ]
                    }
                };
            }

            // Quality filters
            if (filter.minMoisture || filter.maxMoisture) {
                query['qualityAtCollection.moisture'] = {};
                if (filter.minMoisture) query['qualityAtCollection.moisture'].$gte = filter.minMoisture;
                if (filter.maxMoisture) query['qualityAtCollection.moisture'].$lte = filter.maxMoisture;
            }

            if (filter.maxPesticidePPM) {
                query['qualityAtCollection.pesticidePPM'] = { $lte: filter.maxPesticidePPM };
            }

            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 10;
            const sortBy = options.sortBy || '-collectionTimestamp';

            const result = await Collection.paginate(query, {
                page,
                limit,
                sort: sortBy,
                populate: []
            });

            return result;

        } catch (error) {
            console.error('❌ Failed to query collections:', error);
            throw new ApiError(500, 'Failed to query collections');
        }
    }

    static async getCollectionsByCollector(collectorId, options = {}) {
        try {
            const filter = { collectorId };
            return await this.queryCollections(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get collections by collector');
        }
    }

    static async getCollectionsBySpecies(species, options = {}) {
        try {
            const filter = { species };
            return await this.queryCollections(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get collections by species');
        }
    }

    static async getCollectionsByDateRange(startDate, endDate, options = {}) {
        try {
            const filter = {
                collectionFrom: startDate,
                collectionTo: endDate
            };
            return await this.queryCollections(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get collections by date range');
        }
    }

    static async getCollectionsByLocation(latitude, longitude, radiusKm, options = {}) {
        try {
            const filter = {
                latitude,
                longitude,
                radiusKm
            };
            return await this.queryCollections(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get collections by location');
        }
    }

    static async getCollectionQualityAnalysis(collectionId) {
        try {
            const collection = await this.getCollectionById(collectionId, true);

            if (!collection.qualityAtCollection) {
                throw new ApiError(404, 'No quality data found for this collection');
            }

            // Get herb species rules for comparison
            const herb = await Herb.findOne({ id: collection.species });
            const speciesThresholds = herb?.speciesRules?.qualityThresholds;

            // Analyze quality against thresholds
            const analysis = {
                collectionId,
                species: collection.species,
                qualityData: collection.qualityAtCollection,
                compliance: {
                    overall: true,
                    details: []
                }
            };

            if (speciesThresholds) {
                // Check moisture compliance
                if (speciesThresholds.moistureMax && collection.qualityAtCollection.moisture) {
                    const moistureCompliant = collection.qualityAtCollection.moisture <= speciesThresholds.moistureMax;
                    analysis.compliance.details.push({
                        parameter: 'moisture',
                        value: collection.qualityAtCollection.moisture,
                        threshold: speciesThresholds.moistureMax,
                        compliant: moistureCompliant,
                        unit: '%'
                    });
                    if (!moistureCompliant) analysis.compliance.overall = false;
                }

                // Check pesticide compliance
                if (speciesThresholds.pesticidePPMMax && collection.qualityAtCollection.pesticidePPM !== undefined) {
                    const pesticideCompliant = collection.qualityAtCollection.pesticidePPM <= speciesThresholds.pesticidePPMMax;
                    analysis.compliance.details.push({
                        parameter: 'pesticidePPM',
                        value: collection.qualityAtCollection.pesticidePPM,
                        threshold: speciesThresholds.pesticidePPMMax,
                        compliant: pesticideCompliant,
                        unit: 'PPM'
                    });
                    if (!pesticideCompliant) analysis.compliance.overall = false;
                }
            }

            return analysis;

        } catch (error) {
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to analyze collection quality');
        }
    }

    static async getCollectionStatistics(filter = {}) {
        try {
            // Build match stage for aggregation
            const matchStage = {};
            if (filter.collectorId) matchStage.collectorId = filter.collectorId;
            if (filter.species) matchStage.species = filter.species;
            if (filter.dateFrom || filter.dateTo) {
                matchStage.collectionTimestamp = {};
                if (filter.dateFrom) matchStage.collectionTimestamp.$gte = new Date(filter.dateFrom);
                if (filter.dateTo) matchStage.collectionTimestamp.$lte = new Date(filter.dateTo);
            }

            const stats = await Collection.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalCollections: { $sum: 1 },
                        totalQuantity: { $sum: '$quantity' },
                        averageQuantity: { $avg: '$quantity' },
                        minQuantity: { $min: '$quantity' },
                        maxQuantity: { $max: '$quantity' },
                        averageMoisture: { $avg: '$qualityAtCollection.moisture' },
                        averagePesticidePPM: { $avg: '$qualityAtCollection.pesticidePPM' },
                        earliestCollection: { $min: '$collectionTimestamp' },
                        latestCollection: { $max: '$collectionTimestamp' }
                    }
                }
            ]);

            // Get species breakdown
            const speciesStats = await Collection.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$species',
                        count: { $sum: 1 },
                        totalQuantity: { $sum: '$quantity' },
                        averageQuantity: { $avg: '$quantity' }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Get collector breakdown
            const collectorStats = await Collection.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$collectorId',
                        count: { $sum: 1 },
                        totalQuantity: { $sum: '$quantity' }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Get monthly collection trends
            const monthlyTrends = await Collection.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            year: { $year: '$collectionTimestamp' },
                            month: { $month: '$collectionTimestamp' }
                        },
                        count: { $sum: 1 },
                        totalQuantity: { $sum: '$quantity' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            return {
                overview: stats[0] || {
                    totalCollections: 0,
                    totalQuantity: 0,
                    averageQuantity: 0
                },
                speciesDistribution: speciesStats,
                collectorDistribution: collectorStats,
                monthlyTrends
            };

        } catch (error) {
            throw new ApiError(500, 'Failed to get collection statistics');
        }
    }

    // Blockchain Integration Methods
    static async submitCollectionToBlockchain(collection, collectorId) {
        setImmediate(async () => {
            try {
                console.log('🔗 Submitting collection to blockchain:', collection.collectionId);

                const { contract, gateway } = await getContract(collectorId);

                // The CreateHerbBatch function creates both batch and collection records
                const result = await contract.submitTransaction(
                    'CreateHerbBatch',
                    collection.batchId,
                    collection.collectionId,
                    collection.collectorId,
                    collection.location.latitude.toString(),
                    collection.location.longitude.toString(),
                    collection.collectionTimestamp.toISOString(),
                    collection.species,
                    collection.quantity.toString(),
                    JSON.stringify(collection.qualityAtCollection)
                );

                await gateway.disconnect();

                // Update MongoDB record as blockchain-synced
                await Collection.findOneAndUpdate(
                    { collectionId: collection.collectionId },
                    {
                        isOnChain: true,
                        blockchainTxId: 'tx_' + Date.now() // In real implementation, get actual tx ID
                    }
                );

                console.log('✅ Collection successfully submitted to blockchain:', collection.collectionId);

            } catch (error) {
                console.error('❌ Failed to submit collection to blockchain:', error.message);

                // Mark as blockchain submission failed but keep in MongoDB
                await Collection.findOneAndUpdate(
                    { collectionId: collection.collectionId },
                    {
                        isOnChain: false,
                        blockchainError: error.message.substring(0, 500)
                    }
                );
            }
        });
    }

    static async getBlockchainCollection(collectionId) {
        try {
            const { contract, gateway } = await getContract('admin');

            // Get collection via batch lookup since blockchain stores both together
            const collections = await contract.evaluateTransaction('QueryByPrefix', 'COLLECTION:');
            const allCollections = JSON.parse(collections.toString());

            const collection = allCollections.find(c => c.collectionId === collectionId);

            await gateway.disconnect();

            if (!collection) {
                return {
                    status: 'ERROR',
                    message: 'Collection not found on blockchain'
                };
            }

            return {
                status: 'SUCCESS',
                data: collection
            };

        } catch (error) {
            return {
                status: 'ERROR',
                message: `Failed to get blockchain collection: ${error.message}`
            };
        }
    }

    static async getBlockchainCollections() {
        try {
            const { contract, gateway } = await getContract('admin');

            const result = await contract.evaluateTransaction('QueryByPrefix', 'COLLECTION:');
            const collections = JSON.parse(result.toString());

            await gateway.disconnect();

            return {
                status: 'SUCCESS',
                data: collections
            };

        } catch (error) {
            return {
                status: 'ERROR',
                message: `Failed to get blockchain collections: ${error.message}`
            };
        }
    }

    static async validateCollectionIntegrity(collectionId) {
        try {
            // Get from MongoDB
            const mongoCollection = await this.getCollectionById(collectionId);

            // Get from blockchain
            const blockchainResult = await this.getBlockchainCollection(collectionId);

            if (blockchainResult.status === 'ERROR') {
                return {
                    valid: false,
                    source: 'blockchain_unavailable',
                    message: blockchainResult.message
                };
            }

            const blockchainCollection = blockchainResult.data;

            // Compare key fields
            const discrepancies = [];

            if (mongoCollection.collectorId !== blockchainCollection.collectorId) {
                discrepancies.push('collectorId mismatch');
            }

            if (mongoCollection.species !== blockchainCollection.species) {
                discrepancies.push('species mismatch');
            }

            if (Math.abs(mongoCollection.quantity - parseFloat(blockchainCollection.quantity)) > 0.01) {
                discrepancies.push('quantity mismatch');
            }

            return {
                valid: discrepancies.length === 0,
                discrepancies,
                mongoData: mongoCollection,
                blockchainData: blockchainCollection
            };

        } catch (error) {
            throw new ApiError(500, 'Failed to validate collection integrity');
        }
    }
}

module.exports = CollectionService;
