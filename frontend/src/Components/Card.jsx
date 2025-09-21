// Small presentational card used across pages
import React from 'react'
export default function Card({ title, children }) {
return (
<div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
{title && <h3 className="font-semibold mb-3">{title}</h3>}
<div>{children}</div>
</div>
)
}