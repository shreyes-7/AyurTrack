const { Herb } = require('../models');
const FabricService = require('./fabric.service');

class HerbService {

    static async createHerb(data) {
        const herb = new Herb(data);
        await herb.save(); // MongoDB

        // Sync with blockchain
        await FabricService.submitTransaction('CreateHerb', [
            herb.id,
            herb.name,
            herb.source,
            herb.quantity.toString(),
            herb.owner,
            herb.manufactureDate.toISOString(),
            herb.expiryDate.toISOString()
        ]);

        return herb;
    }

    static async getHerbById(id) {
        const herb = await Herb.findOne({ id });
        if (!herb) throw new Error(`Herb ${id} not found`);

        // Optionally fetch blockchain data
        // const blockchainData = await FabricService.evaluateTransaction('ReadHerb', [id]);
        // return { ...herb.toObject(), blockchainData: JSON.parse(blockchainData) };

        return herb;
    }

    static async updateHerb(id, data) {
        const herb = await Herb.findOneAndUpdate({ id }, data, { new: true });
        if (!herb) throw new Error(`Herb ${id} not found`);

        // Sync blockchain
        await FabricService.submitTransaction('UpdateHerb', [
            herb.id,
            herb.name,
            herb.source,
            herb.quantity.toString(),
            herb.owner,
            herb.manufactureDate.toISOString(),
            herb.expiryDate.toISOString()
        ]);

        return herb;
    }

    static async deleteHerb(id) {
        const herb = await Herb.findOneAndDelete({ id });
        if (!herb) throw new Error(`Herb ${id} not found`);

        await FabricService.submitTransaction('DeleteHerb', [id]);
        return herb;
    }

    static async transferHerb(id, newOwner) {
        const herb = await Herb.findOne({ id });
        if (!herb) throw new Error(`Herb ${id} not found`);

        herb.owner = newOwner;
        await herb.save();

        await FabricService.submitTransaction('TransferHerb', [id, newOwner]);
        return herb;
    }

    static async getAllHerbs() {
        return await Herb.find({});
    }
}

module.exports = HerbService;
