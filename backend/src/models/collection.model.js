// collection.model.js
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const collectionSchema = mongoose.Schema(
    {
        collectionId: {
            type: String,
            required: true,
            unique: true
        },
        batchId: {
            type: String,
            required: true,
            ref: 'Batch'
        },
        collectorId: {
            type: String,
            required: true,
            ref: 'User'
        },
        // GPS coordinates (immutable)
        location: {
            latitude: {
                type: Number,
                required: true,
                min: -90,
                max: 90
            },
            longitude: {
                type: Number,
                required: true,
                min: -180,
                max: 180
            }
        },
        // Collection timestamp (immutable)
        collectionTimestamp: {
            type: Date,
            required: true
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
        qualityAtCollection: {
            moisture: {
                type: Number,
                min: 0,
                max: 100
            },
            pesticidePPM: {
                type: Number,
                min: 0
            }
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
        timestamps: true, // For system tracking only
    }
);

collectionSchema.plugin(toJSON);
collectionSchema.plugin(paginate);

// Indexes
collectionSchema.index({ collectionId: 1 });
collectionSchema.index({ batchId: 1 });
collectionSchema.index({ collectorId: 1, collectionTimestamp: -1 });
collectionSchema.index({ species: 1, collectionTimestamp: -1 });
collectionSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Geospatial index for location queries
collectionSchema.index({
    location: '2dsphere'
});

const Collection = mongoose.model('Collection', collectionSchema);
module.exports = Collection;
