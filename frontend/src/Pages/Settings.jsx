import React, { useState } from "react";
import Card from "../Components/Card";
import Layout from "../Components/Layout";
import { useApp } from "../context/AppContext";
import {
  Sun,
  Moon,
  Trash2,
  Download,
  RefreshCw,
  Bell,
  User,
} from "lucide-react";

export default function Settings() {
  const { queue, clearQueue, dark, setDark } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [userName, setUserName] = useState("Blockchain User");

  function downloadQueue() {
    const blob = new Blob([JSON.stringify(queue, null, 2)], {
      type: "application/json",
    });
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
      <div className="min-h-[calc(100vh-4rem)] bg-green-50 text-green-900 p-6">
        <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-green-500 to-green-400">
          Settings & Utilities
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* App Info & Queue */}
          <Card className="bg-green-100 border border-green-200 shadow-md rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              Offline Queue
            </h2>
            <p className="text-sm text-green-600 mb-3">
              Pending transactions not yet synced to blockchain:
            </p>
            <div className="flex items-center justify-between mb-4">
              <span>
                Queue length: <strong>{queue.length}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={clearQueue}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-400 hover:bg-red-300 transition"
                >
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
                <button
                  onClick={downloadQueue}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-400 hover:bg-green-300 transition"
                >
                  <Download className="w-4 h-4" /> Backup
                </button>
              </div>
            </div>
            <button
              onClick={simulateSync}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 transition"
            >
              <RefreshCw className="w-4 h-4" /> Sync with Blockchain
            </button>
          </Card>

          {/* Appearance & Notifications */}
          <Card className="bg-green-100 border border-green-200 shadow-md rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              Appearance & Alerts
            </h2>

            <div className="flex items-center justify-between mb-4">
              <span>Dark Mode</span>
              <button
                disabled
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-200 cursor-not-allowed"
              >
                <Sun className="w-4 h-4 text-green-700" /> Light
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span>Notifications</span>
              <button
                className={`flex items-center gap-1 px-3 py-2 rounded-lg ${
                  notifications
                    ? "bg-green-500 hover:bg-green-400"
                    : "bg-green-200 hover:bg-green-300"
                } transition`}
              >
                <Bell className="w-4 h-4" /> {notifications ? "On" : "Off"}
              </button>
            </div>
          </Card>

          {/* User Info */}
          <Card className="bg-green-100 border border-green-200 shadow-md rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              User Profile
            </h2>
            <label className="block text-sm text-green-600 mb-1">
              User Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-3 rounded-lg bg-green-50 border border-green-200 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
            />
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 transition">
              <User className="w-4 h-4" /> Update Profile
            </button>
          </Card>

          {/* Advanced Utilities */}
          <Card className="bg-green-100 border border-green-200 shadow-md rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              Advanced Utilities
            </h2>
            <p className="text-sm text-green-600 mb-4">
              Experimental blockchain and app utilities for developers and
              admins.
            </p>
            <button
              onClick={resetApp}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-400 hover:bg-red-300 transition mb-3"
            >
              <Trash2 className="w-4 h-4" /> Reset App Data
            </button>
            <button
              onClick={simulateSync}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 transition"
            >
              <RefreshCw className="w-4 h-4" /> Force Sync Blockchain
            </button>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
