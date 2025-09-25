const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const processingSchema = mongoose.Schema(
    {
        processId: {
            type: String,
            required: true,
            unique: true
        },
        batchId: {
            type: String,
            required: true,
            ref: 'Batch'
        },
        facilityId: {
            type: String,
            required: true,
            ref: 'User'
        },
        stepType: {
            type: String,
            required: true,
            enum: ['cleaning', 'drying', 'grinding', 'sorting', 'packaging']
        },
        // Enhanced parameters structure
        params: {
            // Drying specific
            temperature: String,
            duration: String,
            method: String,
            humidity: String,

            // Grinding specific
            mesh_size: String,

            // General processing
            equipment: String,
            operator: String,
            notes: String
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

processingSchema.plugin(toJSON);
processingSchema.plugin(paginate);

// Enhanced indexes
processingSchema.index({ batchId: 1, timestamp: 1 });
processingSchema.index({ facilityId: 1, stepType: 1 });
processingSchema.index({ stepType: 1, timestamp: -1 });

const Processing = mongoose.model('Processing', processingSchema);
module.exports = Processing;
