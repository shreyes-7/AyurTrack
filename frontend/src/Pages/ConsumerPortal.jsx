// Allows pasting/scanning a QR token (for demo we accept pasted JSON). Displays provenance bundle.
import React, { useState } from 'react'
import Layout from '../Components/Layout'
import Card from '../Components/Card'


export default function ConsumerPortal() {
const [token, setToken] = useState('')
const [decoded, setDecoded] = useState(null)


function inspect() {
try { setDecoded(JSON.parse(token)) } catch(e) { setDecoded({ raw: token }) }
}


return (
<Layout>
<Card title="Consumer Portal - Inspect QR">
<label className="block text-sm mb-1">Paste QR JSON token</label>
<textarea className="input-base h-28" value={token} onChange={e=>setToken(e.target.value)} />
<div className="mt-2">
<button onClick={inspect} className="px-3 py-2 rounded bg-indigo-600">Inspect</button>
</div>


{decoded && (
<div className="mt-4 p-3 rounded bg-slate-800">
<pre className="text-sm">{JSON.stringify(decoded, null, 2)}</pre>
</div>
)}
</Card>
</Layout>
)
}