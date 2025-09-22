// src/models/herb.model.js
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const HerbSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    owner: {
        type: String,
        required: true
    },
    manufactureDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    docType: {
        type: String,
        default: 'herb'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
        default: 'ACTIVE'
    },
    blockchainStatus: {
        type: String,
        enum: ['PENDING', 'LOGGED', 'FAILED'],
        default: 'PENDING'
    },
    blockchainTxId: {
        type: String,
        default: null
    },
    transferHistory: [{
        previousOwner: String,
        newOwner: String,
        transferredAt: Date,
        blockchainTxId: String
    }]
}, { timestamps: true });

HerbSchema.plugin(toJSON);
HerbSchema.plugin(paginate);

// Indexes for better performance
HerbSchema.index({ id: 1 });
HerbSchema.index({ owner: 1 });
HerbSchema.index({ name: 1 });
HerbSchema.index({ status: 1 });

module.exports = mongoose.model('Herb', HerbSchema);
