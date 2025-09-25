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
  Shield,
  Plus,
  UserPlus,
  Search,
  ShoppingCart,
  BarChart3,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext"; // Updated import path

export default function Sidebar() {
  const { user, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  // Define role-based navigation links
  const getRoleBasedLinks = () => {
    if (!isAuthenticated()) {
      // Public links for unauthenticated users
      return [
        {
          to: "/",
          label: "Home",
          icon: <LayoutDashboard className="w-5 h-5" />,
          roles: []
        },
        {
          to: "/consumer",
          label: "Track Product",
          icon: <QrCode className="w-5 h-5" />,
          roles: []
        }
      ];
    }

    // Base links for all authenticated users
    const baseLinks = [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard className="w-5 h-5" />,
        roles: ["farmer", "manufacturer", "processor", "distributor", "retailer", "admin", "quality_controller", "consumer"]
      }
    ];

    // Role-specific links
    const roleLinks = [];

    // Farmer links
    if (hasRole(['farmer'])) {
      roleLinks.push(
        {
          to: "/collection",
          label: "Collection Event",
          icon: <Leaf className="w-5 h-5" />,
          roles: ["farmer"]
        },
        {
          to: "/add-herb",
          label: "Add Herb",
          icon: <Plus className="w-5 h-5" />,
          roles: ["farmer"]
        }
      );
    }

    // Manufacturer/Processor links
    if (hasRole(['manufacturer', 'processor'])) {
      roleLinks.push(
        {
          to: "/processing",
          label: "Processing",
          icon: <FlaskConical className="w-5 h-5" />,
          roles: ["manufacturer", "processor"]
        },
        {
          to: "/batch",
          label: "Batch Label",
          icon: <Package className="w-5 h-5" />,
          roles: ["manufacturer", "processor"]
        }
      );
    }

    // Quality Control links
    if (hasRole(['manufacturer', 'processor', 'quality_controller'])) {
      roleLinks.push({
        to: "/quality",
        label: "Quality Test",
        icon: <CheckCircle className="w-5 h-5" />,
        roles: ["manufacturer", "processor", "quality_controller"]
      });
    }

    // Distributor/Retailer links
    if (hasRole(['distributor', 'retailer'])) {
      roleLinks.push(
        {
          to: "/inventory",
          label: "Inventory",
          icon: <ShoppingCart className="w-5 h-5" />,
          roles: ["distributor", "retailer"]
        },
        {
          to: "/analytics",
          label: "Analytics",
          icon: <BarChart3 className="w-5 h-5" />,
          roles: ["distributor", "retailer"]
        }
      );
    }

    // Admin links
    if (hasRole(['admin'])) {
      roleLinks.push(
        {
          to: "/admin",
          label: "Admin Panel",
          icon: <Shield className="w-5 h-5" />,
          roles: ["admin"]
        },
        {
          to: "/create-user",
          label: "Create User",
          icon: <UserPlus className="w-5 h-5" />,
          roles: ["admin"]
        },
        {
          to: "/user-management",
          label: "Manage Users",
          icon: <Users className="w-5 h-5" />,
          roles: ["admin"]
        }
      );
    }

    // Common links for all authenticated users
    const commonLinks = [
      {
        to: "/consumer",
        label: "Consumer Portal",
        icon: <QrCode className="w-5 h-5" />,
        roles: ["farmer", "manufacturer", "processor", "distributor", "retailer", "admin", "quality_controller", "consumer"]
      },
      {
        to: "/track",
        label: "Track Products",
        icon: <Search className="w-5 h-5" />,
        roles: ["farmer", "manufacturer", "processor", "distributor", "retailer", "admin", "quality_controller", "consumer"]
      },
      {
        to: "/settings",
        label: "Settings",
        icon: <Settings className="w-5 h-5" />,
        roles: ["farmer", "manufacturer", "processor", "distributor", "retailer", "admin", "quality_controller", "consumer"]
      }
    ];

    return [...baseLinks, ...roleLinks, ...commonLinks];
  };

  // Get filtered links based on authentication and roles
  const links = getRoleBasedLinks();

  // Dark mode functionality (you might want to move this to a separate context)
  const [dark, setDark] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [dark]);

  return (
    <aside className={`h-screen w-64 ${dark ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-b from-green-50 via-green-100 to-green-200 border-green-200'} border-r flex flex-col justify-between transition-colors duration-200`}>
      {/* Top Logo + User Info + Nav */}
      <div className="p-6">
        {/* Logo */}
        <div className="mb-6">
          <h1 className={`text-2xl font-extrabold ${dark ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-green-400 to-green-600'} bg-clip-text text-transparent`}>
            AyurTrack
          </h1>
          <p className={`text-xs ${dark ? 'text-gray-400' : 'text-green-700'} mb-2`}>
            Botanical Traceability
          </p>
        </div>

        {/* User Info */}
        {isAuthenticated() && user && (
          <div className={`mb-6 p-3 rounded-lg ${dark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/50 border border-green-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-green-900'}`}>
                  {user.name || 'User'}
                </p>
                <p className={`text-xs capitalize ${dark ? 'text-green-400' : 'text-green-600'}`}>
                  {user.role || 'User'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-2">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-green-400 to-green-600 text-white shadow-md transform scale-[1.02]"
                    : dark
                    ? "text-gray-300 hover:text-white hover:bg-gray-700/50"
                    : "text-green-900 hover:text-white hover:bg-green-200"
                }`}
                title={link.label}
              >
                {link.icon}
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-6 space-y-3">
        {/* Role Badge */}
        {isAuthenticated() && user?.role && (
          <div className={`text-center p-2 rounded-lg ${dark ? 'bg-gray-800/50' : 'bg-green-100'}`}>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${dark ? 'bg-green-900 text-green-300' : 'bg-green-200 text-green-800'}`}>
              {user.role.toUpperCase()} ACCESS
            </span>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDark(!dark)}
          className={`flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            dark 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
              : 'bg-green-200 hover:bg-green-300 text-green-900'
          }`}
          title={`Switch to ${dark ? 'Light' : 'Dark'} Mode`}
        >
          {dark ? (
            <Sun className="w-4 h-4 text-yellow-400" />
          ) : (
            <Moon className="w-4 h-4 text-blue-500" />
          )}
          <span>Toggle {dark ? "Light" : "Dark"}</span>
        </button>

        {/* Version Info */}
        <div className={`text-center text-xs ${dark ? 'text-gray-500' : 'text-green-600'}`}>
          v2.1.0 - Blockchain Enabled
        </div>
      </div>
    </aside>
  );
}
