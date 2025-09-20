'use strict';

const { Contract } = require('fabric-contract-api');

class HerbalContract extends Contract {

    // Initialize the ledger with some sample herbs
    async InitLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const herbs = [
            {
                id: 'HERB1',
                name: 'Ashwagandha',
                source: 'India',
                quantity: 100,
                owner: 'Supplier1',
                manufactureDate: '2025-01-10',
                expiryDate: '2026-01-10'
            },
            {
                id: 'HERB2',
                name: 'Tulsi',
                source: 'India',
                quantity: 200,
                owner: 'Supplier2',
                manufactureDate: '2025-02-15',
                expiryDate: '2026-02-15'
            }
        ];

        for (let i = 0; i < herbs.length; i++) {
            herbs[i].docType = 'herb';
            await ctx.stub.putState(herbs[i].id, Buffer.from(JSON.stringify(herbs[i])));
            console.info('Added <--> ', herbs[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    // Create a new herb record
    async CreateHerb(ctx, id, name, source, quantity, owner, manufactureDate, expiryDate) {
        console.info('============= START : Create Herb ===========');

        const herb = {
            docType: 'herb',
            id,
            name,
            source,
            quantity: parseInt(quantity),
            owner,
            manufactureDate,
            expiryDate
        };

        const exists = await this.HerbExists(ctx, id);
        if (exists) {
            throw new Error(`The herb ${id} already exists`);
        }

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(herb)));
        console.info('============= END : Create Herb ===========');
    }

    // Read a herb by ID
    async ReadHerb(ctx, id) {
        const herbJSON = await ctx.stub.getState(id);
        if (!herbJSON || herbJSON.length === 0) {
            throw new Error(`The herb ${id} does not exist`);
        }
        return herbJSON.toString();
    }

    // Update a herb
    async UpdateHerb(ctx, id, name, source, quantity, owner, manufactureDate, expiryDate) {
        console.info('============= START : Update Herb ===========');

        const exists = await this.HerbExists(ctx, id);
        if (!exists) {
            throw new Error(`The herb ${id} does not exist`);
        }

        const updatedHerb = {
            docType: 'herb',
            id,
            name,
            source,
            quantity: parseInt(quantity),
            owner,
            manufactureDate,
            expiryDate
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedHerb)));
        console.info('============= END : Update Herb ===========');
    }

    // Delete a herb
    async DeleteHerb(ctx, id) {
        console.info('============= START : Delete Herb ===========');

        const exists = await this.HerbExists(ctx, id);
        if (!exists) {
            throw new Error(`The herb ${id} does not exist`);
        }
        await ctx.stub.deleteState(id);

        console.info('============= END : Delete Herb ===========');
    }

    // Check if a herb exists
    async HerbExists(ctx, id) {
        const herbJSON = await ctx.stub.getState(id);
        return herbJSON && herbJSON.length > 0;
    }

    // Get all herbs
    async GetAllHerbs(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();

        while (!result.done) {
            const strValue = result.value.value.toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    // Transfer ownership of a herb
    async TransferHerb(ctx, id, newOwner) {
        console.info('============= START : Transfer Herb ===========');

        const herbString = await this.ReadHerb(ctx, id);
        const herb = JSON.parse(herbString);

        herb.owner = newOwner;

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(herb)));

        console.info('============= END : Transfer Herb ===========');
    }
}

module.exports = HerbalContract;
