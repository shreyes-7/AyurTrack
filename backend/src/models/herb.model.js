// herb.model.js (Enhanced with species rules integration)
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
    }],

    // ADDED: Species Rules (from blockchain requirements)
    speciesRules: {
        geofence: {
            center: {
                latitude: {
                    type: Number,
                    min: -90,
                    max: 90
                },
                longitude: {
                    type: Number,
                    min: -180,
                    max: 180
                }
            },
            radiusMeters: {
                type: Number,
                min: 1000
            }
        },
        allowedMonths: [{
            type: Number,
            min: 1,
            max: 12
        }],
        qualityThresholds: {
            moistureMax: {
                type: Number,
                min: 0,
                max: 100
            },
            pesticidePPMMax: {
                type: Number,
                min: 0
            },
            // Species-specific active compounds
            activeCompounds: {
                curcuminMin: Number,        // For Turmeric
                withanolidesMin: Number,    // For Ashwagandha
                [String]: Number            // Flexible for other compounds
            }
        }
    },

    // ADDED: Regulatory and compliance information
    regulatoryInfo: {
        authority: String,
        licenseRequired: {
            type: Boolean,
            default: false
        },
        certificationRequired: [String],
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },

    // ADDED: Growing and harvesting information
    cultivationInfo: {
        growingSeason: [String],        // e.g., ["WINTER", "SPRING"]
        harvestingMethod: String,       // e.g., "MANUAL", "MECHANICAL"
        dryingMethod: String,           // e.g., "SUN_DRYING", "SHADE_DRYING"
        storageRequirements: String
    }
}, {
    timestamps: true
});

HerbSchema.plugin(toJSON, {
    transform: (doc, ret) => {
        ret.id = ret.id;         // Keep custom id (HTURMERIC1234)
        ret.mongoId = ret._id;   // Keep MongoDB's _id as mongoId
        delete ret._id;          // Remove the original _id field
        delete ret.__v;          // Remove version key
        return ret;
    }
});

HerbSchema.plugin(paginate);

// Enhanced indexes
HerbSchema.index({ id: 1 });
HerbSchema.index({ name: 1 });
HerbSchema.index({ scientificName: 1 });
HerbSchema.index({ category: 1 });

// Geospatial index for species rules
HerbSchema.index({
    'speciesRules.geofence.center': '2dsphere'
});

// Text search index
HerbSchema.index({
    name: 'text',
    scientificName: 'text',
    commonNames: 'text'
});

// Helper methods for blockchain integration
HerbSchema.methods.validateGeofence = function (latitude, longitude) {
    if (!this.speciesRules?.geofence) return true;

    const center = this.speciesRules.geofence.center;
    const radius = this.speciesRules.geofence.radiusMeters;

    // Haversine distance calculation
    const toRad = (value) => value * Math.PI / 180;
    const R = 6371000; // Earth's radius in meters

    const dLat = toRad(latitude - center.latitude);
    const dLon = toRad(longitude - center.longitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(center.latitude)) * Math.cos(toRad(latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radius;
};

HerbSchema.methods.validateHarvestMonth = function (month) {
    if (!this.speciesRules?.allowedMonths?.length) return true;
    return this.speciesRules.allowedMonths.includes(month);
};

HerbSchema.methods.validateQuality = function (qualityData) {
    if (!this.speciesRules?.qualityThresholds) return true;

    const thresholds = this.speciesRules.qualityThresholds;
    const results = { valid: true, errors: [] };

    if (qualityData.moisture && thresholds.moistureMax) {
        if (qualityData.moisture > thresholds.moistureMax) {
            results.valid = false;
            results.errors.push(`Moisture ${qualityData.moisture}% exceeds maximum ${thresholds.moistureMax}%`);
        }
    }

    if (qualityData.pesticidePPM && thresholds.pesticidePPMMax) {
        if (qualityData.pesticidePPM > thresholds.pesticidePPMMax) {
            results.valid = false;
            results.errors.push(`Pesticide ${qualityData.pesticidePPM} PPM exceeds maximum ${thresholds.pesticidePPMMax} PPM`);
        }
    }

    return results;
};

module.exports = mongoose.model('Herb', HerbSchema);
