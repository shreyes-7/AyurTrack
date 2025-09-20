'use strict';

const { Contract } = require('fabric-contract-api');

class HerbalTraceContract extends Contract {

    async initLedger(ctx) {
        console.log('Ledger initialized');
    }

    // Collection Event
    async recordCollection(ctx, herbId, farmerId, lat, long, species, quality) {
        const collection = { herbId, farmerId, lat, long, species, quality, timestamp: new Date().toISOString() };
        await ctx.stub.putState(herbId, Buffer.from(JSON.stringify(collection)));
        return JSON.stringify(collection);
    }

    // Query Event
    async queryHerb(ctx, herbId) {
        const data = await ctx.stub.getState(herbId);
        if (!data || data.length === 0) {
            throw new Error(`${herbId} does not exist`);
        }
        return data.toString();
    }
}

module.exports = HerbalTraceContract;
