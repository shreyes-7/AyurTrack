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
  LogIn,
  User,
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
    name: "Lab Test",
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

  // Mock authentication state - replace with your actual auth logic
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

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
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-green-100 via-green-50 to-green-100 backdrop-blur-md border-b border-green-200 shadow-md flex items-center justify-between px-6 h-16">
        {/* Logo + Mobile Menu */}
        <div className="flex items-center gap-4">
          {/* Mobile Hamburger */}
          <button
            onClick={toggleMenu}
            className="p-2 text-green-900 hover:text-green-600 transition-colors rounded-md hover:bg-green-100"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-green-700 font-bold text-xl hover:text-green-800 transition-colors"
            onClick={handleLinkClick}
          >
            <Leaf className="w-6 h-6 animate-bounce" />
            AyurTrack
          </Link>
        </div>

        {/* Desktop Nav + Auth */}
        <div className="hidden md:flex items-center gap-3">
          {navItems.map((item, i) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={i}
                to={item.path}
                onClick={handleLinkClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform ${
                  isActive
                    ? "bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg scale-105"
                    : "text-green-900 hover:text-white hover:bg-green-400 hover:scale-105 hover:shadow-md"
                }`}
              >
                {item.icon && (
                  <span className="hidden md:inline-flex w-5 h-5">
                    {item.icon}
                  </span>
                )}
                {item.name}
              </NavLink>
            );
          })}

          {/* Auth Section - Desktop */}
          <div className="ml-4 pl-4 border-l border-green-300">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {user?.name || "User"}
                  </span>
                </div>
                <button
                  onClick={() => setIsAuthenticated(false)}
                  className="px-3 py-2 text-sm font-medium text-green-700 hover:text-red-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-medium transition-all duration-300 transform hover:from-green-600 hover:to-green-700 hover:scale-105 hover:shadow-lg"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Slide */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 w-full bg-white/80 backdrop-blur-md border-t border-green-200 md:hidden flex flex-col items-start p-4 gap-2 shadow-lg animate-slideDown">
            {navItems.map((item, i) => (
              <NavLink
                key={i}
                to={item.path}
                onClick={() => {
                  handleLinkClick();
                  toggleMenu();
                }}
                className={`w-full px-4 py-2 rounded-lg text-green-900 hover:text-white hover:bg-green-400 transition-all duration-200`}
              >
                {item.name}
              </NavLink>
            ))}
            
            {/* Mobile Auth */}
            <div className="w-full border-t border-green-200 pt-2 mt-2">
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {user?.name || "User"}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsAuthenticated(false)}
                    className="w-full px-4 py-2 text-left text-green-900 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => {
                    handleLinkClick();
                    toggleMenu();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:from-green-600 hover:to-green-700"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Sidebar / Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-green-50/50 backdrop-blur-sm z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleLinkClick}
            />

            {/* Sidebar */}
            <motion.div
              ref={sidebarRef}
              className="fixed top-0 left-0 h-full bg-green-100 border-r border-green-200 z-50 p-6
                 w-64 md:w-80 lg:w-64"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={sidebarVariants}
            >
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-green-700 hover:text-red-400 transition"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  AyurTrack
                </h1>
                <p className="text-xs text-green-700">Botanical Traceability</p>
              </div>

              {/* User Section in Sidebar */}
              {isAuthenticated && (
                <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-green-600">
                        {user?.role || "Member"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <nav className="flex flex-col gap-2">
                {navItems.map((item, i) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={i}
                      to={item.path}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${
                        isActive
                          ? "bg-gradient-to-r from-green-400 to-green-600 text-white shadow-md"
                          : "text-green-900 hover:text-white hover:bg-green-200"
                      }`}
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.name}</span>
                    </NavLink>
                  );
                })}

                {/* Auth in Sidebar */}
                {isAuthenticated ? (
                  <button
                    onClick={() => setIsAuthenticated(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg bg-red-50 hover:bg-red-100 transition text-red-700 mt-4"
                  >
                    <LogIn className="w-4 h-4 rotate-180" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:from-green-600 hover:to-green-700 transition mt-4"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign In</span>
                  </Link>
                )}

                {/* Dark mode toggle */}
                <button
                  onClick={() => setDark(!dark)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg bg-green-200 hover:bg-green-300 transition text-green-900 mt-2"
                >
                  {dark ? (
                    <Sun className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="text-sm font-medium">
                    {dark ? "Light Mode" : "Dark Mode"}
                  </span>
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
