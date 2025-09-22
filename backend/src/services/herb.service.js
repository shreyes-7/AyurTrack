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

            // Log to blockchain for herb master registry
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

    // Background blockchain logging
    static logToBlockchainBackground(action, data) {
        setImmediate(async () => {
            try {
                console.log(`📝 Attempting to log to blockchain: ${action}`);

                const { contract, gateway } = await getContract('admin');

                const auditEntry = {
                    action: action,
                    herbId: data.id || 'UNKNOWN',
                    data: JSON.stringify(data),
                    timestamp: new Date().toISOString(),
                    user: 'system'
                };

                let result;
                if (action === 'CREATE_HERB_MASTER' && data.id) {
                    result = await contract.submitTransaction(
                        'CreateHerb',
                        data.id,
                        data.name || '',
                        data.scientificName || '',
                        data.category || 'MEDICINAL',
                        JSON.stringify(data.parts || []),
                        JSON.stringify(data.commonNames || [])
                    );
                } else {
                    result = await contract.submitTransaction(
                        'RecordAuditEntry',
                        JSON.stringify(auditEntry)
                    );
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
            await contract.evaluateTransaction('GetAllHerbs');
            await gateway.disconnect();
            return { status: 'CONNECTED', message: 'Blockchain is available' };
        } catch (error) {
            return {
                status: 'DISCONNECTED',
                message: `Blockchain unavailable: ${error.message.substring(0, 100)}`
            };
        }
    }
}

module.exports = HerbService;
