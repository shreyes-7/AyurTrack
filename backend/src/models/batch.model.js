// batch.model.js (Fixed - was duplicate of formulation)
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const batchSchema = mongoose.Schema(
    {
        batchId: {
            type: String,
            required: true,
            unique: true
        },
        collectionId: {
            type: String,
            required: true,
            ref: 'Collection'
        },
        collectorId: {
            type: String,
            required: true,
            ref: 'User'
        },
        species: {
            type: String,
            required: true,
            ref: 'Herb'
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        // Current dynamic status
        status: {
            type: String,
            required: true,
            enum: [
                'collected',
                'processed-cleaning',
                'processed-drying',
                'processed-grinding',
                'processed-sorting',
                'processed-packaging',
                'quality-tested',
                'quality-fail',
                'used_in_formulation'
            ],
            default: 'collected'
        },
        // Current owner (changes through supply chain)
        currentOwner: {
            type: String,
            required: true,
            ref: 'User'
        },
        // Latest quality test reference
        lastQualityTest: {
            type: String,
            ref: 'QualityTest'
        },
        // Products this batch is used in
        usedIn: [{
            type: String,
            ref: 'Formulation'
        }],
        // Initial quality at collection (for reference)
        initialQuality: {
            moisture: Number,
            pesticidePPM: Number
        },
        // Blockchain transaction info
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

batchSchema.plugin(toJSON);
batchSchema.plugin(paginate);

// Indexes
batchSchema.index({ batchId: 1 });
batchSchema.index({ collectorId: 1, createdAt: -1 });
batchSchema.index({ status: 1, currentOwner: 1 });
batchSchema.index({ species: 1, status: 1 });

const Batch = mongoose.model('Batch', batchSchema);
module.exports = Batch;
