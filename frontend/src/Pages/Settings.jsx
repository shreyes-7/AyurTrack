import React, { useState } from "react";
import Card from "../Components/Card";
import Layout from "../Components/Layout";
import { useApp } from "../context/AppContext";
import { Sun, Moon, Trash2, Download, RefreshCw, Bell, User } from "lucide-react";

export default function Settings() {
  const { queue, clearQueue, dark, setDark } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [userName, setUserName] = useState("Blockchain User");

  function downloadQueue() {
    const blob = new Blob([JSON.stringify(queue, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "offline_queue_backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function resetApp() {
    if (confirm("This will clear all app data (simulation). Continue?")) {
      clearQueue();
      alert("App data reset complete!");
    }
  }

  function simulateSync() {
    alert("Simulating blockchain sync... ✅ Data up-to-date!");
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-black text-slate-100 p-6">
        <h1 className="text-3xl font-bold mb-6 text-cyan-400">Settings & Utilities</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* App Info & Queue */}
          <Card className="bg-gray-900/80 border border-gray-800 shadow-2xl rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Offline Queue</h2>
            <p className="text-sm text-gray-400 mb-3">Pending transactions not yet synced to blockchain:</p>
            <div className="flex items-center justify-between mb-4">
              <span>Queue length: <strong>{queue.length}</strong></span>
              <div className="flex gap-2">
                <button onClick={clearQueue} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition">
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
                <button onClick={downloadQueue} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition">
                  <Download className="w-4 h-4" /> Backup
                </button>
              </div>
            </div>
            <button onClick={simulateSync} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 transition">
              <RefreshCw className="w-4 h-4" /> Sync with Blockchain
            </button>
          </Card>

          {/* Appearance & Notifications */}
          <Card className="bg-gray-900/80 border border-gray-800 shadow-2xl rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Appearance & Alerts</h2>

            <div className="flex items-center justify-between mb-4">
              <span>Dark Mode</span>
              <button onClick={() => setDark(!dark)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
                {dark ? <Moon className="w-4 h-4 text-yellow-400" /> : <Sun className="w-4 h-4 text-cyan-400" />}
                {dark ? "Dark" : "Light"}
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span>Notifications</span>
              <button onClick={() => setNotifications(!notifications)} className={`flex items-center gap-1 px-3 py-2 rounded-lg ${notifications ? "bg-green-600 hover:bg-green-500" : "bg-gray-800 hover:bg-gray-700"} transition`}>
                <Bell className="w-4 h-4" /> {notifications ? "On" : "Off"}
              </button>
            </div>
          </Card>

          {/* User Info */}
          <Card className="bg-gray-900/80 border border-gray-800 shadow-2xl rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">User Profile</h2>
            <label className="block text-sm text-gray-400 mb-1">User Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 mb-4"
            />
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition">
              <User className="w-4 h-4" /> Update Profile
            </button>
          </Card>

          {/* Advanced Utilities */}
          <Card className="bg-gray-900/80 border border-gray-800 shadow-2xl rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Advanced Utilities</h2>
            <p className="text-sm text-gray-400 mb-4">Experimental blockchain and app utilities for developers and admins.</p>
            <button onClick={resetApp} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition mb-3">
              <Trash2 className="w-4 h-4" /> Reset App Data
            </button>
            <button onClick={simulateSync} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 transition">
              <RefreshCw className="w-4 h-4" /> Force Sync Blockchain
            </button>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
