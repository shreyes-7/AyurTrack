import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Leaf,
  FlaskConical,
  CheckCircle,
  Package,
  QrCode,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Sidebar() {
  const { dark, setDark } = useApp();
  const location = useLocation();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: "/collection", label: "Collection Event", icon: <Leaf className="w-5 h-5" /> },
    { to: "/processing", label: "Processing", icon: <FlaskConical className="w-5 h-5" /> },
    { to: "/quality", label: "Quality Test", icon: <CheckCircle className="w-5 h-5" /> },
    { to: "/batch", label: "Batch Label", icon: <Package className="w-5 h-5" /> },
    { to: "/consumer", label: "Consumer Portal", icon: <QrCode className="w-5 h-5" /> },
    { to: "/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="h-screen w-64 bg-gradient-to-b from-gray-900 via-black to-gray-950 border-r border-gray-800 flex flex-col justify-between">
      {/* Top Logo + Nav */}
      <div className="p-6">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          AyurTrace
        </h1>
        <p className="text-xs text-gray-400 mb-8">Botanical Traceability</p>

        <nav className="space-y-2">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  active
                    ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {link.icon}
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Dark Mode Toggle */}
      <div className="p-6">
        <button
          onClick={() => setDark(!dark)}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 hover:bg-gray-700 transition text-gray-300"
        >
          {dark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          Toggle {dark ? "Light" : "Dark"}
        </button>
      </div>
    </aside>
  );
}
