// src/controllers/qualityTest.controller.js
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const QualityTestService = require('../services/qualityTest.service');
const pick = require('../utils/pick');

class QualityTestController {

    // Add quality test to batch
    static addQualityTest = catchAsync(async (req, res) => {
        const { batchId } = req.params;
        const result = await QualityTestService.addQualityTest(batchId, req.body, req.user);
        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Quality test added successfully',
            data: result
        });
    });

    // Get single quality test
    static getQualityTest = catchAsync(async (req, res) => {
        const { testId } = req.params;
        const includeDetails = req.query.details === 'true';

        const result = await QualityTestService.getQualityTestById(testId, includeDetails);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Query quality tests with filters
    static getQualityTests = catchAsync(async (req, res) => {
        const filter = pick(req.query, [
            'batchId',
            'labId',
            'testType',
            'pass',
            'testFrom',
            'testTo',
            'minMoisture',
            'maxMoisture',
            'maxPesticidePPM',
            'minActiveCompound'
        ]);
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await QualityTestService.queryQualityTests(filter, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get quality tests by batch
    static getQualityTestsByBatch = catchAsync(async (req, res) => {
        const { batchId } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await QualityTestService.getQualityTestsByBatch(batchId, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get quality tests by lab
    static getQualityTestsByLab = catchAsync(async (req, res) => {
        const { labId } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await QualityTestService.getQualityTestsByLab(labId, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get quality tests by type
    static getQualityTestsByType = catchAsync(async (req, res) => {
        const { testType } = req.params;
        const options = pick(req.query, ['page', 'limit', 'sortBy']);

        const result = await QualityTestService.getQualityTestsByType(testType, options);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get comprehensive quality report for batch
    static getQualityReport = catchAsync(async (req, res) => {
        const { batchId } = req.params;

        const result = await QualityTestService.getQualityReport(batchId);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get quality statistics
    static getQualityStatistics = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['labId', 'testType', 'dateFrom', 'dateTo']);

        const result = await QualityTestService.getQualityStatistics(filter);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Get lab testing capacity
    static getLabCapacity = catchAsync(async (req, res) => {
        const { labId } = req.params;
        const dateRange = pick(req.query, ['from', 'to']);

        const result = await QualityTestService.getLabCapacity(labId, dateRange);
        res.status(httpStatus.OK).json({
            success: true,
            data: result
        });
    });

    // Blockchain-specific endpoints
    static getBlockchainQualityTests = catchAsync(async (req, res) => {
        const { batchId } = req.params;

        const result = await QualityTestService.getBlockchainQualityTests(batchId);

        if (result.status === 'SUCCESS') {
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Blockchain quality tests retrieved successfully',
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

    // Validate quality test data integrity
    static validateQualityTestIntegrity = catchAsync(async (req, res) => {
        const { testId } = req.params;

        const result = await QualityTestService.validateQualityTestIntegrity(testId);
        res.status(httpStatus.OK).json({
            success: true,
            validation: result
        });
    });

    // Dashboard and analytics
    static getQualityTestDashboard = catchAsync(async (req, res) => {
        const userId = req.user.blockchainUserId;
        const userType = req.user.participantType;

        let filter = {};

        // Filter based on user type
        if (userType === 'lab') {
            filter.labId = userId;
        }
        // Admin can see all

        // Recent quality tests
        const recentQualityTests = await QualityTestService.queryQualityTests(filter, {
            page: 1,
            limit: 10,
            sortBy: '-timestamp'
        });

        // Statistics
        const statistics = await QualityTestService.getQualityStatistics(filter);

        // Lab capacity if lab user
        let capacity = null;
        if (userType === 'lab') {
            capacity = await QualityTestService.getLabCapacity(userId, {
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
                to: new Date().toISOString()
            });
        }

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                recentQualityTests: recentQualityTests.results,
                statistics,
                capacity,
                userType,
                userId
            }
        });
    });

    // Quality compliance report
    static getQualityComplianceReport = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['labId', 'testType', 'dateFrom', 'dateTo']);

        const statistics = await QualityTestService.getQualityStatistics(filter);

        // Calculate compliance metrics
        const complianceReport = {
            ...statistics,
            complianceScore: statistics.overview.passRate,
            riskLevel: statistics.overview.passRate >= 95 ? 'LOW' :
                statistics.overview.passRate >= 85 ? 'MEDIUM' : 'HIGH',
            recommendations: []
        };

        // Add recommendations based on performance
        if (statistics.overview.passRate < 90) {
            complianceReport.recommendations.push('Review testing procedures and quality control measures');
        }

        if (statistics.overview.failedTests > statistics.overview.passedTests * 0.1) {
            complianceReport.recommendations.push('Investigate frequent failure patterns');
        }

        // Check lab performance consistency
        const inconsistentLabs = statistics.labPerformance.filter(lab => lab.passRate < 85);
        if (inconsistentLabs.length > 0) {
            complianceReport.recommendations.push(`Review performance of labs: ${inconsistentLabs.map(lab => lab._id).join(', ')}`);
        }

        res.status(httpStatus.OK).json({
            success: true,
            data: complianceReport
        });
    });

    // Quality trend analysis
    static getQualityTrendAnalysis = catchAsync(async (req, res) => {
        const { testType } = req.params;
        const filter = pick(req.query, ['labId', 'dateFrom', 'dateTo']);
        filter.testType = testType;

        const qualityTests = await QualityTestService.queryQualityTests(filter, {
            limit: 1000,
            sortBy: 'timestamp'
        });

        // Analyze trends
        const trendAnalysis = {
            testType,
            totalTests: qualityTests.totalResults,
            timeRange: {
                from: filter.dateFrom,
                to: filter.dateTo
            },
            trends: {
                passRate: [],
                qualityMetrics: []
            }
        };

        // Group by month and analyze trends
        const monthlyData = {};
        qualityTests.results.forEach(test => {
            const monthKey = new Date(test.timestamp).toISOString().substring(0, 7); // YYYY-MM

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    tests: [],
                    passCount: 0,
                    totalCount: 0
                };
            }

            monthlyData[monthKey].tests.push(test);
            monthlyData[monthKey].totalCount++;
            if (test.results.pass) {
                monthlyData[monthKey].passCount++;
            }
        });

        // Calculate monthly trends
        Object.keys(monthlyData).sort().forEach(month => {
            const data = monthlyData[month];
            const passRate = (data.passCount / data.totalCount) * 100;

            trendAnalysis.trends.passRate.push({
                month,
                passRate,
                testCount: data.totalCount
            });

            // Calculate average quality metrics for the month
            if (testType === 'moisturetest') {
                const avgMoisture = data.tests
                    .filter(test => test.results.moisture)
                    .reduce((sum, test, _, arr) => sum + test.results.moisture / arr.length, 0);

                if (avgMoisture > 0) {
                    trendAnalysis.trends.qualityMetrics.push({
                        month,
                        metric: 'moisture',
                        value: avgMoisture
                    });
                }
            }
        });

        res.status(httpStatus.OK).json({
            success: true,
            data: trendAnalysis
        });
    });

    // Failed tests analysis
    static getFailedTestsAnalysis = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['labId', 'testType', 'dateFrom', 'dateTo']);
        filter.pass = false; // Only failed tests

        const failedTests = await QualityTestService.queryQualityTests(filter, {
            limit: 1000
        });

        // Analyze failure patterns
        const failureAnalysis = {
            totalFailedTests: failedTests.totalResults,
            failureReasons: {},
            labFailures: {},
            testTypeFailures: {},
            recommendations: []
        };

        failedTests.results.forEach(test => {
            // Count test type failures
            failureAnalysis.testTypeFailures[test.testType] =
                (failureAnalysis.testTypeFailures[test.testType] || 0) + 1;

            // Count lab failures
            failureAnalysis.labFailures[test.labId] =
                (failureAnalysis.labFailures[test.labId] || 0) + 1;

            // Analyze specific failure reasons based on test results
            if (test.results.moisture > 12) {
                failureAnalysis.failureReasons['High Moisture'] =
                    (failureAnalysis.failureReasons['High Moisture'] || 0) + 1;
            }

            if (test.results.pesticidePPM > 2) {
                failureAnalysis.failureReasons['Pesticide Contamination'] =
                    (failureAnalysis.failureReasons['Pesticide Contamination'] || 0) + 1;
            }
        });

        // Generate recommendations
        const topFailureReason = Object.keys(failureAnalysis.failureReasons)
            .reduce((a, b) => failureAnalysis.failureReasons[a] > failureAnalysis.failureReasons[b] ? a : b);

        if (topFailureReason) {
            failureAnalysis.recommendations.push(`Address primary failure cause: ${topFailureReason}`);
        }

        const problematicLab = Object.keys(failureAnalysis.labFailures)
            .reduce((a, b) => failureAnalysis.labFailures[a] > failureAnalysis.labFailures[b] ? a : b);

        if (failureAnalysis.labFailures[problematicLab] > 5) {
            failureAnalysis.recommendations.push(`Review procedures at lab: ${problematicLab}`);
        }

        res.status(httpStatus.OK).json({
            success: true,
            data: failureAnalysis
        });
    });

    // Certificate generation (for passed tests)
    static generateQualityCertificate = catchAsync(async (req, res) => {
        const { testId } = req.params;

        const qualityTest = await QualityTestService.getQualityTestById(testId, true);

        if (!qualityTest.results.pass) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Cannot generate certificate for failed quality test'
            });
        }

        const certificate = {
            certificateId: `CERT_${testId}_${Date.now()}`,
            testId: qualityTest.testId,
            batchId: qualityTest.batchId,
            herb: qualityTest.herb,
            lab: qualityTest.lab,
            testType: qualityTest.testType,
            testDate: qualityTest.timestamp,
            results: QualityTestService.extractKeyResults(qualityTest.testType, qualityTest.results),
            status: 'PASSED',
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year validity
            issuedAt: new Date().toISOString(),
            digitalSignature: `sign_${testId}_${Date.now()}` // In real implementation, use actual digital signature
        };

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Quality certificate generated successfully',
            data: certificate
        });
    });
}

module.exports = QualityTestController;
