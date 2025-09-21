// Reusable labeled input
import React from 'react'
export default function Input({ label, ...props }) {
return (
<div>
{label && <label className="block text-sm mb-1">{label}</label>}
<input className="input-base" {...props} />
</div>
)
}