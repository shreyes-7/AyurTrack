'use strict';

const { Contract } = require('fabric-contract-api');

// Helper: Haversine distance
function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (v) => v * Math.PI / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

class HerbalTraceContract extends Contract {

    // Ledger initialization
    async InitLedger(ctx) {
        console.info('Initializing ledger...');

        const defaultRules = {
            species: 'Ashwagandha',
            geofence: { center: { lat: 26.9, long: 75.8 }, radiusMeters: 50000 },
            allowedMonths: [1,2,3,10,11,12],
            qualityThresholds: { moistureMax: 10, pesticidePPMMax: 2 }
        };
        await ctx.stub.putState('SPECIES_RULES_Ashwagandha', Buffer.from(JSON.stringify(defaultRules)));

        const herbs = [
            { id: 'HERB1', name: 'Ashwagandha', source: 'India', quantity: 100, owner: 'Supplier1', manufactureDate: '2025-01-10', expiryDate: '2026-01-10' },
            { id: 'HERB2', name: 'Tulsi', source: 'India', quantity: 200, owner: 'Supplier2', manufactureDate: '2025-02-15', expiryDate: '2026-02-15' }
        ];

        for (const herb of herbs) {
            herb.docType = 'herb';
            await ctx.stub.putState(herb.id, Buffer.from(JSON.stringify(herb)));
        }
    }

    // CRUD operations for herbs
    async CreateHerb(ctx, id, name, source, quantity, owner, manufactureDate, expiryDate) {
        const exists = await this.HerbExists(ctx, id);
        if (exists) throw new Error(`Herb ${id} already exists`);
        const herb = { docType:'herb', id, name, source, quantity: parseInt(quantity), owner, manufactureDate, expiryDate };
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(herb)));
    }

    async ReadHerb(ctx, id) {
        const herbJSON = await ctx.stub.getState(id);
        if (!herbJSON || herbJSON.length === 0) throw new Error(`Herb ${id} does not exist`);
        return herbJSON.toString();
    }

    async UpdateHerb(ctx, id, name, source, quantity, owner, manufactureDate, expiryDate) {
        const exists = await this.HerbExists(ctx, id);
        if (!exists) throw new Error(`Herb ${id} does not exist`);
        const herb = { docType:'herb', id, name, source, quantity: parseInt(quantity), owner, manufactureDate, expiryDate };
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(herb)));
    }

    async DeleteHerb(ctx, id) {
        const exists = await this.HerbExists(ctx, id);
        if (!exists) throw new Error(`Herb ${id} does not exist`);
        await ctx.stub.deleteState(id);
    }

    async HerbExists(ctx, id) {
        const herbJSON = await ctx.stub.getState(id);
        return herbJSON && herbJSON.length > 0;
    }

    async GetAllHerbs(ctx) {
        const results = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let res = await iterator.next();
        while (!res.done) {
            const record = JSON.parse(res.value.value.toString('utf8'));
            results.push(record);
            res = await iterator.next();
        }
        return JSON.stringify(results);
    }

    async TransferHerb(ctx, id, newOwner) {
        const herbStr = await this.ReadHerb(ctx, id);
        const herb = JSON.parse(herbStr);
        herb.owner = newOwner;
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(herb)));
    }

    // Collection events with rules
    async RecordCollection(ctx, collectionId, collectorId, latStr, longStr, timestamp, species, qualityJson) {
        const invokerMSP = ctx.clientIdentity.getMSPID();
        const lat = parseFloat(latStr);
        const long = parseFloat(longStr);
        const quality = JSON.parse(qualityJson || '{}');

        const rulesBytes = await ctx.stub.getState(`SPECIES_RULES_${species}`);
        if (rulesBytes && rulesBytes.length > 0) {
            const rules = JSON.parse(rulesBytes.toString());
            if (rules.geofence) {
                const dist = haversineDistance(rules.geofence.center.lat, rules.geofence.center.long, lat, long);
                if (dist > rules.geofence.radiusMeters) throw new Error(`Collection outside geofence`);
            }
            if (Array.isArray(rules.allowedMonths)) {
                const month = new Date(timestamp).getMonth()+1;
                if (!rules.allowedMonths.includes(month)) throw new Error(`Collection month ${month} not allowed`);
            }
            if (rules.qualityThresholds) {
                if ('moisture' in quality && quality.moisture > rules.qualityThresholds.moistureMax) throw new Error(`Moisture exceeds max`);
                if ('pesticidePPM' in quality && quality.pesticidePPM > rules.qualityThresholds.pesticidePPMMax) throw new Error(`Pesticide exceeds max`);
            }
        }

        const collection = { docType:'CollectionEvent', collectionId, collectorId, lat, long, timestamp, species, quality, recordedByMSP: invokerMSP };
        await ctx.stub.putState(`COLLECTION_${collectionId}`, Buffer.from(JSON.stringify(collection)));
        return collection;
    }

    async QueryByKey(ctx, key) {
        const data = await ctx.stub.getState(key);
        if (!data || data.length===0) throw new Error(`Key ${key} not found`);
        return data.toString();
    }

    async QueryByDocType(ctx, docType) {
        const results = [];
        const iter = await ctx.stub.getStateByRange(`${docType}_`, `${docType}_\uffff`);
        let res = await iter.next();
        while (!res.done) {
            if (res.value && res.value.value) results.push(JSON.parse(res.value.value.toString('utf8')));
            res = await iter.next();
        }
        return JSON.stringify(results);
    }

}

module.exports = HerbalTraceContract;
