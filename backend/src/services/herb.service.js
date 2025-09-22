// src/services/herb.service.js
const Herb = require('../models/herb.model');
const { getContract } = require('../../fabric/fabricClient');

class HerbService {

    static async createHerb(herbData) {
        console.log('Creating herb in MongoDB...', herbData);

        try {
            // Create herb record for MongoDB
            const herbRecord = new Herb({
                id: herbData.id,
                name: herbData.name,
                source: herbData.source,
                quantity: herbData.quantity,
                owner: herbData.owner,
                manufactureDate: new Date(herbData.manufactureDate),
                expiryDate: new Date(herbData.expiryDate),
                docType: 'herb',
                status: 'ACTIVE',
                blockchainStatus: 'PENDING'
            });

            // Save to MongoDB
            const savedHerb = await herbRecord.save();
            console.log('✅ Herb created successfully in MongoDB:', savedHerb.id);

            // Try to log to blockchain in background (don't fail if blockchain fails)
            this.logToBlockchainBackground('CREATE', savedHerb.toJSON());

            return savedHerb.toJSON();

        } catch (error) {
            console.error('❌ Failed to create herb in MongoDB:', error);

            if (error.code === 11000) {
                throw new Error(`Herb with ID ${herbData.id} already exists`);
            }
            throw new Error('Failed to create herb in database');
        }
    }

    static async getHerbById(herbId) {
        console.log('Getting herb from MongoDB:', herbId);

        try {
            const herb = await Herb.findOne({ id: herbId });

            if (!herb) {
                throw new Error(`Herb with ID ${herbId} not found`);
            }

            console.log('✅ Herb retrieved from MongoDB');
            return herb.toJSON();

        } catch (error) {
            console.error('❌ Failed to get herb from MongoDB:', error);
            throw error;
        }
    }

    static async getAllHerbs(filter = {}, options = {}) {
        console.log('Getting all herbs from MongoDB with filter:', filter);

        try {
            // Build query
            const query = {};

            if (filter.owner) {
                query.owner = { $regex: filter.owner, $options: 'i' };
            }

            if (filter.name) {
                query.name = { $regex: filter.name, $options: 'i' };
            }

            if (filter.status) {
                query.status = filter.status;
            }

            // Set default pagination options
            const defaultOptions = {
                page: 1,
                limit: 10,
                sort: { createdAt: -1 }
            };

            const queryOptions = { ...defaultOptions, ...options };

            const result = await Herb.paginate(query, queryOptions);

            console.log('✅ All herbs retrieved from MongoDB:', result.totalResults);
            return result;

        } catch (error) {
            console.error('❌ Failed to get herbs from MongoDB:', error);
            throw new Error('Failed to retrieve herbs from database');
        }
    }

    static async updateHerb(herbId, updateData) {
        console.log('Updating herb in MongoDB:', herbId, updateData);

        try {
            // Find and update herb
            const updatedHerb = await Herb.findOneAndUpdate(
                { id: herbId },
                {
                    ...updateData,
                    blockchainStatus: 'PENDING' // Reset blockchain status on update
                },
                { new: true, runValidators: true }
            );

            if (!updatedHerb) {
                throw new Error(`Herb with ID ${herbId} not found`);
            }

            // Log update to blockchain in background
            this.logToBlockchainBackground('UPDATE', {
                id: herbId,
                changes: updateData,
                updatedData: updatedHerb.toJSON()
            });

            console.log('✅ Herb updated in MongoDB');
            return updatedHerb.toJSON();

        } catch (error) {
            console.error('❌ Failed to update herb in MongoDB:', error);
            throw error;
        }
    }

    static async deleteHerb(herbId) {
        console.log('Deleting herb from MongoDB:', herbId);

        try {
            const deletedHerb = await Herb.findOneAndDelete({ id: herbId });

            if (!deletedHerb) {
                throw new Error(`Herb with ID ${herbId} not found`);
            }

            // Log deletion to blockchain in background
            this.logToBlockchainBackground('DELETE', {
                id: herbId,
                deletedData: deletedHerb.toJSON()
            });

            console.log('✅ Herb deleted from MongoDB');
            return {
                message: 'Herb deleted successfully',
                id: herbId,
                deletedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Failed to delete herb from MongoDB:', error);
            throw error;
        }
    }

    static async transferHerb(herbId, newOwner) {
        console.log('Transferring herb ownership:', herbId, 'to', newOwner);

        try {
            const herb = await Herb.findOne({ id: herbId });

            if (!herb) {
                throw new Error(`Herb with ID ${herbId} not found`);
            }

            const previousOwner = herb.owner;

            // Update ownership and add to transfer history
            const updatedHerb = await Herb.findOneAndUpdate(
                { id: herbId },
                {
                    owner: newOwner,
                    blockchainStatus: 'PENDING',
                    $push: {
                        transferHistory: {
                            previousOwner,
                            newOwner,
                            transferredAt: new Date()
                        }
                    }
                },
                { new: true }
            );

            const transferRecord = {
                id: herbId,
                name: updatedHerb.name,
                previousOwner,
                newOwner,
                transferredAt: new Date().toISOString()
            };

            // Log transfer to blockchain in background
            this.logToBlockchainBackground('TRANSFER', transferRecord);

            console.log('✅ Herb ownership transferred in MongoDB');
            return transferRecord;

        } catch (error) {
            console.error('❌ Failed to transfer herb ownership:', error);
            throw error;
        }
    }

    // Get herbs by owner
    static async getHerbsByOwner(owner, options = {}) {
        return this.getAllHerbs({ owner }, options);
    }

    // Get herbs by status
    static async getHerbsByStatus(status, options = {}) {
        return this.getAllHerbs({ status }, options);
    }

    // Update blockchain status (for when blockchain operations complete)
    static async updateBlockchainStatus(herbId, status, txId = null) {
        try {
            const updateData = { blockchainStatus: status };
            if (txId) {
                updateData.blockchainTxId = txId;
            }

            await Herb.findOneAndUpdate({ id: herbId }, updateData);
            console.log(`✅ Updated blockchain status for ${herbId}: ${status}`);
        } catch (error) {
            console.error('❌ Failed to update blockchain status:', error);
        }
    }

    // Background blockchain logging (doesn't affect main operation)
    static logToBlockchainBackground(action, data) {
        // Run blockchain logging asynchronously without blocking main operation
        setImmediate(async () => {
            try {
                console.log(`📝 Attempting to log to blockchain: ${action}`);

                const { contract, gateway } = await getContract('admin'); // Use admin for better permissions

                // Create a simple audit log entry
                const auditEntry = {
                    action: action,
                    herbId: data.id || 'UNKNOWN',
                    data: JSON.stringify(data),
                    timestamp: new Date().toISOString(),
                    user: 'system'
                };

                // Try different blockchain operations based on action
                let result;
                if (action === 'CREATE' && data.id) {
                    // Try to create herb in blockchain
                    result = await contract.submitTransaction(
                        'CreateHerb',
                        data.id,
                        data.name || '',
                        data.source || '',
                        (data.quantity || 0).toString(),
                        data.owner || '',
                        data.manufactureDate || '',
                        data.expiryDate || ''
                    );
                } else {
                    // For other operations, just log as audit entry
                    result = await contract.submitTransaction(
                        'RecordAuditEntry',
                        JSON.stringify(auditEntry)
                    );
                }

                console.log(`✅ Successfully logged to blockchain: ${action}`);

                // Update blockchain status in MongoDB
                if (data.id) {
                    await this.updateBlockchainStatus(data.id, 'LOGGED', 'blockchain-tx-' + Date.now());
                }

                await gateway.disconnect();

            } catch (blockchainError) {
                console.log(`⚠️  Blockchain logging failed for ${action}:`, blockchainError.message.substring(0, 100));
                console.log('📱 Main operation continues normally (data is in MongoDB)');

                // Update blockchain status to failed
                if (data.id) {
                    await this.updateBlockchainStatus(data.id, 'FAILED');
                }

                // Store failed blockchain logs for retry later
                this.storeFalledBlockchainLog(action, data, blockchainError.message);
            }
        });
    }

    static storeFalledBlockchainLog(action, data, error) {
        // Store failed blockchain logs for later retry
        console.log('📝 Storing failed blockchain log for later retry:', {
            action,
            herbId: data.id,
            error: error.substring(0, 200),
            timestamp: new Date().toISOString()
        });

        // You could store this in a separate MongoDB collection for retry queue
        // For now, just log it
    }

    // Method to retry failed blockchain logs
    static async retryBlockchainLogs() {
        console.log('🔄 Retrying failed blockchain logs...');

        try {
            // Find herbs with failed blockchain status
            const failedHerbs = await Herb.find({ blockchainStatus: 'FAILED' }).limit(10);

            for (const herb of failedHerbs) {
                console.log(`Retrying blockchain log for herb: ${herb.id}`);
                this.logToBlockchainBackground('RETRY_CREATE', herb.toJSON());

                // Add delay between retries
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`✅ Retry completed for ${failedHerbs.length} herbs`);
        } catch (error) {
            console.error('❌ Failed to retry blockchain logs:', error);
        }
    }

    // Check blockchain connection status
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
