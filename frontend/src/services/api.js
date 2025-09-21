// Mock API layer - replace sendToLedger() with real REST calls to your Fabric/Corda gateway
export async function sendToLedger(eventType, payload) {
    console.log('[mock-api] sendToLedger', eventType, payload)
    // simulate network delay
    await new Promise(r => setTimeout(r, 600))
    return { success: true, txId: `tx_${Date.now()}` }
}


const mockProducts = [
    {
        id: 'BTH001',
        herbName: 'Ashwagandha',
        batchId: 'BTH001',
        status: 'tested',
        collector: 'Ramesh Kumar',
        collectionDate: '2024-01-15',
        location: { lat: 28.6139, lng: 77.2090, address: 'Delhi, India' },
        tests: {
            moisture: 8.5,
            pesticide: 'PASS',
            dnaBarcode: 'DNA_ASH_001'
        },
        processingSteps: ['Collection', 'Quality Check', 'Drying'],
        compliance: true
    },
    {
        id: 'BTH002',
        herbName: 'Turmeric',
        batchId: 'BTH002',
        status: 'processed',
        collector: 'Priya Sharma',
        collectionDate: '2024-01-20',
        location: { lat: 13.0827, lng: 80.2707, address: 'Chennai, India' },
        tests: {
            moisture: 7.2,
            pesticide: 'PASS',
            dnaBarcode: 'DNA_TUR_002'
        },
        processingSteps: ['Collection', 'Quality Check', 'Drying', 'Grinding'],
        compliance: true
    },
    {
        id: 'BTH003',
        herbName: 'Neem',
        batchId: 'BTH003',
        status: 'collected',
        collector: 'Suresh Patil',
        collectionDate: '2024-01-25',
        location: { lat: 19.0760, lng: 72.8777, address: 'Mumbai, India' },
        tests: null,
        processingSteps: ['Collection'],
        compliance: false
    }
];

const mockEvents = [
    {
        id: '1',
        type: 'collected',
        productId: 'BTH001',
        timestamp: '2024-01-15T10:00:00Z',
        actor: 'Ramesh Kumar',
        data: { location: 'Delhi, India', notes: 'High quality harvest' }
    },
    {
        id: '2',
        type: 'tested',
        productId: 'BTH001',
        timestamp: '2024-01-16T14:30:00Z',
        actor: 'Lab Tech A',
        data: { moisture: 8.5, pesticide: 'PASS' }
    },
    {
        id: '3',
        type: 'collected',
        productId: 'BTH002',
        timestamp: '2024-01-20T09:30:00Z',
        actor: 'Priya Sharma',
        data: { location: 'Chennai, India', notes: 'Organic cultivation' }
    },
    {
        id: '4',
        type: 'tested',
        productId: 'BTH002',
        timestamp: '2024-01-21T15:45:00Z',
        actor: 'Lab Tech B',
        data: { moisture: 7.2, pesticide: 'PASS' }
    },
    {
        id: '5',
        type: 'processed',
        productId: 'BTH002',
        timestamp: '2024-01-22T11:20:00Z',
        actor: 'Processing Unit A',
        data: { processType: 'Grinding', quality: 'Premium' }
    }
];

// Simulate async API calls with promises and delays
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// API endpoints with pure mock implementation
const apiEndpoints = {
    // Products
    getProducts: async () => {
        await delay();
        return { data: mockProducts };
    },

    getProductById: async (id) => {
        await delay();
        const product = mockProducts.find(p => p.id === id);
        if (!product) {
            throw new Error('Product not found');
        }
        return { data: product };
    },

    // Events
    createCollectorEvent: async (eventData) => {
        await delay();
        const newProduct = {
            id: `BTH${String(Date.now()).slice(-3)}`,
            herbName: eventData.herbName,
            batchId: `BTH${String(Date.now()).slice(-3)}`,
            status: 'collected',
            collector: eventData.collectorName,
            collectionDate: eventData.harvestDate,
            location: {
                lat: parseFloat(eventData.gpsLat),
                lng: parseFloat(eventData.gpsLng),
                address: eventData.location || 'Unknown Location'
            },
            tests: null,
            processingSteps: ['Collection'],
            compliance: false,
            quantity: eventData.quantity,
            unit: eventData.unit,
            qualityNotes: eventData.qualityNotes
        };

        const newEvent = {
            id: Date.now().toString(),
            type: 'collected',
            productId: newProduct.id,
            timestamp: new Date().toISOString(),
            actor: eventData.collectorName,
            data: eventData
        };

        mockProducts.push(newProduct);
        mockEvents.push(newEvent);
        return { data: newEvent };
    },

    createProcessorEvent: async (eventData) => {
        await delay();
        const newEvent = {
            id: Date.now().toString(),
            type: 'processed',
            productId: eventData.batchId,
            timestamp: new Date().toISOString(),
            actor: eventData.processorName || 'Processor',
            data: eventData
        };
        mockEvents.push(newEvent);
        return { data: newEvent };
    },

    // Tests
    createLabTest: async (testData) => {
        await delay();
        const newTest = {
            id: Date.now().toString(),
            batchId: testData.batchId,
            timestamp: new Date().toISOString(),
            technician: testData.labTechnician,
            results: {
                moisture: testData.moisturePercentage,
                pesticide: testData.pesticideResult,
                dnaBarcode: testData.dnaBarcode,
                phLevel: testData.phLevel,
                heavyMetals: testData.heavyMetals,
                microbialTest: testData.microbialTest
            },
            facility: testData.testingFacility,
            certificationNumber: testData.certificationNumber,
            notes: testData.additionalNotes
        };

        // Update the product's test status
        const product = mockProducts.find(p => p.batchId === testData.batchId);
        if (product) {
            product.status = 'tested';
            product.tests = newTest.results;
        }

        return { data: newTest };
    },

    // Get events for a product
    getEventsByProductId: async (productId) => {
        await delay();
        const events = mockEvents.filter(e => e.productId === productId);
        return { data: events };
    },

    // Admin functions
    approveBatch: async (batchId) => {
        await delay();
        const product = mockProducts.find(p => p.batchId === batchId);
        if (product) {
            product.compliance = true;
            product.status = 'approved';
        }
        return { data: { success: true, batchId } };
    },

    triggerRecall: async (batchId, reason) => {
        await delay();
        const product = mockProducts.find(p => p.batchId === batchId);
        if (product) {
            product.status = 'recalled';
            product.recallReason = reason;
        }
        return { data: { success: true, batchId, reason } };
    },

    // Dashboard data
    getDashboardStats: async () => {
        await delay();
        return {
            data: {
                totalBatches: mockProducts.length,
                testedBatches: mockProducts.filter(p => p.status === 'tested' || p.status === 'processed').length,
                approvedBatches: mockProducts.filter(p => p.compliance).length,
                recentEvents: mockEvents.slice(-5)
            }
        };
    }
};

export { apiEndpoints };
export default apiEndpoints;
