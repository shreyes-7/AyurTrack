'use strict';

const { Contract } = require('fabric-contract-api');

// --- Helpers ---
function toJSONSafe(obj) {
    try { return JSON.stringify(obj); } catch (e) { return JSON.stringify({error: 'stringify error'}); }
}

// Haversine distance (meters)
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

class AyurTrackContract extends Contract {

    /* -------------------------------------
       Extended InitLedger with hardcoded species
       ------------------------------------- */
    async InitLedger(ctx) {
        console.info('=== InitLedger: setting default species and sample participant ===');

        const speciesList = [
            {
                species: 'Ashwagandha',
                geofence: { center: { lat: 26.9, long: 75.8 }, radiusMeters: 50000 },
                allowedMonths: [1,2,3,10,11,12],
                qualityThresholds: { moistureMax: 10, pesticidePPMMax: 2 }
            },
            {
                species: 'Tulsi',
                geofence: { center: { lat: 28.6, long: 77.2 }, radiusMeters: 70000 },
                allowedMonths: [4,5,6,7,8,9],
                qualityThresholds: { moistureMax: 12, pesticidePPMMax: 1.5 }
            },
            {
                species: 'Amla',
                geofence: { center: { lat: 25.4, long: 82.0 }, radiusMeters: 60000 },
                allowedMonths: [9,10,11,12],
                qualityThresholds: { moistureMax: 8, pesticidePPMMax: 1 }
            }
        ];

        for (const s of speciesList) {
            await ctx.stub.putState(`SPECIES_RULES_${s.species}`, Buffer.from(JSON.stringify(s)));
        }

        const sampleFarmer = {
            docType: 'participant',
            type: 'farmer',
            id: 'F001',
            name: 'Ram Kumar',
            location: 'VillageX',
            mspId: 'Org1MSP'
        };
        await ctx.stub.putState('PARTICIPANT_farmer_F001', Buffer.from(JSON.stringify(sampleFarmer)));

        console.info('=== InitLedger done ===');
    }

    /* -------------------------------------
       Participant registry
       ------------------------------------- */

    // participantJson must include at least: { "type":"farmer"|"lab"|"processor"|"manufacturer", "id":"F001", "name":"Ram", "mspId":"Org1MSP", ... }
    async CreateParticipant(ctx, participantJson) {
        const p = JSON.parse(participantJson);
        if (!p.type || !p.id || !p.mspId) throw new Error('participant must have type, id and mspId');
        const key = `PARTICIPANT_${p.type}_${p.id}`;
        const exists = await ctx.stub.getState(key);
        if (exists && exists.length > 0) throw new Error(`Participant ${p.type}/${p.id} already exists`);
        p.docType = 'participant';
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(p)));
        return p;
    }

    async ReadParticipant(ctx, type, id) {
        const key = `PARTICIPANT_${type}_${id}`;
        const data = await ctx.stub.getState(key);
        if (!data || data.length === 0) throw new Error(`Participant ${type}/${id} not found`);
        return data.toString();
    }

    async QueryParticipants(ctx, type) {
        const prefix = `PARTICIPANT_${type}_`;
        const res = [];
        const it = await ctx.stub.getStateByRange(prefix, prefix + '\uffff');
        let r = await it.next();
        while (!r.done) {
            if (r.value && r.value.value) res.push(JSON.parse(r.value.value.toString('utf8')));
            r = await it.next();
        }
        return JSON.stringify(res);
    }

    // helper: ensure caller's MSP matches stored participant mspId (simple role enforcement)
    async _assertInvokerMatchesParticipantMSP(ctx, type, id) {
        const invokerMSP = ctx.clientIdentity.getMSPID();
        const key = `PARTICIPANT_${type}_${id}`;
        const bytes = await ctx.stub.getState(key);
        if (!bytes || bytes.length === 0) throw new Error(`Participant ${type}/${id} not registered`);
        const p = JSON.parse(bytes.toString());
        if (!p.mspId) throw new Error(`Participant ${type}/${id} missing mspId`);
        if (p.mspId !== invokerMSP) throw new Error(`Invoker MSP (${invokerMSP}) does not match participant ${p.mspId}`);
        return true;
    }

    /* -------------------------------------
       Extra CRUD for Participants
       ------------------------------------- */

    async UpdateParticipant(ctx, type, id, updatedJson) {
        const key = `PARTICIPANT_${type}_${id}`;
        const bytes = await ctx.stub.getState(key);
        if (!bytes || bytes.length === 0) throw new Error(`Participant ${type}/${id} not found`);
        const current = JSON.parse(bytes.toString());
        const updated = { ...current, ...JSON.parse(updatedJson) };
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(updated)));
        return updated;
    }

    async DeleteParticipant(ctx, type, id) {
        const key = `PARTICIPANT_${type}_${id}`;
        const bytes = await ctx.stub.getState(key);
        if (!bytes || bytes.length === 0) throw new Error(`Participant ${type}/${id} not found`);
        await ctx.stub.deleteState(key);
        return { deleted: key };
    }

    /* -------------------------------------
       Species rules
       ------------------------------------- */

    async SetSpeciesRules(ctx, species, rulesJson) {
        const rules = JSON.parse(rulesJson);
        await ctx.stub.putState(`SPECIES_RULES_${species}`, Buffer.from(JSON.stringify(rules)));
        return rules;
    }

    async GetSpeciesRules(ctx, species) {
        const bytes = await ctx.stub.getState(`SPECIES_RULES_${species}`);
        if (!bytes || bytes.length === 0) throw new Error(`No rules for species ${species}`);
        return bytes.toString();
    }

    /* -------------------------------------
       Collection / Herb batch
       ------------------------------------- */

    // CreateHerbBatch(batchId, collectionId, collectorId, lat, long, timestamp, species, quantity, qualityJson)
    async CreateHerbBatch(ctx, batchId, collectionId, collectorId, latStr, longStr, timestamp, species, quantityStr, qualityJson) {
        // enforce caller matches participant (so only the farmer org owning the farmer id can call)
        await this._assertInvokerMatchesParticipantMSP(ctx, 'farmer', collectorId);

        const lat = parseFloat(latStr);
        const long = parseFloat(longStr);
        const quantity = parseFloat(quantityStr);
        const quality = (qualityJson && qualityJson.length>0) ? JSON.parse(qualityJson) : {};

        // validate rules if present
        const rulesBytes = await ctx.stub.getState(`SPECIES_RULES_${species}`);
        if (rulesBytes && rulesBytes.length > 0) {
            const rules = JSON.parse(rulesBytes.toString());
            if (rules.geofence) {
                const dist = haversineDistance(rules.geofence.center.lat, rules.geofence.center.long, lat, long);
                if (dist > rules.geofence.radiusMeters) throw new Error(`Collection outside geofence by ${Math.round(dist)} meters`);
            }
            if (Array.isArray(rules.allowedMonths) && timestamp) {
                const month = new Date(timestamp).getMonth()+1;
                if (!rules.allowedMonths.includes(month)) throw new Error(`Collection month ${month} not allowed for species ${species}`);
            }
            if (rules.qualityThresholds) {
                if ('moisture' in quality && quality.moisture > rules.qualityThresholds.moistureMax) throw new Error(`Moisture (${quality.moisture}) exceeds allowed max (${rules.qualityThresholds.moistureMax})`);
                if ('pesticidePPM' in quality && quality.pesticidePPM > rules.qualityThresholds.pesticidePPMMax) throw new Error(`Pesticide (${quality.pesticidePPM}) exceeds allowed max (${rules.qualityThresholds.pesticidePPMMax})`);
            }
        }

        const invokerMSP = ctx.clientIdentity.getMSPID();
        const batch = {
            docType: 'herbBatch',
            batchId,
            collectionId,
            collectorId,
            lat, long,
            timestamp,
            species,
            quantity,
            quality,
            currentOwner: collectorId,
            status: 'collected',
            recordedByMSP: invokerMSP
        };

        await ctx.stub.putState(`HERBBATCH_${batchId}`, Buffer.from(JSON.stringify(batch)));

        const collection = {
            docType: 'collectionEvent',
            collectionId,
            batchId,
            collectorId,
            lat, long,
            timestamp,
            species,
            quantity,
            quality,
            recordedByMSP: invokerMSP
        };
        await ctx.stub.putState(`COLLECTION_${collectionId}`, Buffer.from(JSON.stringify(collection)));

        return batch;
    }

    async ReadHerbBatch(ctx, batchId) {
        const key = `HERBBATCH_${batchId}`;
        const data = await ctx.stub.getState(key);
        if (!data || data.length === 0) throw new Error(`Herb batch ${batchId} not found`);
        return data.toString();
    }

    /* -------------------------------------
       Extra CRUD for Herb Batches
       ------------------------------------- */

    async UpdateHerbBatch(ctx, batchId, updatedJson) {
        const key = `HERBBATCH_${batchId}`;
        const bytes = await ctx.stub.getState(key);
        if (!bytes || bytes.length === 0) throw new Error(`Herb batch ${batchId} not found`);
        const current = JSON.parse(bytes.toString());
        const updated = { ...current, ...JSON.parse(updatedJson) };
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(updated)));
        return updated;
    }

    async DeleteHerbBatch(ctx, batchId) {
        const key = `HERBBATCH_${batchId}`;
        const bytes = await ctx.stub.getState(key);
        if (!bytes || bytes.length === 0) throw new Error(`Herb batch ${batchId} not found`);
        await ctx.stub.deleteState(key);
        return { deleted: key };
    }

    async QueryAllHerbBatches(ctx) {
        const res = [];
        const it = await ctx.stub.getStateByRange('HERBBATCH_', 'HERBBATCH_\uffff');
        let r = await it.next();
        while (!r.done) {
            if (r.value && r.value.value) res.push(JSON.parse(r.value.value.toString('utf8')));
            r = await it.next();
        }
        return JSON.stringify(res);
    }

    /* -------------------------------------
       Processing steps
       ------------------------------------- */

    // AddProcessingStep(processId, batchId, facilityId, stepType, paramsJson, timestamp)
    async AddProcessingStep(ctx, processId, batchId, facilityId, stepType, paramsJson, timestamp) {
        // only processor org that registered facilityId may call
        await this._assertInvokerMatchesParticipantMSP(ctx, 'processor', facilityId);

        const params = (paramsJson && paramsJson.length>0) ? JSON.parse(paramsJson) : {};
        const invokerMSP = ctx.clientIdentity.getMSPID();

        const proc = {
            docType: 'processingStep',
            processId,
            batchId,
            facilityId,
            stepType,
            params,
            timestamp,
            recordedByMSP: invokerMSP
        };
        await ctx.stub.putState(`PROCESS_${processId}`, Buffer.from(JSON.stringify(proc)));

        // update batch status
        const batchKey = `HERBBATCH_${batchId}`;
        const batchBytes = await ctx.stub.getState(batchKey);
        if (batchBytes && batchBytes.length > 0) {
            const batch = JSON.parse(batchBytes.toString());
            batch.status = `processed:${stepType}`;
            batch.currentOwner = facilityId;
            await ctx.stub.putState(batchKey, Buffer.from(JSON.stringify(batch)));
        }

        return proc;
    }

    /* -------------------------------------
       Quality tests (labs)
       ------------------------------------- */

    // AddQualityTest(testId, batchId, labId, testType, resultsJson, timestamp)
    async AddQualityTest(ctx, testId, batchId, labId, testType, resultsJson, timestamp) {
        // only lab org that owns labId can call
        await this._assertInvokerMatchesParticipantMSP(ctx, 'lab', labId);

        const results = (resultsJson && resultsJson.length>0) ? JSON.parse(resultsJson) : {};
        const invokerMSP = ctx.clientIdentity.getMSPID();

        const test = {
            docType: 'qualityTest',
            testId,
            batchId,
            labId,
            testType,
            results,
            timestamp,
            recordedByMSP: invokerMSP
        };
        await ctx.stub.putState(`QUALITY_${testId}`, Buffer.from(JSON.stringify(test)));

        // update batch with lastQualityTest, and mark fail if thresholds exceeded
        const batchKey = `HERBBATCH_${batchId}`;
        const batchBytes = await ctx.stub.getState(batchKey);
        if (batchBytes && batchBytes.length > 0) {
            const batch = JSON.parse(batchBytes.toString());
            batch.lastQualityTest = testId;
            const rulesBytes = await ctx.stub.getState(`SPECIES_RULES_${batch.species}`);
            if (rulesBytes && rulesBytes.length > 0) {
                const rules = JSON.parse(rulesBytes.toString());
                if (rules.qualityThresholds) {
                    if ('moisture' in results && results.moisture > rules.qualityThresholds.moistureMax) batch.status = 'quality_fail';
                    if ('pesticidePPM' in results && results.pesticidePPM > rules.qualityThresholds.pesticidePPMMax) batch.status = 'quality_fail';
                }
            }
            await ctx.stub.putState(batchKey, Buffer.from(JSON.stringify(batch)));
        }

        return test;
    }

    /* -------------------------------------
       Formulation / final product
       ------------------------------------- */

    // CreateFormulation(productBatchId, manufacturerId, inputBatchesJson, formulationParamsJson, timestamp)
    async CreateFormulation(ctx, productBatchId, manufacturerId, inputBatchesJson, formulationParamsJson, timestamp) {
        // only manufacturer org that owns manufacturerId can call
        await this._assertInvokerMatchesParticipantMSP(ctx, 'manufacturer', manufacturerId);

        const inputBatches = (inputBatchesJson && inputBatchesJson.length>0) ? JSON.parse(inputBatchesJson) : [];
        const params = (formulationParamsJson && formulationParamsJson.length>0) ? JSON.parse(formulationParamsJson) : {};
        const invokerMSP = ctx.clientIdentity.getMSPID();

        const form = {
            docType: 'formulation',
            productBatchId,
            manufacturerId,
            inputBatches,
            formulationParams: params,
            timestamp,
            recordedByMSP: invokerMSP
        };

        // mark each input batch as used and transfer owner
        for (const bid of inputBatches) {
            const batchKey = `HERBBATCH_${bid}`;
            const batchBytes = await ctx.stub.getState(batchKey);
            if (batchBytes && batchBytes.length>0) {
                const batch = JSON.parse(batchBytes.toString());
                batch.status = 'used_in_formulation';
                batch.currentOwner = manufacturerId;
                if (!batch.usedIn) batch.usedIn = [];
                batch.usedIn.push(productBatchId);
                await ctx.stub.putState(batchKey, Buffer.from(JSON.stringify(batch)));
            }
        }

        await ctx.stub.putState(`FORM_${productBatchId}`, Buffer.from(JSON.stringify(form)));
        return form;
    }

    // GenerateBatchQR(productBatchId, token)
    async GenerateBatchQR(ctx, productBatchId, token) {
        // token optional
        let t = token;
        if (!t || t.length === 0) t = `${productBatchId}_${Date.now()}`;
        await ctx.stub.putState(`BATCHQR_${t}`, Buffer.from(productBatchId));

        const formKey = `FORM_${productBatchId}`;
        const formBytes = await ctx.stub.getState(formKey);
        if (formBytes && formBytes.length>0) {
            const form = JSON.parse(formBytes.toString());
            form.qrToken = t;
            await ctx.stub.putState(formKey, Buffer.from(JSON.stringify(form)));
        }
        return t;
    }

    /* -------------------------------------
       Provenance
       ------------------------------------- */

    // GetProvenance(productBatchId)
    async GetProvenance(ctx, productBatchId) {
        const formKey = `FORM_${productBatchId}`;
        const formBytes = await ctx.stub.getState(formKey);
        if (!formBytes || formBytes.length === 0) throw new Error(`Formulation ${productBatchId} not found`);
        const form = JSON.parse(formBytes.toString());

        const bundle = {
            productBatchId: form.productBatchId,
            manufacturerId: form.manufacturerId,
            formulationParams: form.formulationParams,
            timestamp: form.timestamp,
            inputBatches: []
        };

        for (const bid of form.inputBatches) {
            const batchKey = `HERBBATCH_${bid}`;
            const batchBytes = await ctx.stub.getState(batchKey);
            const item = {};
            if (batchBytes && batchBytes.length>0) {
                const batch = JSON.parse(batchBytes.toString());
                item.batch = batch;

                const collKey = `COLLECTION_${batch.collectionId}`;
                const collBytes = await ctx.stub.getState(collKey);
                if (collBytes && collBytes.length>0) item.collection = JSON.parse(collBytes.toString());

                // process steps
                item.processSteps = [];
                const pIter = await ctx.stub.getStateByRange('PROCESS_', 'PROCESS_\uffff');
                let pRes = await pIter.next();
                while (!pRes.done) {
                    if (pRes.value && pRes.value.value) {
                        const proc = JSON.parse(pRes.value.value.toString('utf8'));
                        if (proc.batchId === bid) item.processSteps.push(proc);
                    }
                    pRes = await pIter.next();
                }

                // quality tests
                item.qualityTests = [];
                const qIter = await ctx.stub.getStateByRange('QUALITY_', 'QUALITY_\uffff');
                let qRes = await qIter.next();
                while (!qRes.done) {
                    if (qRes.value && qRes.value.value) {
                        const qt = JSON.parse(qRes.value.value.toString('utf8'));
                        if (qt.batchId === bid) item.qualityTests.push(qt);
                    }
                    qRes = await qIter.next();
                }

                // fetch collector profile if exists
                if (batch.collectorId) {
                    const pk = `PARTICIPANT_farmer_${batch.collectorId}`;
                    const pbytes = await ctx.stub.getState(pk);
                    if (pbytes && pbytes.length>0) item.collectorProfile = JSON.parse(pbytes.toString());
                }
            } else {
                item.error = 'batch not found';
            }
            bundle.inputBatches.push(item);
        }

        // manufacturer profile
        const manKey = `PARTICIPANT_manufacturer_${form.manufacturerId}`;
        const mBytes = await ctx.stub.getState(manKey);
        if (mBytes && mBytes.length>0) bundle.manufacturerProfile = JSON.parse(mBytes.toString());

        return JSON.stringify(bundle);
    }

    /* -------------------------------------
       Generic helpers
       ------------------------------------- */

    async QueryByPrefix(ctx, prefix) {
        const start = prefix;
        const end = prefix + '\uffff';
        const result = [];
        const it = await ctx.stub.getStateByRange(start, end);
        let r = await it.next();
        while (!r.done) {
            if (r.value && r.value.value) {
                try { result.push(JSON.parse(r.value.value.toString('utf8'))); }
                catch (e) { result.push(r.value.value.toString('utf8')); }
            }
            r = await it.next();
        }
        return JSON.stringify(result);
    }

    async DeleteByKey(ctx, key) {
        const bytes = await ctx.stub.getState(key);
        if (!bytes || bytes.length === 0) throw new Error(`Key ${key} not found`);
        await ctx.stub.deleteState(key);
        return { deleted: key };
    }
}

module.exports = AyurTrackContract;
