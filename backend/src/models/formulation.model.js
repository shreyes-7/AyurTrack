// formulation.model.js (Enhanced)
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const formulationSchema = mongoose.Schema(
    {
        productBatchId: {
            type: String,
            required: true,
            unique: true
        },
        manufacturerId: {
            type: String,
            required: true,
            ref: 'User'
        },
        inputBatches: [{
            type: String,
            ref: 'Batch',
            required: true
        }],
        formulationParams: {
            product_type: {
                type: String,
                enum: ['capsules', 'tablets', 'powder', 'syrup', 'oil'],
                required: true
            },
            dosage: String,
            batch_size: String,

            // Enhanced formula tracking
            formula_ratio: mongoose.Schema.Types.Mixed,
            excipients: [String],

            // Product-specific fields
            tablet_weight: String,
            capsule_size: String,
            powder_mesh_size: String,

            // Production details
            production_date: Date,
            expiry_date: Date,
            storage_conditions: String
        },
        qrToken: {
            type: String,
            unique: true,
            sparse: true
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

formulationSchema.plugin(toJSON);
formulationSchema.plugin(paginate);

// Enhanced indexes
formulationSchema.index({ manufacturerId: 1, timestamp: -1 });
formulationSchema.index({ qrToken: 1 });
formulationSchema.index({ 'formulationParams.product_type': 1 });
formulationSchema.index({ inputBatches: 1 });

const Formulation = mongoose.model('Formulation', formulationSchema);
module.exports = Formulation;
