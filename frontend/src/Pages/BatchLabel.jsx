import React, { useEffect, useRef, useState } from "react";
import Layout from "../Components/Layout";
import Card from "../Components/Card";
import Input from "../Components/Input";
import QRCodeDisplay from "../Components/QRCodeDisplay";
import {
  Copy,
  Download,
  MapPin,
  Calendar,
  Zap,
  Archive,
  PlusCircle,
  Trash,
} from "lucide-react";

export default function BatchLabelAdvanced() {
  const [batchId, setBatchId] = useState(`BATCH-${Date.now()}`);
  const [collector, setCollector] = useState("Radha Farmers Co-op");
  const [species, setSpecies] = useState("Withania somnifera (Ashwagandha)");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString());
  const [lat, setLat] = useState(26.9124);
  const [lng, setLng] = useState(75.7873);
  const [notes, setNotes] = useState("");
  const [token, setToken] = useState("");
  const [expanded, setExpanded] = useState(true);
  const qrRef = useRef(null);

  useEffect(() => {
    generateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function generateToken() {
    const payload = {
      batchId,
      collector,
      species,
      issuedAt,
      geo: {
        lat: Number(lat),
        lng: Number(lng),
      },
      notes,
      salt: Math.random().toString(36).slice(2, 9),
    };
    setToken(JSON.stringify(payload));
  }

  function copyToken() {
    navigator.clipboard?.writeText(token);
    // small toast fallback
    const el = document.createElement("div");
    el.textContent = "Copied QR payload to clipboard";
    Object.assign(el.style, {
      position: "fixed",
      right: "1rem",
      bottom: "1.2rem",
      background: "rgba(10,10,10,0.9)",
      color: "#d1fae5",
      padding: "8px 12px",
      borderRadius: "8px",
      zIndex: 9999,
      fontSize: "13px",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  async function downloadSVG() {
    const container = qrRef.current;
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batchId}_qr.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function downloadPNG() {
    const container = qrRef.current;
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const canvas = document.createElement("canvas");
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });

    // draw white (or transparent) background depending on dark mode — we choose transparent
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);

    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${batchId}_qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  function openMaps() {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(mapsUrl, "_blank");
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-green-50 text-gray-800 p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: QR Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white border border-green-200 shadow-md rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-green-500 to-green-400">
                    Batch Label — QR
                  </h2>

                  <p className="text-xs text-green-500 mt-1">
                    Stylized on-chain token preview · immutable-ready payload
                  </p>
                </div>
              </div>

              <div ref={qrRef} className="mt-6 flex flex-col items-center">
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 shadow-inner">
                  <QRCodeDisplay value={token} size={260} />
                </div>

                <div className="mt-4 w-full flex gap-2">
                  <button
                    onClick={copyToken}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-200 hover:bg-green-300 text-green-800 text-sm"
                  >
                    <Copy className="w-4 h-4" /> Copy Payload
                  </button>
                  <button
                    onClick={downloadPNG}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-200 hover:bg-green-300 text-green-800 text-sm"
                  >
                    <Download className="w-4 h-4" /> PNG
                  </button>
                  <button
                    onClick={downloadSVG}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-200 hover:bg-green-300 text-green-800 text-sm"
                  >
                    <Download className="w-4 h-4" /> SVG
                  </button>
                </div>

                <div className="mt-3 w-full text-xs text-green-600 text-center">
                  <div className="font-medium">{batchId}</div>
                  <div className="mt-1">
                    Issued: {new Date(issuedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick stats */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-green-100 border border-green-200 text-center shadow-sm">
                <div className="text-xs text-green-500">Collector</div>
                <div className="mt-1 font-semibold text-green-700">
                  {collector}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-green-100 border border-green-200 text-center shadow-sm">
                <div className="text-xs text-green-500">Species</div>
                <div className="mt-1 font-semibold text-green-700">
                  {species.split("(")[0].trim()}
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Form & map */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white border border-green-200 shadow-md rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-green-500 to-green-400">
                    Batch Details
                  </h3>

                  <p className="text-sm text-green-600 mt-1">
                    Edit fields and regenerate the on-chain payload instantly.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 text-sm"
                  >
                    {expanded ? "Collapse" : "Expand"}
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-green-600">Batch ID</label>
                    <Input
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      className="mt-2 bg-green-50 text-green-800 border border-green-200"
                    />

                    <label className="text-xs text-green-600 mt-4 block">
                      Collector
                    </label>
                    <Input
                      value={collector}
                      onChange={(e) => setCollector(e.target.value)}
                      className="mt-2 bg-green-50 text-green-800 border border-green-200"
                    />

                    <label className="text-xs text-green-600 mt-4 block">
                      Species
                    </label>
                    <Input
                      value={species}
                      onChange={(e) => setSpecies(e.target.value)}
                      className="mt-2 bg-green-50 text-green-800 border border-green-200"
                    />

                    <label className="text-xs text-green-600 mt-4 block">
                      Issued At
                    </label>
                    <Input
                      value={issuedAt}
                      onChange={(e) => setIssuedAt(e.target.value)}
                      className="mt-2 bg-green-50 text-green-800 border border-green-200"
                    />

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={generateToken}
                        className="flex-1 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold"
                      >
                        <Zap className="w-4 h-4" /> Regenerate Token
                      </button>
                      <button
                        onClick={() => {
                          setBatchId(`BATCH-${Date.now()}`);
                          setIssuedAt(new Date().toISOString());
                          generateToken();
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700"
                      >
                        <PlusCircle className="w-4 h-4" /> New ID
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-green-600">
                      Geo (Latitude)
                    </label>
                    <Input
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      className="mt-2 bg-green-50 text-green-800 border border-green-200"
                    />

                    <label className="text-xs text-green-600 mt-4 block">
                      Geo (Longitude)
                    </label>
                    <Input
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      className="mt-2 bg-green-50 text-green-800 border border-green-200"
                    />

                    <label className="text-xs text-green-600 mt-4 block">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-2 w-full bg-green-50 text-green-800 border border-green-200 rounded-lg p-3 text-sm h-24 resize-none"
                    />

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={openMaps}
                        className="flex-1 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700"
                      >
                        <MapPin className="w-4 h-4" /> Open in Maps
                      </button>
                      <button
                        onClick={() => {
                          setLat("");
                          setLng("");
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700"
                      >
                        <Trash className="w-4 h-4" /> Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline / provenance preview */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-green-800">
                  Provenance Snapshot
                </h4>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 shadow-sm">
                    <div className="text-xs text-green-600">Collection</div>
                    <div className="mt-1 font-medium text-green-700">
                      {collector}
                    </div>
                    <div className="text-xs mt-1 text-green-500">
                      {new Date(issuedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 shadow-sm">
                    <div className="text-xs text-green-600">Processing</div>
                    <div className="mt-1 font-medium text-green-700">
                      Drying · Grinding
                    </div>
                    <div className="text-xs mt-1 text-green-500">
                      Batch Ready
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 shadow-sm">
                    <div className="text-xs text-green-600">Quality</div>
                    <div className="mt-1 font-medium text-green-700">
                      Moisture & Pesticide Checks
                    </div>
                    <div className="text-xs mt-1 text-green-500">
                      Certificate attached
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-sm text-green-600">
                <strong>Payload (FHIR-style preview)</strong>
                <pre className="mt-2 p-3 rounded-lg bg-green-100 text-xs overflow-auto border border-green-200">
                  {token}
                </pre>
              </div>
            </Card>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 text-xs text-green-500">
          Developed for: Blockchain Botanical Traceability · Proof-of-Concept UI
        </div>
      </div>
    </Layout>
  );
}
