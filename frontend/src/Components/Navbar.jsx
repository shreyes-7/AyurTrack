import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Leaf,
  Menu,
  X,
  LayoutDashboard,
  FlaskConical,
  CheckCircle,
  Package,
  Settings,
  Sun,
  Moon,
  Shield,
  Info,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Home", path: "/" },
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
  {
    name: "Settings",
    path: "/settings",
    icon: <Settings className="w-5 h-5" />,
  },
  { name: "Admin", path: "/admin", icon: <Shield className="w-5 h-5" /> },
  { name: "About", path: "/about", icon: <Info className="w-5 h-5" /> },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { dark, setDark } = useApp();
  const location = useLocation();
  const sidebarRef = useRef();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleLinkClick = () => setIsMenuOpen(false);

  const sidebarVariants = {
    hidden: { x: "-100%", opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: { x: "-100%", opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-black/70 backdrop-blur-lg border-b border-gray-800 flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMenu}
            className="p-2 text-gray-300 hover:text-green-400 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 text-green-400 font-bold text-xl"
            onClick={handleLinkClick}
          >
            <Leaf className="w-6 h-6" />
            AyurTrack
          </Link>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-4">
          {navItems.map((item, i) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={i}
                to={item.path}
                onClick={handleLinkClick}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                {item.name}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Sidebar / Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleLinkClick} // click outside closes
            />

            {/* Sidebar */}
            <motion.div
              ref={sidebarRef}
              className="fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 z-50 p-6
                   w-64 md:w-80 lg:w-64" // smaller width for large screens
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={sidebarVariants}
            >
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-400 transition"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  AyurTrack
                </h1>
                <p className="text-xs text-gray-400">Botanical Traceability</p>
              </div>

              <nav className="flex flex-col gap-2">
                {navItems.map((item, i) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={i}
                      to={item.path}
                      onClick={handleLinkClick} // close sidebar on link click
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${
                        isActive
                          ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.name}</span>
                    </NavLink>
                  );
                })}

                {/* Dark mode inside sidebar */}
                <button
                  onClick={() => setDark(!dark)}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-gray-300 mt-4"
                >
                  {dark ? (
                    <Sun className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-blue-400" />
                  )}
                  {dark ? "Light" : "Dark"}
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
