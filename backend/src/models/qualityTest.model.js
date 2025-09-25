// qualityTest.model.js (Enhanced)
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const qualityTestSchema = mongoose.Schema(
    {
        testId: {
            type: String,
            required: true,
            unique: true
        },
        batchId: {
            type: String,
            required: true,
            ref: 'Batch'
        },
        labId: {
            type: String,
            required: true,
            ref: 'User'
        },
        testType: {
            type: String,
            required: true,
            enum: [
                'moisturetest',
                'pesticidetest',
                'activecompound',
                'microbiological',
                'heavy_metals'
            ]
        },
        // Flexible results structure based on test type
        results: {
            // Common fields
            moisture: Number,
            pesticidePPM: Number,
            method: String,
            standard: String,
            temperature: String,

            // Species-specific active compounds
            withanolides: Number,  // Ashwagandha
            curcumin: Number,      // Turmeric

            // Pesticide specific
            compounds_tested: [String],

            // Overall pass/fail
            pass: {
                type: Boolean,
                required: true
            }
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now
        },
        blockchainTxId: {
            type: String,
            sparse: true
        },
        isOnChain: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

qualityTestSchema.plugin(toJSON);
qualityTestSchema.plugin(paginate);

// Enhanced indexes
qualityTestSchema.index({ batchId: 1, testType: 1 });
qualityTestSchema.index({ labId: 1, timestamp: -1 });
qualityTestSchema.index({ testType: 1, 'results.pass': 1 });

const QualityTest = mongoose.model('QualityTest', qualityTestSchema);
module.exports = QualityTest;
