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
}, { timestamps: true });

HerbSchema.plugin(toJSON);
HerbSchema.plugin(paginate);

module.exports = mongoose.model('Herb', HerbSchema);
