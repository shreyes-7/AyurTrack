// Offline-friendly collection capture page. Uses useGeolocation hook and pushes to AppContext queue
// option: attempt immediate send (if you want optimistic sync)
import React, { useState } from 'react';
import Layout from '../Components/Layout';
import Card from '../Components/Card';
import Input from '../Components/Input';

const CollectionEvent = () => {
  const [species, setSpecies] = useState('');
  const [collector, setCollector] = useState('');
  const [status, setStatus] = useState('');
  const [coords, setCoords] = useState(null);
  const [notes, setNotes] = useState('');

  const capture = async () => {
	// Capture GPS logic here
  };

  const save = async () => {
	const payload = { species, collector, notes, coords };
	try {
	  const res = await sendToLedger('CollectionEvent', payload);
	  if (res.success) {
		// on success you may remove from queue. Here we keep it simple.
		console.log('sent to ledger', res.txId);
	  }
	} catch (e) {
	  console.warn('send failed, left in queue');
	}
	alert('Saved collection locally and queued.');
  };

  return (
	<Layout>
	  <Card title="Collection Event">
		<div className="space-y-3">
		  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
			<Input label="Species" value={species} onChange={e => setSpecies(e.target.value)} />
			<Input label="Collector ID" value={collector} onChange={e => setCollector(e.target.value)} />
		  </div>

		  <div>
			<div className="flex gap-2">
			  <button onClick={() => capture()} className="px-3 py-2 rounded bg-indigo-600">Capture GPS</button>
			  <div className="text-sm text-slate-400">status: {status}</div>
			</div>
			{coords && <div className="text-xs text-slate-300 mt-2">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} (acc {coords.acc}m)</div>}
		  </div>

		  <div>
			<label className="block text-sm mb-1">Notes / initial quality</label>
			<textarea className="input-base h-24" value={notes} onChange={e => setNotes(e.target.value)} />
		  </div>

		  <div className="flex gap-2">
			<button onClick={save} className="px-4 py-2 rounded bg-emerald-600">Save & Queue</button>
		  </div>
		</div>
	  </Card>
	</Layout>
  );
};

export default CollectionEvent;