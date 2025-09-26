// src/services/herb.service.js
const Herb = require('../models/herb.model');
const { getContract } = require('../../fabric/fabricClient');
const ApiError = require('../utils/ApiError');

class HerbService {

    static async createHerb(herbData) {
        console.log('Creating herb with species rules in MongoDB...', herbData);

        try {
            // Validate required species rules for supply chain herbs
            if (herbData.speciesRules) {
                this.validateSpeciesRules(herbData.speciesRules);
            }

            const herbRecord = new Herb({
                id: herbData.id,
                name: herbData.name,
                scientificName: herbData.scientificName,
                commonNames: herbData.commonNames || [],
                category: herbData.category,
                parts: herbData.parts,
                speciesRules: herbData.speciesRules || null,
                regulatoryInfo: herbData.regulatoryInfo || {},
                cultivationInfo: herbData.cultivationInfo || {}
            });

            const savedHerb = await herbRecord.save();
            console.log('✅ Herb with species rules created successfully:', savedHerb.id);

            // Create species rules in blockchain if provided
            if (savedHerb.speciesRules) {
                await this.createBlockchainSpeciesRules(savedHerb);
            }

            return savedHerb.toJSON();

        } catch (error) {
            console.error('❌ Failed to create herb record:', error);

            if (error.code === 11000) {
                throw new ApiError(400, `Herb with ID ${herbData.id} already exists`);
            }
            throw new ApiError(500, 'Failed to create herb record');
        }
    }

    static async getHerbById(herbId) {
        console.log('Getting herb record from MongoDB:', herbId);

        try {
            const herb = await Herb.findOne({ id: herbId });

            if (!herb) {
                throw new ApiError(404, `Herb with ID ${herbId} not found`);
            }

            console.log('✅ Herb record retrieved from MongoDB');
            return herb.toJSON();

        } catch (error) {
            console.error('❌ Failed to get herb record from MongoDB:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to retrieve herb record');
        }
    }

    static async getAllHerbs(filter = {}, options = {}) {
        console.log('Getting all herbs from MongoDB with filter:', filter);

        try {
            const query = {};

            // Filter by custom id field
            if (filter.id) {
                query.id = { $regex: filter.id, $options: 'i' };
            }

            if (filter.name) {
                query.name = { $regex: filter.name, $options: 'i' };
            }

            if (filter.scientificName) {
                query.scientificName = { $regex: filter.scientificName, $options: 'i' };
            }

            if (filter.category) {
                query.category = filter.category;
            }

            // Filter by species rules existence
            if (filter.hasSpeciesRules !== undefined) {
                query.speciesRules = filter.hasSpeciesRules ? { $exists: true, $ne: null } : { $exists: false };
            }

            // Pagination options
            const sortBy = options.sortBy || 'name';

            const results = await Herb.paginate(query, {
                sort: { [sortBy]: 1 },
                select: 'herbId name scientificName commonNames category parts speciesRules regulatoryInfo cultivationInfo'
            });

            console.log('✅ Herbs retrieved from MongoDB:', results.totalResults);
            return results;

        } catch (error) {
            console.error('❌ Failed to get herbs from MongoDB:', error);
            throw new ApiError(500, 'Failed to retrieve herbs from database');
        }
    }

    static async updateHerb(herbId, updateData) {
        console.log('Updating herb record in MongoDB:', herbId, updateData);

        try {
            // Validate species rules if being updated
            if (updateData.speciesRules) {
                this.validateSpeciesRules(updateData.speciesRules);
            }

            const updatedHerb = await Herb.findOneAndUpdate(
                { id: herbId },
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedHerb) {
                throw new ApiError(404, `Herb with ID ${herbId} not found`);
            }

            // Update blockchain species rules if changed
            if (updateData.speciesRules) {
                await this.updateBlockchainSpeciesRules(updatedHerb);
            }

            console.log('✅ Herb record updated in MongoDB');
            return updatedHerb.toJSON();

        } catch (error) {
            console.error('❌ Failed to update herb record in MongoDB:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to update herb record');
        }
    }

    static async deleteHerb(herbId) {
        console.log('Deleting herb record from MongoDB:', herbId);

        try {
            const deletedHerb = await Herb.findOneAndDelete({ id: herbId });

            if (!deletedHerb) {
                throw new ApiError(404, `Herb with ID ${herbId} not found`);
            }

            console.log('✅ Herb record deleted from MongoDB');
            return {
                message: 'Herb record deleted successfully',
                id: herbId,
                deletedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Failed to delete herb record from MongoDB:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to delete herb record');
        }
    }

    // NEW: Species Rules Management
    static async updateSpeciesRules(herbId, speciesRulesData) {
        console.log('Updating species rules for herb:', herbId);

        try {
            this.validateSpeciesRules(speciesRulesData);

            const updatedHerb = await Herb.findOneAndUpdate(
                { id: herbId },
                {
                    speciesRules: speciesRulesData,
                    'regulatoryInfo.lastUpdated': new Date()
                },
                { new: true, runValidators: true }
            );

            if (!updatedHerb) {
                throw new ApiError(404, `Herb with ID ${herbId} not found`);
            }

            // Update blockchain
            await this.updateBlockchainSpeciesRules(updatedHerb);

            console.log('✅ Species rules updated successfully');
            return updatedHerb.toJSON();

        } catch (error) {
            console.error('❌ Failed to update species rules:', error);
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to update species rules');
        }
    }

    static async getSpeciesRules(herbId) {
        try {
            const herb = await Herb.findOne({ id: herbId }, 'id name speciesRules');

            if (!herb) {
                throw new ApiError(404, `Herb with ID ${herbId} not found`);
            }

            if (!herb.speciesRules) {
                throw new ApiError(404, `No species rules found for herb ${herbId}`);
            }

            return {
                herbId: herb.id,
                herbName: herb.name,
                speciesRules: herb.speciesRules
            };

        } catch (error) {
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to retrieve species rules');
        }
    }

    // NEW: Validation Methods
    static async validateLocationForCollection(herbId, latitude, longitude) {
        try {
            const herb = await Herb.findOne({ id: herbId });

            if (!herb) {
                throw new ApiError(404, `Herb with ID ${herbId} not found`);
            }

            if (!herb.speciesRules?.geofence) {
                return { valid: true, message: 'No geofence rules defined' };
            }

            const isValid = herb.validateGeofence(latitude, longitude);

            return {
                valid: isValid,
                message: isValid ? 'Location is within allowed geofence' : 'Location is outside allowed geofence',
                geofence: herb.speciesRules.geofence
            };

        } catch (error) {
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to validate location');
        }
    }

    static async validateHarvestSeason(herbId, month = null) {
        try {
            const currentMonth = month || new Date().getMonth() + 1;
            const herb = await Herb.findOne({ id: herbId });

            if (!herb) {
                throw new ApiError(404, `Herb with ID ${herbId} not found`);
            }

            if (!herb.speciesRules?.allowedMonths?.length) {
                return { valid: true, message: 'No seasonal restrictions defined' };
            }

            const isValid = herb.validateHarvestMonth(currentMonth);

            return {
                valid: isValid,
                message: isValid ? 'Harvest allowed in current month' : `Harvest not allowed in month ${currentMonth}`,
                allowedMonths: herb.speciesRules.allowedMonths,
                currentMonth
            };

        } catch (error) {
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to validate harvest season');
        }
    }

    static async validateQualityParameters(herbId, qualityData) {
        try {
            const herb = await Herb.findOne({ id: herbId });

            if (!herb) {
                throw new ApiError(404, `Herb with ID ${herbId} not found`);
            }

            if (!herb.speciesRules?.qualityThresholds) {
                return { valid: true, message: 'No quality thresholds defined' };
            }

            const validation = herb.validateQuality(qualityData);

            return {
                valid: validation.valid,
                message: validation.valid ? 'Quality parameters within acceptable limits' : 'Quality validation failed',
                errors: validation.errors || [],
                thresholds: herb.speciesRules.qualityThresholds
            };

        } catch (error) {
            if (error.statusCode) throw error;
            throw new ApiError(500, 'Failed to validate quality parameters');
        }
    }

    // Blockchain Integration Methods
    static async createBlockchainSpeciesRules(herb) {
        setImmediate(async () => {
            try {
                console.log(`🔗 Creating blockchain species rules for: ${herb.name}`);

                const { contract, gateway } = await getContract('admin');

                const speciesData = {
                    species: herb.id,
                    geofence: herb.speciesRules.geofence,
                    allowedMonths: herb.speciesRules.allowedMonths,
                    qualityThresholds: herb.speciesRules.qualityThresholds
                };

                await contract.submitTransaction(
                    'SetSpeciesRules',
                    herb.id,
                    JSON.stringify(speciesData)
                );

                await gateway.disconnect();
                console.log(`✅ Blockchain species rules created for: ${herb.name}`);

            } catch (error) {
                console.error(`❌ Failed to create blockchain species rules:`, error.message);
            }
        });
    }

    static async updateBlockchainSpeciesRules(herb) {
        setImmediate(async () => {
            try {
                console.log(`🔗 Updating blockchain species rules for: ${herb.name}`);

                const { contract, gateway } = await getContract('admin');

                const speciesData = {
                    species: herb.id,
                    geofence: herb.speciesRules.geofence,
                    allowedMonths: herb.speciesRules.allowedMonths,
                    qualityThresholds: herb.speciesRules.qualityThresholds,
                    lastUpdated: new Date().toISOString()
                };

                await contract.submitTransaction(
                    'SetSpeciesRules',
                    herb.id,
                    JSON.stringify(speciesData)
                );

                await gateway.disconnect();
                console.log(`✅ Blockchain species rules updated for: ${herb.name}`);

            } catch (error) {
                console.error(`❌ Failed to update blockchain species rules:`, error.message);
            }
        });
    }

    static async getBlockchainSpeciesRules(herbId) {
        try {
            const { contract, gateway } = await getContract('admin');

            const result = await contract.evaluateTransaction('GetSpeciesRules', herbId);
            const speciesRules = JSON.parse(result.toString());

            await gateway.disconnect();
            return {
                status: 'SUCCESS',
                data: speciesRules
            };

        } catch (error) {
            return {
                status: 'ERROR',
                message: `Failed to get blockchain species rules: ${error.message}`
            };
        }
    }

    // Utility Methods
    static validateSpeciesRules(speciesRules) {
        if (!speciesRules) return;

        // Validate geofence
        if (speciesRules.geofence) {
            const { center, radiusMeters } = speciesRules.geofence;
            if (!center?.latitude || !center?.longitude || !radiusMeters) {
                throw new ApiError(400, 'Invalid geofence data: center coordinates and radius are required');
            }
        }

        // Validate allowed months
        if (speciesRules.allowedMonths) {
            const invalidMonths = speciesRules.allowedMonths.filter(month => month < 1 || month > 12);
            if (invalidMonths.length > 0) {
                throw new ApiError(400, 'Invalid months in allowedMonths: must be between 1 and 12');
            }
        }

        // Validate quality thresholds
        if (speciesRules.qualityThresholds) {
            const { moistureMax, pesticidePPMMax } = speciesRules.qualityThresholds;
            if (moistureMax && (moistureMax < 0 || moistureMax > 100)) {
                throw new ApiError(400, 'Invalid moistureMax: must be between 0 and 100');
            }
            if (pesticidePPMMax && pesticidePPMMax < 0) {
                throw new ApiError(400, 'Invalid pesticidePPMMax: must be non-negative');
            }
        }
    }

    // Keep existing blockchain methods for backward compatibility
    static async checkBlockchainStatus() {
        try {
            const { contract, gateway } = await getContract('admin');
            const result = await contract.evaluateTransaction('QueryParticipants', 'farmer');
            await gateway.disconnect();

            return {
                status: 'CONNECTED',
                message: 'Blockchain is available',
                sampleData: JSON.parse(result).length + ' farmers found'
            };
        } catch (error) {
            return {
                status: 'DISCONNECTED',
                message: `Blockchain unavailable: ${error.message.substring(0, 100)}`
            };
        }
    }

    static async getBlockchainData(dataType = 'participants') {
        try {
            const { contract, gateway } = await getContract('admin');

            let result;
            switch (dataType) {
                case 'farmers':
                    result = await contract.evaluateTransaction('QueryParticipants', 'farmer');
                    break;
                case 'processors':
                    result = await contract.evaluateTransaction('QueryParticipants', 'processor');
                    break;
                case 'labs':
                    result = await contract.evaluateTransaction('QueryParticipants', 'lab');
                    break;
                case 'manufacturers':
                    result = await contract.evaluateTransaction('QueryParticipants', 'manufacturer');
                    break;
                case 'batches':
                    result = await contract.evaluateTransaction('QueryAllHerbBatches');
                    break;
                case 'species':
                    result = await contract.evaluateTransaction('QueryByPrefix', 'SPECIES_RULES_');
                    break;
                default:
                    result = await contract.evaluateTransaction('QueryParticipants', 'farmer');
            }

            await gateway.disconnect();

            return {
                status: 'SUCCESS',
                dataType: dataType,
                data: JSON.parse(result.toString())
            };
        } catch (error) {
            return {
                status: 'ERROR',
                message: `Failed to get ${dataType}: ${error.message}`
            };
        }
    }
}

module.exports = HerbService;
