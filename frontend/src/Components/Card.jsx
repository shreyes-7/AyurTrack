// Small presentational card used across pages
import React from "react";

export default function Card({ title, children }) {
  return (
    <div className="p-4 rounded-2xl bg-green-50 border border-green-200 shadow-md">
      {title && <h3 className="font-semibold mb-3 text-green-700">{title}</h3>}
      <div>{children}</div>
    </div>
  );
}
