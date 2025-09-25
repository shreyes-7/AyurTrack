// src/services/qualityTest.service.js
const { QualityTest, Batch, User, Herb } = require('../models');
const { getContract } = require('../../fabric/fabricClient');
const ApiError = require('../utils/ApiError');

class QualityTestService {

    static async addQualityTest(batchId, testData, labUser) {
        console.log('Adding quality test to batch:', batchId, testData);

        try {
            // Validate lab user
            if (!labUser.isBlockchainEnrolled) {
                throw new ApiError(400, 'User must be enrolled in blockchain to conduct quality tests');
            }

            if (labUser.participantType !== 'lab') {
                throw new ApiError(400, 'Only certified labs can conduct quality tests');
            }

            // Validate batch exists and is ready for testing
            const batch = await Batch.findOne({ batchId });
            if (!batch) {
                throw new ApiError(404, `Batch ${batchId} not found`);
            }

            // Check if batch is in a testable state
            const validTestStates = ['processed-packaging', 'processed-sorting', 'collected'];
            if (!validTestStates.includes(batch.status)) {
                throw new ApiError(400, `Batch status ${batch.status} is not suitable for quality testing`);
            }

            // Validate test type and parameters
            this.validateTestData(testData.testType, testData.results);

            // Get herb species for threshold validation
            const herb = await Herb.findOne({ id: batch.species });
            if (herb?.speciesRules?.qualityThresholds) {
                this.validateAgainstThresholds(testData.results, herb.speciesRules.qualityThresholds);
            }

            // Determine pass/fail status
            const passFailResult = this.determinePassFail(testData.testType, testData.results, herb?.speciesRules?.qualityThresholds);

            // Auto-generate test ID
            const testId = `TEST_${Date.now()}_${labUser.blockchainUserId}`;
            const timestamp = new Date().toISOString();

            // Create quality test record
            const qualityTestRecord = new QualityTest({
                testId,
                batchId,
                labId: labUser.blockchainUserId,
                testType: testData.testType,
                results: {
                    ...testData.results,
                    pass: passFailResult.pass,
                    testDate: timestamp,
                    labCertification: labUser.certifications || [],
                    method: testData.results.method || 'Standard laboratory method',
                    standard: testData.results.standard || 'Internal lab standard'
                },
                timestamp: new Date(timestamp),
                isOnChain: false
            });

            // Save to MongoDB
            await qualityTestRecord.save();

            // Update batch with test results
            batch.lastQualityTest = testId;
            if (!passFailResult.pass) {
                batch.status = 'quality-fail';
            } else if (batch.status === 'collected') {
                batch.status = 'quality-tested';
            }
            await batch.save();

            // Submit to blockchain
            await this.submitQualityTestToBlockchain(
                testId,
                batchId,
                labUser.blockchainUserId,
                testData.testType,
                qualityTestRecord.results,
                timestamp
            );

            console.log('✅ Quality test added successfully');

            return {
                success: true,
                testId,
                qualityTest: qualityTestRecord.toJSON(),
                testResult: {
                    pass: passFailResult.pass,
                    score: passFailResult.score,
                    reasons: passFailResult.reasons
                },
                updatedBatch: {
                    batchId: batch.batchId,
                    previousStatus: batch.status,
                    newStatus: batch.status,
                    lastQualityTest: testId
                },
                lab: {
                    id: labUser.blockchainUserId,
                    name: labUser.name,
                    location: labUser.getBlockchainLocation(),
                    certifications: labUser.certifications
                }
            };

        } catch (error) {
            console.error('❌ Failed to add quality test:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to add quality test');
        }
    }

    static async getQualityTestById(testId, includeDetails = false) {
        try {
            const qualityTest = await QualityTest.findOne({ testId });

            if (!qualityTest) {
                throw new ApiError(404, 'Quality test not found');
            }

            if (includeDetails) {
                // Get related batch
                const batch = await Batch.findOne({ batchId: qualityTest.batchId });

                // Get lab details
                const lab = await User.findOne({ blockchainUserId: qualityTest.labId });

                // Get herb details
                const herb = batch ? await Herb.findOne({ id: batch.species }) : null;

                return {
                    ...qualityTest.toJSON(),
                    batch: batch?.toJSON(),
                    lab: lab ? {
                        id: lab.blockchainUserId,
                        name: lab.name,
                        location: lab.location,
                        contact: lab.contact,
                        certifications: lab.certifications
                    } : null,
                    herb: herb?.toJSON()
                };
            }

            return qualityTest.toJSON();

        } catch (error) {
            console.error('❌ Failed to get quality test:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to retrieve quality test');
        }
    }

    static async queryQualityTests(filter = {}, options = {}) {
        try {
            const query = {};

            // Build query from filters
            if (filter.batchId) query.batchId = filter.batchId;
            if (filter.labId) query.labId = filter.labId;
            if (filter.testType) query.testType = filter.testType;
            if (filter.pass !== undefined) query['results.pass'] = filter.pass;

            // Date range filters
            if (filter.testFrom || filter.testTo) {
                query.timestamp = {};
                if (filter.testFrom) query.timestamp.$gte = new Date(filter.testFrom);
                if (filter.testTo) query.timestamp.$lte = new Date(filter.testTo);
            }

            // Quality parameter filters
            if (filter.minMoisture || filter.maxMoisture) {
                query['results.moisture'] = {};
                if (filter.minMoisture) query['results.moisture'].$gte = filter.minMoisture;
                if (filter.maxMoisture) query['results.moisture'].$lte = filter.maxMoisture;
            }

            if (filter.maxPesticidePPM) {
                query['results.pesticidePPM'] = { $lte: filter.maxPesticidePPM };
            }

            if (filter.minActiveCompound) {
                query.$or = [
                    { 'results.withanolides': { $gte: filter.minActiveCompound } },
                    { 'results.curcumin': { $gte: filter.minActiveCompound } }
                ];
            }

            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 10;
            const sortBy = options.sortBy || '-timestamp';

            const result = await QualityTest.paginate(query, {
                page,
                limit,
                sort: sortBy,
                populate: []
            });

            return result;

        } catch (error) {
            console.error('❌ Failed to query quality tests:', error);
            throw new ApiError(500, 'Failed to query quality tests');
        }
    }

    static async getQualityTestsByBatch(batchId, options = {}) {
        try {
            const filter = { batchId };
            return await this.queryQualityTests(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get quality tests by batch');
        }
    }

    static async getQualityTestsByLab(labId, options = {}) {
        try {
            const filter = { labId };
            return await this.queryQualityTests(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get quality tests by lab');
        }
    }

    static async getQualityTestsByType(testType, options = {}) {
        try {
            const filter = { testType };
            return await this.queryQualityTests(filter, options);
        } catch (error) {
            throw new ApiError(500, 'Failed to get quality tests by type');
        }
    }

    static async getQualityReport(batchId) {
        try {
            const qualityTests = await QualityTest.find({ batchId }).sort({ timestamp: 1 });

            if (qualityTests.length === 0) {
                throw new ApiError(404, 'No quality tests found for this batch');
            }

            // Get batch and herb details
            const batch = await Batch.findOne({ batchId });
            const herb = batch ? await Herb.findOne({ id: batch.species }) : null;

            // Analyze test results
            const report = {
                batchId,
                batch: batch?.toJSON(),
                herb: herb?.toJSON(),
                totalTests: qualityTests.length,
                passedTests: qualityTests.filter(test => test.results.pass).length,
                failedTests: qualityTests.filter(test => !test.results.pass).length,
                overallStatus: qualityTests.every(test => test.results.pass) ? 'PASS' : 'FAIL',
                testHistory: [],
                qualitySummary: {},
                compliance: {
                    moistureCompliance: true,
                    pesticideCompliance: true,
                    activeCompoundCompliance: true,
                    overallCompliance: true
                }
            };

            // Build test history
            report.testHistory = qualityTests.map(test => ({
                testId: test.testId,
                testType: test.testType,
                labId: test.labId,
                timestamp: test.timestamp,
                pass: test.results.pass,
                key_results: this.extractKeyResults(test.testType, test.results)
            }));

            // Calculate quality summary
            const moistureTests = qualityTests.filter(test => test.results.moisture !== undefined);
            const pesticideTests = qualityTests.filter(test => test.results.pesticidePPM !== undefined);
            const activeCompoundTests = qualityTests.filter(test =>
                test.results.withanolides !== undefined || test.results.curcumin !== undefined
            );

            if (moistureTests.length > 0) {
                const moistureValues = moistureTests.map(test => test.results.moisture);
                report.qualitySummary.moisture = {
                    average: moistureValues.reduce((a, b) => a + b, 0) / moistureValues.length,
                    min: Math.min(...moistureValues),
                    max: Math.max(...moistureValues),
                    latest: moistureValues[moistureValues.length - 1]
                };
            }

            if (pesticideTests.length > 0) {
                const pesticideValues = pesticideTests.map(test => test.results.pesticidePPM);
                report.qualitySummary.pesticide = {
                    average: pesticideValues.reduce((a, b) => a + b, 0) / pesticideValues.length,
                    max: Math.max(...pesticideValues),
                    latest: pesticideValues[pesticideValues.length - 1]
                };
            }

            // Check compliance against species thresholds
            if (herb?.speciesRules?.qualityThresholds) {
                const thresholds = herb.speciesRules.qualityThresholds;

                if (thresholds.moistureMax && report.qualitySummary.moisture) {
                    report.compliance.moistureCompliance = report.qualitySummary.moisture.max <= thresholds.moistureMax;
                }

                if (thresholds.pesticidePPMMax && report.qualitySummary.pesticide) {
                    report.compliance.pesticideCompliance = report.qualitySummary.pesticide.max <= thresholds.pesticidePPMMax;
                }

                report.compliance.overallCompliance = report.compliance.moistureCompliance &&
                    report.compliance.pesticideCompliance &&
                    report.compliance.activeCompoundCompliance;
            }

            return report;

        } catch (error) {
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to generate quality report');
        }
    }

    static async getQualityStatistics(filter = {}) {
        try {
            // Build match stage
            const matchStage = {};
            if (filter.labId) matchStage.labId = filter.labId;
            if (filter.testType) matchStage.testType = filter.testType;
            if (filter.dateFrom || filter.dateTo) {
                matchStage.timestamp = {};
                if (filter.dateFrom) matchStage.timestamp.$gte = new Date(filter.dateFrom);
                if (filter.dateTo) matchStage.timestamp.$lte = new Date(filter.dateTo);
            }

            // Overview statistics
            const overviewStats = await QualityTest.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalTests: { $sum: 1 },
                        passedTests: {
                            $sum: { $cond: [{ $eq: ['$results.pass', true] }, 1, 0] }
                        },
                        failedTests: {
                            $sum: { $cond: [{ $eq: ['$results.pass', false] }, 1, 0] }
                        },
                        uniqueBatches: { $addToSet: '$batchId' },
                        uniqueLabs: { $addToSet: '$labId' },
                        earliestTest: { $min: '$timestamp' },
                        latestTest: { $max: '$timestamp' }
                    }
                },
                {
                    $project: {
                        totalTests: 1,
                        passedTests: 1,
                        failedTests: 1,
                        passRate: {
                            $multiply: [
                                { $divide: ['$passedTests', '$totalTests'] },
                                100
                            ]
                        },
                        uniqueBatches: { $size: '$uniqueBatches' },
                        uniqueLabs: { $size: '$uniqueLabs' },
                        earliestTest: 1,
                        latestTest: 1
                    }
                }
            ]);

            // Test type distribution
            const testTypeStats = await QualityTest.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$testType',
                        count: { $sum: 1 },
                        passCount: {
                            $sum: { $cond: [{ $eq: ['$results.pass', true] }, 1, 0] }
                        },
                        passRate: {
                            $avg: { $cond: [{ $eq: ['$results.pass', true] }, 100, 0] }
                        }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Lab performance
            const labStats = await QualityTest.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$labId',
                        testCount: { $sum: 1 },
                        passCount: {
                            $sum: { $cond: [{ $eq: ['$results.pass', true] }, 1, 0] }
                        },
                        testTypes: { $addToSet: '$testType' }
                    }
                },
                {
                    $project: {
                        testCount: 1,
                        passCount: 1,
                        passRate: {
                            $multiply: [
                                { $divide: ['$passCount', '$testCount'] },
                                100
                            ]
                        },
                        testTypeCount: { $size: '$testTypes' }
                    }
                },
                { $sort: { testCount: -1 } }
            ]);

            // Quality trends (moisture and pesticide)
            const qualityTrends = await QualityTest.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            year: { $year: '$timestamp' },
                            month: { $month: '$timestamp' }
                        },
                        avgMoisture: { $avg: '$results.moisture' },
                        avgPesticidePPM: { $avg: '$results.pesticidePPM' },
                        testCount: { $sum: 1 },
                        passRate: {
                            $avg: { $cond: [{ $eq: ['$results.pass', true] }, 100, 0] }
                        }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            return {
                overview: overviewStats[0] || {
                    totalTests: 0,
                    passedTests: 0,
                    failedTests: 0,
                    passRate: 0,
                    uniqueBatches: 0,
                    uniqueLabs: 0
                },
                testTypeDistribution: testTypeStats,
                labPerformance: labStats,
                qualityTrends
            };

        } catch (error) {
            throw new ApiError(500, 'Failed to get quality statistics');
        }
    }

    static async getLabCapacity(labId, dateRange = {}) {
        try {
            const matchStage = { labId };

            if (dateRange.from || dateRange.to) {
                matchStage.timestamp = {};
                if (dateRange.from) matchStage.timestamp.$gte = new Date(dateRange.from);
                if (dateRange.to) matchStage.timestamp.$lte = new Date(dateRange.to);
            }

            const capacity = await QualityTest.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
                        },
                        dailyTests: { $sum: 1 },
                        testTypes: { $addToSet: '$testType' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageDailyTests: { $avg: '$dailyTests' },
                        maxDailyTests: { $max: '$dailyTests' },
                        totalDays: { $sum: 1 },
                        totalTests: { $sum: '$dailyTests' }
                    }
                }
            ]);

            // Get lab details
            const lab = await User.findOne({ blockchainUserId: labId });

            return {
                labId,
                labName: lab?.name,
                capacity: capacity[0] || {
                    averageDailyTests: 0,
                    maxDailyTests: 0,
                    totalDays: 0,
                    totalTests: 0
                },
                dateRange,
                certifications: lab?.certifications || []
            };

        } catch (error) {
            throw new ApiError(500, 'Failed to get lab capacity');
        }
    }

    // Validation Methods
    static validateTestData(testType, results) {
        const validations = {
            moisturetest: {
                required: ['moisture', 'method', 'temperature'],
                optional: ['standard', 'notes']
            },
            pesticidetest: {
                required: ['pesticidePPM', 'compounds_tested', 'method'],
                optional: ['standard', 'notes']
            },
            activecompound: {
                required: ['method'],
                optional: ['withanolides', 'curcumin', 'standard', 'notes']
            },
            microbiological: {
                required: ['method'],
                optional: ['total_count', 'yeast_mold', 'ecoli', 'salmonella', 'standard', 'notes']
            },
            heavy_metals: {
                required: ['method'],
                optional: ['lead', 'mercury', 'arsenic', 'cadmium', 'standard', 'notes']
            }
        };

        const validation = validations[testType];
        if (!validation) {
            throw new ApiError(400, `Unknown test type: ${testType}`);
        }

        // Check required parameters
        for (const required of validation.required) {
            if (!results || results[required] === undefined || results[required] === null) {
                throw new ApiError(400, `Missing required parameter for ${testType}: ${required}`);
            }
        }

        // Validate specific parameter ranges
        if (testType === 'moisturetest' && results.moisture) {
            const moisture = parseFloat(results.moisture);
            if (moisture < 0 || moisture > 100) {
                throw new ApiError(400, 'Moisture content must be between 0% and 100%');
            }
        }

        if (testType === 'pesticidetest' && results.pesticidePPM) {
            const ppm = parseFloat(results.pesticidePPM);
            if (ppm < 0) {
                throw new ApiError(400, 'Pesticide PPM cannot be negative');
            }
        }
    }

    static validateAgainstThresholds(results, thresholds) {
        const violations = [];

        if (thresholds.moistureMax && results.moisture) {
            if (parseFloat(results.moisture) > thresholds.moistureMax) {
                violations.push(`Moisture ${results.moisture}% exceeds maximum ${thresholds.moistureMax}%`);
            }
        }

        if (thresholds.pesticidePPMMax && results.pesticidePPM) {
            if (parseFloat(results.pesticidePPM) > thresholds.pesticidePPMMax) {
                violations.push(`Pesticide ${results.pesticidePPM} PPM exceeds maximum ${thresholds.pesticidePPMMax} PPM`);
            }
        }

        if (violations.length > 0) {
            console.warn('Quality threshold violations:', violations);
            // Don't throw error here, just log violations - let determinePassFail handle it
        }
    }

    static determinePassFail(testType, results, thresholds) {
        let pass = true;
        let score = 100;
        const reasons = [];

        // Check against species thresholds
        if (thresholds) {
            if (thresholds.moistureMax && results.moisture) {
                if (parseFloat(results.moisture) > thresholds.moistureMax) {
                    pass = false;
                    score -= 30;
                    reasons.push(`Moisture content exceeds limit (${results.moisture}% > ${thresholds.moistureMax}%)`);
                }
            }

            if (thresholds.pesticidePPMMax && results.pesticidePPM) {
                if (parseFloat(results.pesticidePPM) > thresholds.pesticidePPMMax) {
                    pass = false;
                    score -= 40;
                    reasons.push(`Pesticide level exceeds limit (${results.pesticidePPM} > ${thresholds.pesticidePPMMax} PPM)`);
                }
            }

            if (thresholds.activeCompounds) {
                if (results.withanolides && thresholds.activeCompounds.withanolidesMin) {
                    if (parseFloat(results.withanolides) < thresholds.activeCompounds.withanolidesMin) {
                        pass = false;
                        score -= 20;
                        reasons.push(`Withanolides below minimum (${results.withanolides}% < ${thresholds.activeCompounds.withanolidesMin}%)`);
                    }
                }

                if (results.curcumin && thresholds.activeCompounds.curcuminMin) {
                    if (parseFloat(results.curcumin) < thresholds.activeCompounds.curcuminMin) {
                        pass = false;
                        score -= 20;
                        reasons.push(`Curcumin below minimum (${results.curcumin}% < ${thresholds.activeCompounds.curcuminMin}%)`);
                    }
                }
            }
        }

        // Test-specific validations
        if (testType === 'microbiological') {
            if (results.ecoli && parseFloat(results.ecoli) > 0) {
                pass = false;
                score -= 50;
                reasons.push('E. coli detected');
            }

            if (results.salmonella && parseFloat(results.salmonella) > 0) {
                pass = false;
                score -= 50;
                reasons.push('Salmonella detected');
            }
        }

        return {
            pass,
            score: Math.max(0, score),
            reasons: reasons.length > 0 ? reasons : (pass ? ['All parameters within acceptable limits'] : ['Quality standards not met'])
        };
    }

    static extractKeyResults(testType, results) {
        switch (testType) {
            case 'moisturetest':
                return {
                    moisture: results.moisture,
                    method: results.method
                };
            case 'pesticidetest':
                return {
                    pesticidePPM: results.pesticidePPM,
                    compounds_tested: results.compounds_tested
                };
            case 'activecompound':
                return {
                    withanolides: results.withanolides,
                    curcumin: results.curcumin
                };
            case 'microbiological':
                return {
                    total_count: results.total_count,
                    ecoli: results.ecoli,
                    salmonella: results.salmonella
                };
            case 'heavy_metals':
                return {
                    lead: results.lead,
                    mercury: results.mercury,
                    arsenic: results.arsenic
                };
            default:
                return {};
        }
    }

    // Blockchain Integration Methods
    static async submitQualityTestToBlockchain(testId, batchId, labId, testType, results, timestamp) {
        setImmediate(async () => {
            try {
                console.log('🔗 Submitting quality test to blockchain:', testId);

                const { contract, gateway } = await getContract(labId);

                const result = await contract.submitTransaction(
                    'AddQualityTest',
                    testId,
                    batchId,
                    labId,
                    testType,
                    JSON.stringify(results),
                    timestamp
                );

                await gateway.disconnect();

                // Update MongoDB record as blockchain-synced
                await QualityTest.findOneAndUpdate(
                    { testId },
                    {
                        isOnChain: true,
                        blockchainTxId: 'tx_' + Date.now()
                    }
                );

                console.log('✅ Quality test successfully submitted to blockchain:', testId);

            } catch (error) {
                console.error('❌ Failed to submit quality test to blockchain:', error.message);

                await QualityTest.findOneAndUpdate(
                    { testId },
                    {
                        isOnChain: false,
                        blockchainError: error.message.substring(0, 500)
                    }
                );
            }
        });
    }

    static async getBlockchainQualityTests(batchId) {
        try {
            const { contract, gateway } = await getContract('admin');

            // Query quality tests by batch
            const result = await contract.evaluateTransaction('QueryByPrefix', 'QUALITYTEST:');
            const allQualityTests = JSON.parse(result.toString());

            const batchQualityTests = allQualityTests.filter(qt => qt.batchId === batchId);

            await gateway.disconnect();

            return {
                status: 'SUCCESS',
                data: batchQualityTests
            };

        } catch (error) {
            return {
                status: 'ERROR',
                message: `Failed to get blockchain quality tests: ${error.message}`
            };
        }
    }

    static async validateQualityTestIntegrity(testId) {
        try {
            // Get from MongoDB
            const mongoQualityTest = await this.getQualityTestById(testId);

            // Get from blockchain
            const blockchainResult = await this.getBlockchainQualityTests(mongoQualityTest.batchId);

            if (blockchainResult.status === 'ERROR') {
                return {
                    valid: false,
                    source: 'blockchain_unavailable',
                    message: blockchainResult.message
                };
            }

            const blockchainQualityTest = blockchainResult.data.find(qt => qt.testId === testId);

            if (!blockchainQualityTest) {
                return {
                    valid: false,
                    source: 'not_on_blockchain',
                    message: 'Quality test not found on blockchain'
                };
            }

            // Compare key fields
            const discrepancies = [];

            if (mongoQualityTest.labId !== blockchainQualityTest.labId) {
                discrepancies.push('labId mismatch');
            }

            if (mongoQualityTest.testType !== blockchainQualityTest.testType) {
                discrepancies.push('testType mismatch');
            }

            if (mongoQualityTest.results.pass !== blockchainQualityTest.results.pass) {
                discrepancies.push('test result mismatch');
            }

            return {
                valid: discrepancies.length === 0,
                discrepancies,
                mongoData: mongoQualityTest,
                blockchainData: blockchainQualityTest
            };

        } catch (error) {
            throw new ApiError(500, 'Failed to validate quality test integrity');
        }
    }
}

module.exports = QualityTestService;
