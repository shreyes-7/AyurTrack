// Generates an on-chain-style QR token for a finished batch (placeholder). Use QRCodeDisplay to show it.
import React, { useEffect, useState } from 'react'
import Layout from '../Components/Layout'
import Card from '../Components/Card'
import Input from '../Components/Input'
import QRCodeDisplay from '../Components/QRCodeDisplay'


export default function BatchLabel() {
const [batchId, setBatchId] = useState(`BATCH-${Date.now()}`)
const [token, setToken] = useState('')


useEffect(() => {
setToken(JSON.stringify({ batchId, issuedAt: new Date().toISOString(), salt: Math.random().toString(36).slice(2,8) }))
}, [batchId])


return (
<Layout>
<Card title="Batch Label (QR)">
<Input label="Batch ID" value={batchId} onChange={e=>setBatchId(e.target.value)} />
<div className="mt-3">
<QRCodeDisplay value={token} />
</div>
<p className="text-sm text-slate-400 mt-2">In production, the QR would reference a signed on-chain provenance bundle.</p>
</Card>
</Layout>
)
}