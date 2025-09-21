import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Leaf } from "lucide-react";

const navItems = [
  { name: "Home", path: "/" },
  { name: "Dashboard", path: "/dashboard" },
  { name: "Collection", path: "/collection" },
  { name: "Processing", path: "/processing" },
  { name: "Quality Test", path: "/quality" },
  { name: "Batch", path: "/batch" },
  { name: "Consumer", path: "/consumer" },
  { name: "Settings", path: "/settings" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black/70 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-green-400 font-bold text-xl">
          <Leaf className="w-6 h-6" />
          AyurTrace
        </Link>

        {/* Nav links */}
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
      </div>
    </nav>
  );
}
