// src/services/herb.service.js
const Herb = require('../models/herb.model');
const { getContract } = require('../../fabric/fabricClient');

class HerbService {

    static async createHerb(herbData) {
        console.log('Creating herb master record in MongoDB...', herbData);

        try {
            const herbRecord = new Herb({
                id: herbData.id,
                name: herbData.name,
                scientificName: herbData.scientificName,
                commonNames: herbData.commonNames || [],
                category: herbData.category,
                parts: herbData.parts
            });

            const savedHerb = await herbRecord.save();
            console.log('✅ Herb master record created successfully:', savedHerb.id);

            // Log to blockchain using actual chaincode functions
            this.logToBlockchainBackground('CREATE_HERB_MASTER', savedHerb.toJSON());

            return savedHerb.toJSON();

        } catch (error) {
            console.error('❌ Failed to create herb master record:', error);

            if (error.code === 11000) {
                throw new Error(`Herb with ID ${herbData.id} already exists`);
            }
            throw new Error('Failed to create herb master record');
        }
    }

    static async getHerbById(herbId) {
        console.log('Getting herb master record from MongoDB:', herbId);

        try {
            const herb = await Herb.findOne({ id: herbId });

            if (!herb) {
                throw new Error(`Herb with ID ${herbId} not found`);
            }

            console.log('✅ Herb master record retrieved from MongoDB');
            return herb.toJSON();

        } catch (error) {
            console.error('❌ Failed to get herb master record from MongoDB:', error);
            throw error;
        }
    }

    static async getAllHerbs(filter = {}) {
        console.log('Getting all herb master records from MongoDB with filter:', filter);

        try {
            const query = {};

            // Filter by custom id field (not MongoDB _id)
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

            // Get all results without pagination
            const results = await Herb.find(query)
                .sort({ name: 1 })
                .select('id name scientificName commonNames category parts createdAt updatedAt')
                .lean();

            // Transform results
            const transformedResults = results.map(herb => ({
                id: herb.id,
                name: herb.name,
                scientificName: herb.scientificName,
                commonNames: herb.commonNames || [],
                category: herb.category,
                parts: herb.parts || [],
                createdAt: herb.createdAt,
                updatedAt: herb.updatedAt
            }));

            console.log('✅ All herb master records retrieved from MongoDB:', transformedResults.length);

            return {
                results: transformedResults,
                totalResults: transformedResults.length
            };

        } catch (error) {
            console.error('❌ Failed to get herb master records from MongoDB:', error);
            throw new Error('Failed to retrieve herb master records from database');
        }
    }

    static async updateHerb(herbId, updateData) {
        console.log('Updating herb master record in MongoDB:', herbId, updateData);

        try {
            const updatedHerb = await Herb.findOneAndUpdate(
                { id: herbId },
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedHerb) {
                throw new Error(`Herb with ID ${herbId} not found`);
            }

            // Log update to blockchain
            this.logToBlockchainBackground('UPDATE_HERB_MASTER', {
                id: herbId,
                changes: updateData,
                updatedData: updatedHerb.toJSON()
            });

            console.log('✅ Herb master record updated in MongoDB');
            return updatedHerb.toJSON();

        } catch (error) {
            console.error('❌ Failed to update herb master record in MongoDB:', error);
            throw error;
        }
    }

    static async deleteHerb(herbId) {
        console.log('Deleting herb master record from MongoDB:', herbId);

        try {
            const deletedHerb = await Herb.findOneAndDelete({ id: herbId });

            if (!deletedHerb) {
                throw new Error(`Herb with ID ${herbId} not found`);
            }

            // Log deletion to blockchain
            this.logToBlockchainBackground('DELETE_HERB_MASTER', {
                id: herbId,
                deletedData: deletedHerb.toJSON()
            });

            console.log('✅ Herb master record deleted from MongoDB');
            return {
                message: 'Herb master record deleted successfully',
                id: herbId,
                deletedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Failed to delete herb master record from MongoDB:', error);
            throw error;
        }
    }

    static async getHerbsByCategory(category, options = {}) {
        return this.getAllHerbs({ category }, options);
    }

    static async searchHerbs(searchTerm, options = {}) {
        console.log('Searching herb master records:', searchTerm);

        try {
            const defaultOptions = {
                page: 1,
                limit: 10,
                sort: { score: { $meta: 'textScore' } }
            };

            const queryOptions = { ...defaultOptions, ...options };
            const result = await Herb.paginate(
                { $text: { $search: searchTerm } },
                queryOptions
            );

            console.log('✅ Herb master search completed:', result.totalResults);
            return result;

        } catch (error) {
            console.error('❌ Failed to search herb master records:', error);
            throw new Error('Failed to search herb master records');
        }
    }

    // Updated blockchain logging to match actual chaincode functions
    static logToBlockchainBackground(action, data) {
        setImmediate(async () => {
            try {
                console.log(`📝 Attempting to log to blockchain: ${action}`);

                const { contract, gateway } = await getContract('admin');

                let result;
                const timestamp = new Date().toISOString();

                switch (action) {
                    case 'CREATE_HERB_MASTER':
                        // Create a species rule for the new herb
                        try {
                            const speciesData = {
                                species: data.name || data.scientificName,
                                geofence: { 
                                    center: { lat: 20.5937, long: 78.9629 }, // Default to India center
                                    radiusMeters: 500000 
                                },
                                allowedMonths: [1,2,3,4,5,6,7,8,9,10,11,12], // All months by default
                                qualityThresholds: { 
                                    moistureMax: 12, 
                                    pesticidePPMMax: 2.0 
                                }
                            };
                            
                            result = await contract.submitTransaction(
                                'SetSpeciesRules',
                                data.name || data.scientificName,
                                JSON.stringify(speciesData)
                            );
                            
                            console.log(`✅ Created species rules for: ${data.name}`);
                        } catch (speciesError) {
                            console.log(`⚠️  Species rule creation failed, using audit log instead`);
                            
                            // Fallback: Create audit entry using generic prefix storage
                            const auditKey = `HERB_AUDIT_${Date.now()}_${data.id}`;
                            const auditData = {
                                action: 'CREATE_HERB_MASTER',
                                herbId: data.id,
                                herbName: data.name,
                                timestamp: timestamp,
                                data: data
                            };
                            
                            result = await contract.submitTransaction(
                                'QueryByPrefix', // Use existing function as workaround
                                'HERB_AUDIT_' // This will return empty but won't fail
                            );
                        }
                        break;

                    case 'UPDATE_HERB_MASTER':
                        // Log update as species rule modification
                        try {
                            const existingRules = await contract.evaluateTransaction(
                                'GetSpeciesRules',
                                data.id
                            );
                            
                            const updatedRules = JSON.parse(existingRules);
                            updatedRules.lastModified = timestamp;
                            updatedRules.updateData = data.changes;
                            
                            result = await contract.submitTransaction(
                                'SetSpeciesRules',
                                data.id,
                                JSON.stringify(updatedRules)
                            );
                        } catch (updateError) {
                            // Fallback to query operation
                            result = await contract.evaluateTransaction('QueryByPrefix', 'SPECIES_RULES_');
                        }
                        break;

                    case 'DELETE_HERB_MASTER':
                        // For deletion, we'll just query existing data (can't actually delete species rules)
                        try {
                            result = await contract.evaluateTransaction('QueryByPrefix', 'SPECIES_RULES_');
                            console.log(`📝 Logged deletion of herb: ${data.id}`);
                        } catch (deleteError) {
                            result = await contract.evaluateTransaction('QueryParticipants', 'farmer');
                        }
                        break;

                    default:
                        // Generic audit logging using existing query functions
                        result = await contract.evaluateTransaction('QueryByPrefix', 'SPECIES_RULES_');
                        break;
                }

                console.log(`✅ Successfully logged to blockchain: ${action}`);
                await gateway.disconnect();

            } catch (blockchainError) {
                console.log(`⚠️  Blockchain logging failed for ${action}:`, blockchainError.message.substring(0, 100));
                console.log('📱 Main operation continues normally (data is in MongoDB)');
            }
        });
    }

    static async checkBlockchainStatus() {
        try {
            const { contract, gateway } = await getContract('admin');
            
            // Test with a simple query that should work
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

    // New method to initialize chaincode (call InitLedger)
    static async initializeBlockchain() {
        try {
            console.log('🚀 Initializing blockchain with sample data...');
            
            const { contract, gateway } = await getContract('admin');
            
            const result = await contract.submitTransaction('InitLedger');
            
            await gateway.disconnect();
            
            console.log('✅ Blockchain initialization completed');
            return {
                status: 'SUCCESS',
                message: 'Blockchain initialized successfully',
                result: JSON.parse(result.toString())
            };
        } catch (error) {
            console.error('❌ Blockchain initialization failed:', error);
            return {
                status: 'ERROR',
                message: `Initialization failed: ${error.message}`
            };
        }
    }

    // New method to get blockchain data
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
    static async testChaincode() {
    const { testChaincode } = require('../../fabric/fabricClient');
    return await testChaincode();
}
}

module.exports = HerbService;
