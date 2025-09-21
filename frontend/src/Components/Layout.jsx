// Global layout: sidebar (desktop) + topbar + content area. Import in pages with <Layout>.
import React from "react";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "/home";

  return (
    <div className={`min-h-screen flex ${isHome ? "bg-gray-900" : "bg-black"} text-gray-100`}>
      {/* <aside className="hidden md:block w-72 p-6 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700">
        <Sidebar />
      </aside> */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
