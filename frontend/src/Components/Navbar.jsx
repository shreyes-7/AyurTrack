import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Leaf,
  Menu,
  X,
  LayoutDashboard,
  FlaskConical,
  CheckCircle,
  Package,
  QrCode,
  Settings,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import { useApp } from "../context/AppContext";

const navItems = [
  { name: "Home", path: "/" },
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: "Collection",
    path: "/collection",
    icon: <Leaf className="w-5 h-5" />,
  },
  {
    name: "Processing",
    path: "/processing",
    icon: <FlaskConical className="w-5 h-5" />,
  },
  {
    name: "Quality Test",
    path: "/quality",
    icon: <CheckCircle className="w-5 h-5" />,
  },
  { name: "Batch", path: "/batch", icon: <Package className="w-5 h-5" /> },
  { name: "Consumer", path: "/consumer", icon: <QrCode className="w-5 h-5" /> },
  {
    name: "Settings",
    path: "/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { dark, setDark } = useApp();
  const location = useLocation();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleNavigation = () => {
    setIsNavigating(true);
    setIsMobileMenuOpen(false);

    // Reset loading state after a short delay to show the loader
    setTimeout(() => {
      setIsNavigating(false);
    }, 500);
  };
  return (
    <>
      <nav className="sticky top-0 z-50 bg-black/70 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-green-400 font-bold text-xl"
          >
            <Leaf className="w-6 h-6" />
            AyurTrack
          </Link>

          {/* Desktop Nav links */}
          <div className="hidden md:flex gap-6">
            {navItems.map((item, i) => (
              <NavLink
                key={i}
                to={item.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition hover:text-green-400 ${
                    isActive ? "text-green-400" : "text-gray-300"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-gray-300 hover:text-green-400 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          />

          {/* Menu Panel */}
          <div className="fixed top-16 left-0 right-0 bg-gradient-to-b from-gray-900 via-black to-gray-950 border-b border-gray-800 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="p-6">
              {/* App Title */}
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  AyurTrace
                </h1>
                <p className="text-xs text-gray-400">Botanical Traceability</p>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2 mb-6">
                {navItems.map((item, i) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={i}
                      to={item.path}
                      onClick={handleNavigation}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${
                        isActive
                          ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      {item.icon && item.icon}
                      <span className="text-sm font-medium">{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDark(!dark)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium rounded-lg bg-gray-800 hover:bg-gray-700 transition text-gray-300"
              >
                {dark ? (
                  <Sun className="w-4 h-4 text-yellow-400" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-400" />
                )}
                Toggle {dark ? "Light" : "Dark"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg p-6 flex flex-col items-center gap-3 border border-gray-700">
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
            <p className="text-sm text-gray-300">Loading page...</p>
          </div>
        </div>
      )}
    </>
  );
}
