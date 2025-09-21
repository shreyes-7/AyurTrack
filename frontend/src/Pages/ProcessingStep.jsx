// Record processing steps for a batch (drying, grinding, storage). Simple local persist.
import React, { useState } from 'react'
import Layout from '../Components/Layout'
import Card from '../Components/Card'
import Input from '../Components/Input'


export default function ProcessingStep() {
const [batchId, setBatchId] = useState(`BATCH-${Date.now()}`)
const [step, setStep] = useState('Drying')
const [notes, setNotes] = useState('')


function save() {
const payload = { id: `PROC-${Date.now()}`, batchId, step, notes, ts: new Date().toISOString() }
const existing = JSON.parse(localStorage.getItem('ayurtrace:processing') || '[]')
localStorage.setItem('ayurtrace:processing', JSON.stringify([payload, ...existing]))
alert('Saved processing step (local).')
}


return (
<Layout>
<Card title="Processing Step">
<Input label="Batch ID" value={batchId} onChange={e=>setBatchId(e.target.value)} />
<Input label="Step" value={step} onChange={e=>setStep(e.target.value)} />
<div>
<label className="block text-sm mb-1">Notes</label>
<textarea className="input-base h-24" value={notes} onChange={e=>setNotes(e.target.value)} />
</div>
<div className="mt-3">
<button onClick={save} className="px-4 py-2 rounded bg-indigo-600">Save Step</button>
</div>
</Card>
</Layout>
)
}