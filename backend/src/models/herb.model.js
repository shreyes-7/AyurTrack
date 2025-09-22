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
        required: true,
        trim: true
    },
    scientificName: {
        type: String,
        required: true,
        trim: true
    },
    commonNames: [{
        type: String,
        trim: true
    }],
    category: {
        type: String,
        required: true,
        enum: ['MEDICINAL', 'CULINARY', 'AROMATIC', 'ADAPTOGEN', 'DIGESTIVE', 'RESPIRATORY', 'IMMUNE', 'OTHER']
    },
    parts: [{
        type: String,
        enum: ['ROOT', 'LEAF', 'STEM', 'FLOWER', 'SEED', 'BARK', 'FRUIT', 'WHOLE_PLANT'],
        required: true
    }]
}, { timestamps: true });

HerbSchema.plugin(toJSON, {
    transform: (doc, ret) => {
        // Use the custom id field as the main id
        ret.id = ret.id; // Keep custom id
        delete ret._id; // Remove MongoDB _id
        delete ret.__v; // Remove version key
        return ret;
    }
});
HerbSchema.plugin(paginate);

// Basic indexes
HerbSchema.index({ id: 1 });
HerbSchema.index({ name: 1 });
HerbSchema.index({ scientificName: 1 });
HerbSchema.index({ category: 1 });

// Text search index
HerbSchema.index({
    name: 'text',
    scientificName: 'text',
    commonNames: 'text'
});

module.exports = mongoose.model('Herb', HerbSchema);
