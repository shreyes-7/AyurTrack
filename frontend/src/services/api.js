// Mock API layer - replace sendToLedger() with real REST calls to your Fabric/Corda gateway
export async function sendToLedger(eventType, payload) {
console.log('[mock-api] sendToLedger', eventType, payload)
// simulate network delay
await new Promise(r => setTimeout(r, 600))
return { success: true, txId: `tx_${Date.now()}` }
}