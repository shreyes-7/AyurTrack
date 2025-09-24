import { QRCodeSVG } from "qrcode.react";

export default function QRCodeDisplay({ value, size = 160 }) {
  return (
    <div className="inline-block p-3 rounded bg-green-50 border border-green-200">
      <QRCodeSVG value={value || "empty"} size={size} />
    </div>
  );
}
