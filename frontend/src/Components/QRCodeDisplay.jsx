import { QRCodeSVG } from "qrcode.react";

export default function QRCodeDisplay({ value, size = 160 }) {
  return (
    <div className="inline-block p-3 rounded bg-slate-800">
      <QRCodeSVG value={value || 'empty'} size={size} />
    </div>
  );
}
