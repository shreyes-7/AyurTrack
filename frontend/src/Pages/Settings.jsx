// Utilities: view & clear queue, toggle theme
import React from 'react'
import Card from '../Components/Card'
import { useApp } from '../context/AppContext'


export default function Settings() {
const { queue, clearQueue, dark, setDark } = useApp()
return (
<Card title="Settings & Utilities">
<div className="space-y-3">
<div>Offline queue length: <strong>{queue.length}</strong></div>
<div className="flex gap-2">
<button onClick={() => { if (confirm('Clear queue?')) clearQueue() }} className="px-3 py-2 rounded bg-red-600">Clear Queue</button>
<button onClick={() => setDark(!dark)} className="px-3 py-2 rounded bg-indigo-600">Toggle Theme</button>
</div>
</div>
</Card>
)
}
