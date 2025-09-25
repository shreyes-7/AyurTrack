// src/services/sms.service.js
const BatchService = require('./batch.service');
const { User, Herb } = require('../models');
const ApiError = require('../utils/ApiError');

class SmsService {

    static async createCollectionFromSMS(userId, herbId, quantityInGrams) {
        console.log('Creating collection from SMS:', { userId, herbId, quantityInGrams });

        try {
            // Validate and get user
            const user = await User.findOne({
                $or: [
                    { blockchainUserId: userId },
                    { _id: userId },
                    { id: userId }
                ]
            });

            if (!user) {
                throw new ApiError(404, `User with ID ${userId} not found`);
            }

            if (user.participantType !== 'farmer') {
                throw new ApiError(400, 'Only farmers can create collections via SMS');
            }

            if (!user.isBlockchainEnrolled) {
                throw new ApiError(400, 'User must be blockchain enrolled to create collections');
            }

            // Validate and get herb
            const herb = await Herb.findOne({
                $or: [
                    { id: herbId },
                    { name: { $regex: herbId, $options: 'i' } },
                    { _id: herbId }
                ]
            });

            if (!herb) {
                throw new ApiError(404, `Herb with ID ${herbId} not found`);
            }

            // Convert grams to kg and validate quantity
            const quantityInKg = parseFloat(quantityInGrams) / 1000;

            if (quantityInKg <= 0 || quantityInKg > 1000) {
                throw new ApiError(400, 'Quantity must be between 1 gram and 1000 kg');
            }

            // Use user's registered location
            if (!user.location?.latitude || !user.location?.longitude) {
                throw new ApiError(400, 'User must have registered location for SMS collections');
            }

            // Validate location against herb geofence if rules exist
            if (herb.speciesRules?.geofence) {
                const locationValid = herb.validateGeofence(user.location.latitude, user.location.longitude);
                if (!locationValid) {
                    throw new ApiError(400, `Collection location is outside allowed geofence for ${herb.name}`);
                }
            }

            // Validate harvest season
            const currentMonth = new Date().getMonth() + 1;
            if (herb.speciesRules?.allowedMonths?.length) {
                const seasonValid = herb.validateHarvestMonth(currentMonth);
                if (!seasonValid) {
                    throw new ApiError(400, `Harvesting ${herb.name} is not allowed in month ${currentMonth}`);
                }
            }

            // Create collection data with default quality parameters
            const collectionData = {
                species: herb.id,
                quantity: quantityInKg,
                latitude: user.location.latitude,
                longitude: user.location.longitude,
                quality: {
                    moisture: 10.0, // Default safe moisture level
                    pesticidePPM: 0.5 // Default low pesticide level
                }
            };

            // Use existing BatchService to create collection and batch
            const result = await BatchService.createHerbBatch(collectionData, user);

            console.log('✅ Collection created from SMS successfully');

            return {
                success: true,
                batchId: result.batchId,
                collectionId: result.collectionId,
                batch: result.batch,
                collection: result.collection,
                collector: result.collector,
                metadata: {
                    method: 'SMS',
                    processedAt: new Date().toISOString(),
                    quantityConverted: `${quantityInGrams}g → ${quantityInKg}kg`,
                    location: user.location.address || 'Registered farm location'
                }
            };

        } catch (error) {
            console.error('❌ Failed to create collection from SMS:', error);
            throw error;
        }
    }
}

module.exports = SmsService;
