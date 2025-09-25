// src/services/consumer.service.js
const BatchService = require('./batch.service');
const CollectionService = require('./collection.service');
const ProcessingService = require('./processing.service');
const QualityTestService = require('./qualityTest.service');
const FormulationService = require('./formulation.service');
const ApiError = require('../utils/ApiError');

class ConsumerService {

    static async getCompleteProductInfo(batchId) {
        console.log('Getting complete product information for batch:', batchId);

        try {
            // Use existing services to get all data in parallel
            const [
                batchDetails,
                collectionDetails,
                processingChain,
                qualityTests,
                batchProvenance
            ] = await Promise.all([
                BatchService.getBatchById(batchId, true).catch(() => null),
                this.getCollectionForBatch(batchId).catch(() => null),
                ProcessingService.getProcessingChain(batchId).catch(() => ({ processingChain: [] })),
                QualityTestService.getQualityTestsByBatch(batchId).catch(() => ({ results: [] })),
                BatchService.getBatchProvenance(batchId).catch(() => null)
            ]);

            if (!batchDetails) {
                throw new ApiError(404, 'Batch not found');
            }

            // Get formulations that used this batch
            const { Formulation } = require('../models');
            const formulations = await Formulation.find({
                inputBatches: { $in: [batchId] }
            });

            // Get detailed formulation info using existing service
            const productDetails = [];
            for (const formulation of formulations) {
                try {
                    const productDetail = await FormulationService.getFormulationById(formulation.productBatchId, true);
                    productDetails.push(productDetail);
                } catch (error) {
                    console.error(`Failed to get formulation details for ${formulation.productBatchId}:`, error);
                }
            }

            // Build complete response using data from existing services
            const completeInfo = {
                // Basic Information
                product: {
                    batchId: batchDetails.batchId,
                    species: batchDetails.species,
                    quantity: `${batchDetails.quantity}kg`,
                    status: batchDetails.status,
                    createdDate: batchDetails.createdAt,
                    herb: batchDetails.herb ? {
                        name: batchDetails.herb.name,
                        scientificName: batchDetails.herb.scientificName,
                        category: batchDetails.herb.category,
                        commonNames: batchDetails.herb.commonNames || []
                    } : null
                },

                // Origin Information (from Collection Service data)
                origin: collectionDetails ? {
                    collectionId: collectionDetails.collectionId,
                    farmer: {
                        name: collectionDetails.collector?.name || 'Certified Farmer',
                        location: collectionDetails.collector?.location?.address || 'Farm Location',
                        contact: collectionDetails.collector?.contact,
                        certifications: collectionDetails.collector?.certifications || []
                    },
                    location: {
                        coordinates: {
                            latitude: collectionDetails.location.latitude,
                            longitude: collectionDetails.location.longitude
                        },
                        address: collectionDetails.collector?.location?.address || 'Farm Location'
                    },
                    collectionDate: collectionDetails.collectionTimestamp,
                    qualityAtHarvest: {
                        moisture: collectionDetails.qualityAtCollection?.moisture ?
                            `${collectionDetails.qualityAtCollection.moisture}%` : 'Not recorded',
                        pesticideLevel: collectionDetails.qualityAtCollection?.pesticidePPM ?
                            `${collectionDetails.qualityAtCollection.pesticidePPM} PPM` : 'Not recorded'
                    }
                } : null,

                // Processing Information (from Processing Service data)
                processing: {
                    totalSteps: processingChain.processingChain?.length || 0,
                    steps: processingChain.processingChain?.map(step => ({
                        id: step.processId,
                        type: step.stepType,
                        date: step.timestamp,
                        facility: {
                            name: step.facility?.name || 'Processing Facility',
                            location: step.facility?.location?.address || 'Processing Location',
                            certifications: step.facility?.certifications || []
                        },
                        parameters: {
                            temperature: step.params?.temperature || 'Not specified',
                            duration: step.params?.duration || 'Not specified',
                            method: step.params?.method || 'Standard method'
                        }
                    })) || [],
                    summary: `Processed through ${processingChain.processingChain?.length || 0} quality-controlled steps`
                },

                // Quality Information (from Quality Test Service data)
                quality: {
                    totalTests: qualityTests.results?.length || 0,
                    passedTests: qualityTests.results?.filter(test => test.results.pass).length || 0,
                    overallScore: this.calculateQualityScore(qualityTests.results),
                    rating: this.getQualityRating(qualityTests.results),
                    tests: qualityTests.results?.map(test => ({
                        id: test.testId,
                        type: this.getTestTypeDisplayName(test.testType),
                        date: test.timestamp,
                        result: test.results.pass ? 'PASSED' : 'FAILED',
                        lab: {
                            name: test.lab?.name || 'Certified Laboratory',
                            location: test.lab?.location?.address || 'Testing Facility',
                            certifications: test.lab?.certifications || []
                        },
                        details: this.getConsumerFriendlyTestResults(test.testType, test.results)
                    })) || [],
                    summary: this.getQualitySummary(qualityTests.results)
                },

                // Final Products (from Formulation Service data)
                finalProducts: productDetails.map(product => ({
                    id: product.productBatchId,
                    type: product.formulationParams.product_type,
                    dosage: product.formulationParams.dosage,
                    batchSize: product.formulationParams.batch_size,
                    productionDate: product.formulationParams.production_date,
                    expiryDate: product.formulationParams.expiry_date,
                    isExpired: new Date() > new Date(product.formulationParams.expiry_date),
                    qrToken: product.qrToken,
                    manufacturer: {
                        name: product.manufacturer?.name || 'Certified Manufacturer',
                        location: product.manufacturer?.location?.address || 'Manufacturing Facility',
                        certifications: product.manufacturer?.certifications || []
                    },
                    ingredients: product.inputBatchDetails?.map(batch => ({
                        batchId: batch.batchId,
                        species: batch.species,
                        quantity: `${batch.quantity}kg`
                    })) || []
                })),

                // Complete Journey Timeline
                journey: this.buildCompleteJourney(
                    collectionDetails,
                    processingChain.processingChain,
                    qualityTests.results,
                    productDetails
                ),

                // Summary Metrics
                summary: {
                    totalDays: this.calculateJourneyDays(collectionDetails, productDetails),
                    totalStakeholders: this.countAllStakeholders(
                        collectionDetails,
                        processingChain.processingChain,
                        qualityTests.results,
                        productDetails
                    ),
                    qualityScore: this.calculateQualityScore(qualityTests.results),
                    processingSteps: processingChain.processingChain?.length || 0,
                    qualityTests: qualityTests.results?.length || 0,
                    finalProducts: productDetails.length
                },

                // Authenticity Verification
                authenticity: {
                    verified: true,
                    verificationDate: new Date().toISOString(),
                    batchId: batchDetails.batchId,
                    blockchain: {
                        recorded: batchDetails.isOnChain || false,
                        transactionId: batchDetails.blockchainTxId || null
                    },
                    provenance: batchProvenance ? 'Complete blockchain traceability available' : 'Database traceability verified',
                    message: "This product has complete traceability from farm to consumer"
                },

                // Sustainability Information
                sustainability: {
                    farmingPractices: this.getSustainabilityInfo(
                        collectionDetails,
                        processingChain.processingChain,
                        qualityTests.results
                    ),
                    certifications: this.getAllCertifications(
                        collectionDetails,
                        processingChain.processingChain,
                        qualityTests.results,
                        productDetails
                    ),
                    localSourcing: collectionDetails?.location ? "Locally sourced and traceable" : "Source verified",
                    environmentalImpact: "Monitored throughout supply chain",
                    supplyChainTransparency: "Full visibility from farm to shelf"
                }
            };

            console.log('✅ Complete product information retrieved successfully');
            return completeInfo;

        } catch (error) {
            console.error('❌ Failed to get complete product information:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to retrieve complete product information');
        }
    }

    // Helper method to get collection details using existing service
    static async getCollectionForBatch(batchId) {
        try {
            const batchDetails = await BatchService.getBatchById(batchId);
            if (batchDetails?.collectionId) {
                return await CollectionService.getCollectionById(batchDetails.collectionId, true);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    // Journey Timeline Builder
    static buildCompleteJourney(collection, processingSteps, qualityTests, products) {
        const journey = [];

        // Collection Event
        if (collection) {
            journey.push({
                stage: 'Harvest',
                date: collection.collectionTimestamp,
                icon: '🌱',
                title: 'Herb Collection',
                description: `${collection.quantity}kg of ${collection.species || 'herbs'} collected from certified farm`,
                stakeholder: {
                    type: 'Farmer',
                    name: collection.collector?.name || 'Certified Farmer',
                    location: collection.collector?.location?.address || 'Farm'
                },
                details: {
                    quantity: `${collection.quantity}kg`,
                    coordinates: collection.location,
                    qualityAtHarvest: collection.qualityAtCollection
                }
            });
        }

        // Processing Events
        processingSteps?.forEach(step => {
            journey.push({
                stage: 'Processing',
                date: step.timestamp,
                icon: '⚙️',
                title: `${step.stepType.charAt(0).toUpperCase() + step.stepType.slice(1)} Processing`,
                description: `Professional ${step.stepType} processing completed`,
                stakeholder: {
                    type: 'Processor',
                    name: step.facility?.name || 'Processing Facility',
                    location: step.facility?.location?.address || 'Processing Center'
                },
                details: {
                    method: step.params?.method || 'Standard process',
                    parameters: step.params || {}
                }
            });
        });

        // Quality Test Events
        qualityTests?.forEach(test => {
            journey.push({
                stage: 'Quality Control',
                date: test.timestamp,
                icon: test.results.pass ? '✅' : '❌',
                title: this.getTestTypeDisplayName(test.testType),
                description: `Quality test ${test.results.pass ? 'passed' : 'failed'} - ${this.getTestDescription(test.testType)}`,
                stakeholder: {
                    type: 'Laboratory',
                    name: test.lab?.name || 'Certified Laboratory',
                    location: test.lab?.location?.address || 'Testing Facility'
                },
                details: {
                    result: test.results.pass ? 'PASSED' : 'FAILED',
                    testResults: this.getConsumerFriendlyTestResults(test.testType, test.results)
                }
            });
        });

        // Manufacturing Events
        products?.forEach(product => {
            journey.push({
                stage: 'Manufacturing',
                date: product.formulationParams.production_date,
                icon: '🏭',
                title: 'Product Manufacturing',
                description: `${product.formulationParams.product_type} manufactured and packaged`,
                stakeholder: {
                    type: 'Manufacturer',
                    name: product.manufacturer?.name || 'Certified Manufacturer',
                    location: product.manufacturer?.location?.address || 'Manufacturing Plant'
                },
                details: {
                    productType: product.formulationParams.product_type,
                    batchSize: product.formulationParams.batch_size,
                    dosage: product.formulationParams.dosage,
                    qrToken: product.qrToken
                }
            });
        });

        return journey.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Utility Methods
    static calculateQualityScore(qualityTests) {
        if (!qualityTests || qualityTests.length === 0) return 100;
        const passedTests = qualityTests.filter(test => test.results.pass).length;
        return Math.round((passedTests / qualityTests.length) * 100);
    }

    static getQualityRating(qualityTests) {
        const score = this.calculateQualityScore(qualityTests);
        if (score === 100) return 'Excellent';
        if (score >= 90) return 'Very Good';
        if (score >= 75) return 'Good';
        if (score >= 60) return 'Fair';
        return 'Poor';
    }

    static getQualitySummary(qualityTests) {
        if (!qualityTests || qualityTests.length === 0) return 'No quality tests recorded';

        const passedTests = qualityTests.filter(test => test.results.pass).length;
        const totalTests = qualityTests.length;

        if (passedTests === totalTests) {
            return `All ${totalTests} quality tests passed successfully`;
        } else {
            return `${passedTests} out of ${totalTests} quality tests passed`;
        }
    }

    static countAllStakeholders(collection, processingSteps, qualityTests, products) {
        const stakeholders = new Set();

        if (collection?.collector?.id) stakeholders.add(collection.collector.id);

        processingSteps?.forEach(step => {
            if (step.facility?.id) stakeholders.add(step.facility.id);
        });

        qualityTests?.forEach(test => {
            if (test.lab?.id) stakeholders.add(test.lab.id);
        });

        products?.forEach(product => {
            if (product.manufacturer?.id) stakeholders.add(product.manufacturer.id);
        });

        return stakeholders.size;
    }

    static calculateJourneyDays(collection, products) {
        if (!collection || !products || products.length === 0) return 0;

        const startDate = new Date(collection.collectionTimestamp);
        const endDate = new Date(products[products.length - 1].formulationParams.production_date);

        return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    }

    static getTestTypeDisplayName(testType) {
        const names = {
            'moisturetest': 'Moisture Content Test',
            'pesticidetest': 'Pesticide Residue Test',
            'activecompound': 'Active Compound Analysis',
            'microbiological': 'Microbiological Safety Test',
            'heavy_metals': 'Heavy Metals Test'
        };
        return names[testType] || testType;
    }

    static getTestDescription(testType) {
        const descriptions = {
            'moisturetest': 'Ensures optimal moisture levels for preservation',
            'pesticidetest': 'Confirms absence of harmful pesticide residues',
            'activecompound': 'Verifies potency of active ingredients',
            'microbiological': 'Ensures product is free from harmful microorganisms',
            'heavy_metals': 'Confirms absence of toxic heavy metals'
        };
        return descriptions[testType] || 'Quality verification test';
    }

    static getConsumerFriendlyTestResults(testType, results) {
        switch (testType) {
            case 'moisturetest':
                return {
                    moisture: `${results.moisture}%`,
                    status: results.pass ? 'Within safe limits' : 'Above recommended levels',
                    message: results.pass ? 'Properly dried for preservation' : 'Excessive moisture detected'
                };
            case 'pesticidetest':
                return {
                    pesticideLevel: `${results.pesticidePPM} PPM`,
                    status: results.pass ? 'Safe for consumption' : 'Above safety limits',
                    compoundsTested: results.compounds_tested?.length || 0,
                    message: results.pass ? 'No harmful pesticide residues' : 'Pesticide contamination detected'
                };
            case 'activecompound':
                return {
                    activeCompounds: {
                        ...(results.withanolides && { withanolides: `${results.withanolides}%` }),
                        ...(results.curcumin && { curcumin: `${results.curcumin}%` })
                    },
                    status: results.pass ? 'Adequate potency confirmed' : 'Below expected potency',
                    message: results.pass ? 'Active ingredients at therapeutic levels' : 'Low active compound content'
                };
            default:
                return {
                    status: results.pass ? 'Passed' : 'Failed',
                    message: results.pass ? 'Meets quality standards' : 'Does not meet quality standards'
                };
        }
    }

    static getSustainabilityInfo(collection, processingSteps, qualityTests) {
        const practices = [];

        if (collection) {
            practices.push('Traceable farming origin');
            if (collection.collector?.certifications?.includes('Organic')) {
                practices.push('Certified organic farming');
            }
        }

        if (processingSteps?.length > 0) {
            practices.push('Quality-controlled processing');
        }

        if (qualityTests?.length > 0) {
            practices.push('Rigorous quality testing');
        }

        return practices.length > 0 ? practices.join(', ') : 'Standard practices followed';
    }

    static getAllCertifications(collection, processingSteps, qualityTests, products) {
        const certifications = new Set();

        collection?.collector?.certifications?.forEach(cert => certifications.add(cert));

        processingSteps?.forEach(step => {
            step.facility?.certifications?.forEach(cert => certifications.add(cert));
        });

        qualityTests?.forEach(test => {
            test.lab?.certifications?.forEach(cert => certifications.add(cert));
        });

        products?.forEach(product => {
            product.manufacturer?.certifications?.forEach(cert => certifications.add(cert));
        });

        return Array.from(certifications);
    }
}

module.exports = ConsumerService;
