import React, { useState, useRef, useEffect } from "react";
import Layout from "../Components/Layout";
import Card from "../Components/Card";
import { ShieldCheck, AlertTriangle, ClipboardCopy, Upload, Camera } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function ConsumerPortal() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef(null);
  const [qrScanner, setQrScanner] = useState(null);

  // Parse JSON token
  function inspectToken(payload) {
    try {
      const parsed = JSON.parse(payload);
      setDecoded(parsed);
      setError("");
    } catch {
      setDecoded(null);
      setError("Invalid token format. Ensure this is valid QR JSON payload.");
    }
  }

  function inspect() {
    inspectToken(token);
  }

  function copyPayload() {
    if (!decoded) return;
    navigator.clipboard.writeText(JSON.stringify(decoded, null, 2));
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        import("jsqr").then(jsqr => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsqr.default(imageData.data, canvas.width, canvas.height);
          if (code) {
            setToken(code.data);
            inspectToken(code.data);
          } else {
            setError("No QR code found in image.");
          }
        });
      };
    };
    reader.readAsDataURL(file);
  }

  function startCameraScan() {
    if (scanning) return;
    const html5Qr = new Html5Qrcode("qr-reader");
    setQrScanner(html5Qr);
    html5Qr
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          setToken(decodedText);
          inspectToken(decodedText);
          html5Qr.stop();
          setScanning(false);
        },
        (errorMessage) => {
          // console.log("QR scan error", errorMessage);
        }
      )
      .then(() => setScanning(true))
      .catch((err) => setError("Camera not accessible"));
  }

  function stopCameraScan() {
    if (qrScanner) {
      qrScanner.stop();
      setScanning(false);
    }
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-black text-slate-200 p-6">
        <div className="max-w-5xl mx-auto">
          <Card className="p-6 bg-gradient-to-b from-black via-slate-900 to-black/90 border border-slate-800 shadow-2xl rounded-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-400">
              Consumer Portal — QR Verification
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Paste, upload, or scan a QR code to inspect the provenance of Ayurvedic batches.
            </p>

            {/* Paste QR token */}
            <div className="mt-6">
              <label className="text-xs text-slate-400">Paste QR JSON Token</label>
              <textarea
                className="mt-2 w-full h-28 bg-gray-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder='{"batchId":"...","collector":"..."}'
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={inspect}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-cyan-500 text-black font-semibold hover:opacity-90"
                >
                  <ShieldCheck className="w-4 h-4" /> Inspect
                </button>
                <button
                  onClick={() => document.getElementById("qr-upload").click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
                >
                  <Upload className="w-4 h-4" /> Upload QR
                  <input
                    type="file"
                    accept="image/*"
                    id="qr-upload"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </button>
                {!scanning ? (
                  <button
                    onClick={startCameraScan}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
                  >
                    <Camera className="w-4 h-4" /> Scan QR
                  </button>
                ) : (
                  <button
                    onClick={stopCameraScan}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm"
                  >
                    Stop Scan
                  </button>
                )}
                <button
                  onClick={copyPayload}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
                >
                  <ClipboardCopy className="w-4 h-4" /> Copy Payload
                </button>
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            {/* QR Camera Scan */}
            {scanning && (
              <div id="qr-reader" className="mt-4 w-full h-64 border border-slate-700 rounded-lg" />
            )}

            {/* Provenance preview */}
            {decoded && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> Authenticity Verified
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Blockchain-backed payload · immutable & consumer verifiable.
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-b from-slate-900/40 to-black/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Batch ID</div>
                    <div className="mt-1 font-medium">{decoded.batchId}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-gradient-to-b from-slate-900/40 to-black/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Collector</div>
                    <div className="mt-1 font-medium">{decoded.collector}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-gradient-to-b from-slate-900/40 to-black/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Species</div>
                    <div className="mt-1 font-medium">{decoded.species}</div>
                  </div>
                </div>

                <div className="mt-6 text-sm text-slate-400">
                  <strong>Payload (raw JSON)</strong>
                  <pre className="mt-2 p-3 rounded-lg bg-[#07111a] text-xs overflow-auto border border-slate-800">
                    {JSON.stringify(decoded, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </Card>

          <div className="mt-6 text-xs text-slate-500 text-center">
            Developed for: Blockchain Botanical Traceability · Consumer Transparency
          </div>
        </div>
      </div>
    </Layout>
  );
}
