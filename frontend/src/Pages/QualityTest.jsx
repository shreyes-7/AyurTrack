// Enter QA results (moisture, pesticide, DNA). Stored locally and can be sent to ledger.
import React, { useState } from 'react'
import Layout from '../Components/Layout'
import Card from '../Components/Card'
import Input from '../Components/Input'
import { sendToLedger } from '../services/api'


export default function QualityTest() {
const [batchId, setBatchId] = useState('')
const [moisture, setMoisture] = useState('7')
const [pesticide, setPesticide] = useState('pass')
const [dna, setDna] = useState('verified')


async function save() {
const payload = { id: `QA-${Date.now()}`, batchId, moisture, pesticide, dna, ts: new Date().toISOString() }
const existing = JSON.parse(localStorage.getItem('ayurtrace:quality') || '[]')
localStorage.setItem('ayurtrace:quality', JSON.stringify([payload, ...existing]))
await sendToLedger('QualityTest', payload)
alert('Quality test saved (local + attempted ledger send).')
}


return (
<Layout>
<Card title="Quality Test">
<Input label="Batch ID" value={batchId} onChange={e=>setBatchId(e.target.value)} />
<Input label="Moisture (%)" value={moisture} onChange={e=>setMoisture(e.target.value)} />
<Input label="Pesticide Report" value={pesticide} onChange={e=>setPesticide(e.target.value)} />
<Input label="DNA Barcode" value={dna} onChange={e=>setDna(e.target.value)} />
<div className="mt-3">
<button onClick={save} className="px-4 py-2 rounded bg-emerald-600">Save QA</button>
</div>
</Card>
</Layout>
)
}