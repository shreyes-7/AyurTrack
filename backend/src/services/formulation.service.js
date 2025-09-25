// src/services/formulation.service.js
const { Formulation, Batch, User, Herb } = require('../models');
const { getContract } = require('../../fabric/fabricClient');
const ApiError = require('../utils/ApiError');

class FormulationService {

    static async createFormulation(formulationData, manufacturerUser) {
        console.log('Creating product formulation:', formulationData);

        try {
            // Validate manufacturer
            if (!manufacturerUser.isBlockchainEnrolled) {
                throw new ApiError(400, 'User must be enrolled in blockchain to create formulations');
            }

            if (manufacturerUser.participantType !== 'manufacturer') {
                throw new ApiError(400, 'Only manufacturers can create formulations');
            }

            // Validate input batches exist and are available
            const inputBatches = await this.validateInputBatches(formulationData.inputBatches, manufacturerUser.blockchainUserId);

            // Calculate total input quantity
            const totalInputQuantity = inputBatches.reduce((sum, batch) => sum + batch.quantity, 0);

            // Auto-generate product batch ID
            const productBatchId = `PROD_${Date.now()}_${manufacturerUser.blockchainUserId}`;
            const timestamp = new Date().toISOString();

            // Generate QR token for product traceability
            const qrToken = `${productBatchId}_${Date.now()}`;

            // Create formulation record
            const formulationRecord = new Formulation({
                productBatchId,
                manufacturerId: manufacturerUser.blockchainUserId,
                inputBatches: formulationData.inputBatches,
                formulationParams: {
                    ...formulationData.formulationParams,
                    production_date: new Date(),
                    expiry_date: this.calculateExpiryDate(formulationData.formulationParams.product_type),
                    total_input_quantity: totalInputQuantity
                },
                qrToken,
                timestamp: new Date(timestamp),
                isOnChain: false
            });

            // Save to MongoDB
            await formulationRecord.save();

            // Update input batches status to 'used_in_formulation'
            await this.markBatchesAsUsed(formulationData.inputBatches, productBatchId);

            // Submit to blockchain
            await this.submitFormulationToBlockchain(
                productBatchId,
                manufacturerUser.blockchainUserId,
                formulationData.inputBatches,
                formulationData.formulationParams,
                timestamp
            );

            console.log('✅ Product formulation created successfully');

            return {
                success: true,
                productBatchId,
                qrToken,
                formulation: formulationRecord.toJSON(),
                inputBatchesInfo: inputBatches.map(batch => ({
                    batchId: batch.batchId,
                    species: batch.species,
                    quantity: batch.quantity,
                    collector: batch.collectorId
                })),
                manufacturer: {
                    id: manufacturerUser.blockchainUserId,
                    name: manufacturerUser.name,
                    location: manufacturerUser.getBlockchainLocation()
                }
            };

        } catch (error) {
            console.error('❌ Failed to create formulation:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to create formulation');
        }
    }

    static async getFormulationById(productBatchId, includeDetails = false) {
        try {
            const formulation = await Formulation.findOne({ productBatchId });

            if (!formulation) {
                throw new ApiError(404, 'Formulation not found');
            }

            if (includeDetails) {
                // Get input batch details
                const inputBatches = await Batch.find({
                    batchId: { $in: formulation.inputBatches }
                });

                // Get manufacturer details
                const manufacturer = await User.findOne({
                    blockchainUserId: formulation.manufacturerId
                });

                // Get herb details for each input batch
                const herbSpecies = [...new Set(inputBatches.map(batch => batch.species))];
                const herbs = await Herb.find({ id: { $in: herbSpecies } });

                return {
                    ...formulation.toJSON(),
                    inputBatchDetails: inputBatches.map(batch => {
                        const herb = herbs.find(h => h.id === batch.species);
                        return {
                            ...batch.toJSON(),
                            herb: herb?.toJSON()
                        };
                    }),
                    manufacturer: manufacturer ? {
                        id: manufacturer.blockchainUserId,
                        name: manufacturer.name,
                        location: manufacturer.location,
                        contact: manufacturer.contact
                    } : null,
                    herbsUsed: herbs.map(h => h.toJSON())
                };
            }

            return formulation.toJSON();

        } catch (error) {
            console.error('❌ Failed to get formulation:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to retrieve formulation');
        }
    }

    static async queryFormulations(filter = {}, options = {}) {
        try {
            const query = {};

            // Build query from filters
            if (filter.manufacturerId) query.manufacturerId = filter.manufacturerId;
            if (filter.productType) query['formulationParams.product_type'] = filter.productType;
            if (filter.qrToken) query.qrToken = filter.qrToken;

            // Date range filters
            if (filter.createdFrom || filter.createdTo) {
                query.timestamp = {};
                if (filter.createdFrom) query.timestamp.$gte = new Date(filter.createdFrom);
                if (filter.createdTo) query.timestamp.$lte = new Date(filter.createdTo);
            }

            // Production date filters
            if (filter.productionFrom || filter.productionTo) {
                query['formulationParams.production_date'] = {};
                if (filter.productionFrom) query['formulationParams.production_date'].$gte = new Date(filter.productionFrom);
                if (filter.productionTo) query['formulationParams.production_date'].$lte = new Date(filter.productionTo);
            }

            // Batch size filter
            if (filter.minBatchSize) {
                query['formulationParams.batch_size'] = { $gte: parseInt(filter.minBatchSize) };
            }

            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 10;
            const sortBy = options.sortBy || '-timestamp';

            const result = await Formulation.paginate(query, {
                page,
                limit,
                sort: sortBy,
                populate: []
            });

            return result;

        } catch (error) {
            console.error('❌ Failed to query formulations:', error);
            throw new ApiError(500, 'Failed to query formulations');
        }
    }

    static async getFormulationByQR(qrToken) {
        try {
            const formulation = await this.getFormulationById(
                await this.getProductBatchIdByQR(qrToken),
                true
            );

            // Add QR-specific data
            return {
                ...formulation,
                scanDate: new Date().toISOString(),
                qrToken,
                isExpired: this.isProductExpired(formulation.formulationParams.expiry_date)
            };

        } catch (error) {
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to retrieve formulation by QR code');
        }
    }

    static async getProductBatchIdByQR(qrToken) {
        try {
            const formulation = await Formulation.findOne({ qrToken }, 'productBatchId');

            if (!formulation) {
                throw new ApiError(404, 'QR token not found');
            }

            return formulation.productBatchId;

        } catch (error) {
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to find product by QR token');
        }
    }

    static async getProvenance(productBatchId) {
        try {
            // Try blockchain first
            const blockchainProvenance = await this.getBlockchainProvenance(productBatchId);

            if (blockchainProvenance.status === 'SUCCESS') {
                return blockchainProvenance.data;
            }

            // Fallback to MongoDB construction
            return await this.constructProvenanceFromMongoDB(productBatchId);

        } catch (error) {
            console.error('❌ Failed to get provenance:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to get product provenance');
        }
    }

    static async constructProvenanceFromMongoDB(productBatchId) {
        try {
            const formulation = await this.getFormulationById(productBatchId, true);

            const provenance = {
                productBatchId,
                product: {
                    type: formulation.formulationParams.product_type,
                    dosage: formulation.formulationParams.dosage,
                    batchSize: formulation.formulationParams.batch_size,
                    productionDate: formulation.formulationParams.production_date,
                    expiryDate: formulation.formulationParams.expiry_date
                },
                manufacturer: formulation.manufacturer,
                qrToken: formulation.qrToken,
                inputBatches: [],
                traceabilityChain: []
            };

            // Build full traceability chain for each input batch
            for (const batch of formulation.inputBatchDetails) {
                const batchProvenance = {
                    batchId: batch.batchId,
                    herb: batch.herb,
                    quantity: batch.quantity,
                    collector: batch.collectorId,
                    collectionDate: batch.createdAt,
                    initialQuality: batch.initialQuality,
                    finalStatus: batch.status
                };

                // Get collection details
                if (batch.collectionId) {
                    const Collection = require('../models/collection.model');
                    const collection = await Collection.findOne({
                        collectionId: batch.collectionId
                    });

                    if (collection) {
                        batchProvenance.collection = {
                            location: collection.location,
                            collectionTimestamp: collection.collectionTimestamp,
                            qualityAtCollection: collection.qualityAtCollection
                        };
                    }
                }

                // Get processing history
                const Processing = require('../models/processing.model');
                const processingSteps = await Processing.find({ batchId: batch.batchId });
                batchProvenance.processing = processingSteps;

                // Get quality tests
                const QualityTest = require('../models/qualityTest.model');
                const qualityTests = await QualityTest.find({ batchId: batch.batchId });
                batchProvenance.qualityTests = qualityTests;

                provenance.inputBatches.push(batchProvenance);
            }

            provenance.source = 'MongoDB (Complete Chain)';
            return provenance;

        } catch (error) {
            throw new ApiError(500, 'Failed to construct provenance from MongoDB');
        }
    }

    static async generateQRCode(productBatchId) {
        try {
            const formulation = await Formulation.findOne({ productBatchId });

            if (!formulation) {
                throw new ApiError(404, 'Product formulation not found');
            }

            // Generate new QR token if not exists
            if (!formulation.qrToken) {
                const qrToken = `${productBatchId}_${Date.now()}`;
                formulation.qrToken = qrToken;
                await formulation.save();
            }

            // Submit QR generation to blockchain
            await this.submitQRGenerationToBlockchain(productBatchId, formulation.qrToken);

            return {
                success: true,
                productBatchId,
                qrToken: formulation.qrToken,
                qrData: {
                    productBatchId,
                    token: formulation.qrToken,
                    scanUrl: `${process.env.FRONTEND_URL}/scan/${formulation.qrToken}`,
                    manufacturer: formulation.manufacturerId,
                    productType: formulation.formulationParams.product_type
                }
            };

        } catch (error) {
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to generate QR code');
        }
    }

    static async getFormulationsByManufacturer(manufacturerId, options = {}) {
        try {
            const filter = { manufacturerId };
            return await this.queryFormulations(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get formulations by manufacturer');
        }
    }

    static async getFormulationsByProductType(productType, options = {}) {
        try {
            const filter = { productType };
            return await this.queryFormulations(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get formulations by product type');
        }
    }

    static async getFormulationStatistics(filter = {}) {
        try {
            // Build match stage
            const matchStage = {};
            if (filter.manufacturerId) matchStage.manufacturerId = filter.manufacturerId;
            if (filter.dateFrom || filter.dateTo) {
                matchStage.timestamp = {};
                if (filter.dateFrom) matchStage.timestamp.$gte = new Date(filter.dateFrom);
                if (filter.dateTo) matchStage.timestamp.$lte = new Date(filter.dateTo);
            }

            // Overview statistics
            const overviewStats = await Formulation.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalFormulations: { $sum: 1 },
                        totalBatchSize: { $sum: { $toDouble: '$formulationParams.batch_size' } },
                        averageBatchSize: { $avg: { $toDouble: '$formulationParams.batch_size' } },
                        earliestProduction: { $min: '$formulationParams.production_date' },
                        latestProduction: { $max: '$formulationParams.production_date' }
                    }
                }
            ]);

            // Product type distribution
            const productTypeStats = await Formulation.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$formulationParams.product_type',
                        count: { $sum: 1 },
                        totalBatchSize: { $sum: { $toDouble: '$formulationParams.batch_size' } }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Manufacturer distribution
            const manufacturerStats = await Formulation.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$manufacturerId',
                        count: { $sum: 1 },
                        totalBatchSize: { $sum: { $toDouble: '$formulationParams.batch_size' } }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Monthly production trends
            const monthlyTrends = await Formulation.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            year: { $year: '$formulationParams.production_date' },
                            month: { $month: '$formulationParams.production_date' }
                        },
                        count: { $sum: 1 },
                        totalBatchSize: { $sum: { $toDouble: '$formulationParams.batch_size' } }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            return {
                overview: overviewStats[0] || {
                    totalFormulations: 0,
                    totalBatchSize: 0,
                    averageBatchSize: 0
                },
                productTypeDistribution: productTypeStats,
                manufacturerDistribution: manufacturerStats,
                monthlyTrends
            };

        } catch (error) {
            throw new ApiError(500, 'Failed to get formulation statistics');
        }
    }

    // Validation and Helper Methods
    static async validateInputBatches(batchIds, manufacturerId) {
        try {
            const batches = await Batch.find({
                batchId: { $in: batchIds },
                status: { $in: ['quality-tested', 'processed-packaging'] },
                currentOwner: manufacturerId
            });

            if (batches.length !== batchIds.length) {
                const foundIds = batches.map(b => b.batchId);
                const missingIds = batchIds.filter(id => !foundIds.includes(id));
                throw new ApiError(400, `Invalid or unavailable batch IDs: ${missingIds.join(', ')}`);
            }

            // Check if any batches are already used
            const usedBatches = batches.filter(b => b.status === 'used_in_formulation');
            if (usedBatches.length > 0) {
                throw new ApiError(400, `Batches already used in formulation: ${usedBatches.map(b => b.batchId).join(', ')}`);
            }

            return batches;

        } catch (error) {
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to validate input batches');
        }
    }

    static async markBatchesAsUsed(batchIds, productBatchId) {
        try {
            await Batch.updateMany(
                { batchId: { $in: batchIds } },
                {
                    status: 'used_in_formulation',
                    $push: { usedIn: productBatchId }
                }
            );
        } catch (error) {
            console.error('Failed to mark batches as used:', error);
        }
    }

    static calculateExpiryDate(productType) {
        const expiryMonths = {
            'capsules': 24,
            'tablets': 24,
            'powder': 18,
            'syrup': 12,
            'oil': 36
        };

        const months = expiryMonths[productType] || 24;
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + months);
        return expiryDate;
    }

    static isProductExpired(expiryDate) {
        return new Date() > new Date(expiryDate);
    }

    // Blockchain Integration Methods
    static async submitFormulationToBlockchain(productBatchId, manufacturerId, inputBatches, formulationParams, timestamp) {
        setImmediate(async () => {
            try {
                console.log('🔗 Submitting formulation to blockchain:', productBatchId);

                const { contract, gateway } = await getContract(manufacturerId);

                const result = await contract.submitTransaction(
                    'CreateFormulation',
                    productBatchId,
                    manufacturerId,
                    JSON.stringify(inputBatches),
                    JSON.stringify(formulationParams),
                    timestamp
                );

                await gateway.disconnect();

                // Update MongoDB record as blockchain-synced
                await Formulation.findOneAndUpdate(
                    { productBatchId },
                    {
                        isOnChain: true,
                        blockchainTxId: 'tx_' + Date.now()
                    }
                );

                console.log('✅ Formulation successfully submitted to blockchain:', productBatchId);

            } catch (error) {
                console.error('❌ Failed to submit formulation to blockchain:', error.message);

                await Formulation.findOneAndUpdate(
                    { productBatchId },
                    {
                        isOnChain: false,
                        blockchainError: error.message.substring(0, 500)
                    }
                );
            }
        });
    }

    static async submitQRGenerationToBlockchain(productBatchId, qrToken) {
        setImmediate(async () => {
            try {
                console.log('🔗 Submitting QR generation to blockchain:', productBatchId);

                const { contract, gateway } = await getContract('admin');

                await contract.submitTransaction(
                    'GenerateBatchQR',
                    productBatchId,
                    qrToken
                );

                await gateway.disconnect();
                console.log('✅ QR generation submitted to blockchain');

            } catch (error) {
                console.error('❌ Failed to submit QR generation to blockchain:', error.message);
            }
        });
    }

    static async getBlockchainProvenance(productBatchId) {
        try {
            const { contract, gateway } = await getContract('admin');

            const result = await contract.evaluateTransaction('GetProvenance', productBatchId);
            const provenance = JSON.parse(result.toString());

            await gateway.disconnect();

            return {
                status: 'SUCCESS',
                data: provenance
            };

        } catch (error) {
            return {
                status: 'ERROR',
                message: `Failed to get blockchain provenance: ${error.message}`
            };
        }
    }

    static async getBlockchainFormulations() {
        try {
            const { contract, gateway } = await getContract('admin');

            const result = await contract.evaluateTransaction('QueryByPrefix', 'PRODUCT:');
            const formulations = JSON.parse(result.toString());

            await gateway.disconnect();

            return {
                status: 'SUCCESS',
                data: formulations
            };

        } catch (error) {
            return {
                status: 'ERROR',
                message: `Failed to get blockchain formulations: ${error.message}`
            };
        }
    }
}

module.exports = FormulationService;
