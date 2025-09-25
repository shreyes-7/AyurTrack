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
      {/* Light background with subtle gradient */}
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-white p-8 text-gray-900">
        <h1 className="text-4xl font-extrabold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600">
          Settings & Utilities
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card with clean look */}
          <Card className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transform transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-4 text-purple-700">
              Offline Queue
            </h2>
            <p className="text-base text-gray-600 mb-6">
              Pending transactions not yet synced to blockchain:
            </p>
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg">
                Queue length:{" "}
                <strong className="text-purple-800">{queue.length}</strong>
              </span>
              <div className="flex gap-3">
                <button
                  onClick={clearQueue}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-400 active:scale-95 transition"
                >
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
                <button
                  onClick={downloadQueue}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-white hover:bg-cyan-400 active:scale-95 transition"
                >
                  <Download className="w-4 h-4" /> Backup
                </button>
              </div>
            </div>
            <button
              onClick={simulateSync}
              className="flex items-center gap-3 px-5 py-3 text-base rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90 active:scale-95 transition shadow"
            >
              <RefreshCw className="w-5 h-5" /> Sync with Blockchain
            </button>
          </Card>

          {/* Appearance & Alerts */}
          <Card className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transform transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-6 text-purple-700">
              Appearance & Alerts
            </h2>

            <div className="flex items-center justify-between mb-6">
              <span className="text-lg">Dark Mode</span>
              <button
                onClick={() => setDark(!dark)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
              >
                {dark ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
                {dark ? "Dark" : "Light"}
              </button>
            </div>

            <div className="flex items-center justify-between mb-6">
              <span className="text-lg">Notifications</span>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white transition ${
                  notifications
                    ? "bg-cyan-500 hover:bg-cyan-400"
                    : "bg-gray-400 hover:bg-gray-500"
                }`}
              >
                <Bell className="w-5 h-5" />
                {notifications ? "On" : "Off"}
              </button>
            </div>
          </Card>

          {/* User Profile */}
          <Card className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transform transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-6 text-purple-700">
              User Profile
            </h2>
            <label className="block text-sm text-gray-600 mb-2">
              User Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-3 mb-6 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
            />
            <button className="flex items-center gap-2 px-5 py-3 rounded-xl text-base bg-cyan-500 text-white hover:bg-cyan-400 active:scale-95 transition shadow">
              <User className="w-5 h-5" /> Update Profile
            </button>
          </Card>

          {/* Advanced Utilities */}
          <Card className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transform transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-4 text-purple-700">
              Advanced Utilities
            </h2>
            <p className="text-base text-gray-600 mb-6">
              Experimental blockchain and app utilities for developers and
              admins.
            </p>
            <button
              onClick={resetApp}
              className="flex items-center gap-3 px-5 py-3 mb-4 rounded-xl bg-red-500 text-white hover:bg-red-400 active:scale-95 transition shadow"
            >
              <Trash2 className="w-5 h-5" /> Reset App Data
            </button>
            <button className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90 active:scale-95 transition shadow">
              <RefreshCw className="w-5 h-5" /> Force Sync Blockchain
            </button>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
