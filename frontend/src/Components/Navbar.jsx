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
  Shield,
  Info,
  LogIn,
  User,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* Nav items */
const navItems = [
  { name: "Home", path: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: "Collection", path: "/collection", icon: <Leaf className="w-5 h-5" /> },
  { name: "Processing", path: "/processing", icon: <FlaskConical className="w-5 h-5" /> },
  { name: "Lab Test", path: "/quality", icon: <CheckCircle className="w-5 h-5" /> },
  { name: "Batch", path: "/batch", icon: <Package className="w-5 h-5" /> },
  { name: "Admin", path: "/admin", icon: <Shield className="w-5 h-5" /> },
  { name: "About", path: "/about", icon: <Info className="w-5 h-5" /> },
];

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const sidebarRef = useRef(null);
  const profileRef = useRef(null);

  // Mock auth - replace with your actual auth logic
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({ name: "Abhinav Pandey", role: "Operator" });

  useEffect(() => {
    // close sidebar/profile on route change
    setIsSidebarOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsSidebarOpen(false);
      }
      if (isProfileOpen && profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen, isProfileOpen]);

  const sidebarVariants = {
    hidden: { x: "-100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { x: "-100%", opacity: 0, transition: { duration: 0.16 } },
  };

  const profileMenuVariants = {
    hidden: { y: -6, opacity: 0, scale: 0.98 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.12 } },
    exit: { y: -6, opacity: 0, scale: 0.98, transition: { duration: 0.1 } },
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Left: Hamburger + Brand */}
            <div className="flex items-center gap-3">
              <button
                aria-label="Toggle menu"
                onClick={() => setIsSidebarOpen((s) => !s)}
                className="p-2 rounded-md hover:bg-slate-100 active:scale-95 transition"
              >
                {isSidebarOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
              </button>

              <Link
                to="/"
                className="flex items-center gap-2 text-slate-800 font-semibold text-lg hover:opacity-95"
                aria-label="Go to home"
              >
                <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-400 shadow-md">
                  <Leaf className="w-5 h-5 text-white" />
                </span>
                <span className="hidden sm:inline-block">AyurTrack</span>
              </Link>
            </div>

            {/* Center: Desktop nav (minimal) */}
            <div className="hidden md:flex items-center gap-3">
              {navItems.map((item, idx) => (
                <NavLink
                  key={idx}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-emerald-500 text-white shadow"
                        : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    }`
                  }
                >
                  <span className="w-4 h-4">{item.icon}</span>
                  <span className="hidden lg:inline">{item.name}</span>
                </NavLink>
              ))}
            </div>

            {/* Right: Auth */}
            <div className="flex items-center gap-3">
              <div className="relative" ref={profileRef}>
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => setIsProfileOpen((s) => !s)}
                      aria-haspopup="true"
                      aria-expanded={isProfileOpen}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="hidden sm:flex flex-col items-start leading-tight">
                        <span className="text-sm font-medium text-slate-800">{user.name}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition ${isProfileOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={profileMenuVariants}
                          className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-md shadow-lg py-2 z-50"
                        >
                          <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-500" />
                              <span>Profile</span>
                            </div>
                          </Link>

                          

                          <button
                            onClick={() => {
                              setIsAuthenticated(false);
                              setIsProfileOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                          >
                            <div className="flex items-center gap-2">
                              <LogOut className="w-4 h-4" />
                              <span>Sign out</span>
                            </div>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-medium shadow"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
            />

            <motion.aside
              ref={sidebarRef}
              className="fixed top-0 left-0 h-full z-50 w-72 bg-white border-r border-slate-200 p-6 overflow-auto"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={sidebarVariants}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-400">
                      <Leaf className="w-5 h-5 text-white" />
                    </span>
                    AyurTrack
                  </h2>
                  <p className="text-xs text-slate-500">Botanical Traceability</p>
                </div>

                <button
                  aria-label="Close menu"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-md hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5 text-slate-700" />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                {navItems.map((item, idx) => (
                  <NavLink
                    key={idx}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                        isActive ? "bg-emerald-100 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                      }`
                    }
                  >
                    <span className="w-5 h-5">{item.icon}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="mt-6 border-t border-slate-100 pt-4">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.role}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsAuthenticated(false);
                        setIsSidebarOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500 text-white w-full justify-center"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
