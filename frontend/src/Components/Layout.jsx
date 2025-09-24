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
        isHome ? "bg-green-50" : "bg-green-100"
      } text-green-900`}
    >
      {/* <aside className="hidden md:block w-72 p-6 bg-gradient-to-b from-green-200 to-green-300 border-r border-green-300">
        <Sidebar />
      </aside> */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
