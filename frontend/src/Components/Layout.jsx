// Global layout: sidebar (desktop) + topbar + content area. Import in pages with <Layout>.
import React from "react";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "/home";

  return (
    <div
      className={`min-h-screen flex ${
        isHome 
          ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" 
          : "bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50"
      } text-gray-800`}
    >
      {/* Optional Sidebar - Currently commented out */}
      {/* <aside className="hidden md:block w-72 p-6 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 shadow-sm">
        <Sidebar />
      </aside> */}
      
      <div className="flex-1">
        

        {/* Main content area */}
        <main className="relative">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
