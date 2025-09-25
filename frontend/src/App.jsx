import React, { Suspense, lazy, createContext, useContext, useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import ScrollToTop from "./Components/ScrollToTop";
import About from "./Pages/AboutPage";

// Create Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing auth data on app start
    const storedUser = localStorage.getItem('ayurtrack_user');
    const storedTokens = localStorage.getItem('ayurtrack_tokens');
    
    if (storedUser && storedTokens) {
      try {
        const userData = JSON.parse(storedUser);
        const tokenData = JSON.parse(storedTokens);
        
        // Check if token is still valid
        if (new Date(tokenData.access.expires) > new Date()) {
          setUser(userData);
        } else {
          // Token expired, clear localStorage
          localStorage.removeItem('ayurtrack_user');
          localStorage.removeItem('ayurtrack_tokens');
        }
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        localStorage.removeItem('ayurtrack_user');
        localStorage.removeItem('ayurtrack_tokens');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, tokens) => {
    // Store user data and tokens in localStorage
    localStorage.setItem('ayurtrack_user', JSON.stringify(userData));
    localStorage.setItem('ayurtrack_tokens', JSON.stringify(tokens));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ayurtrack_user');
    localStorage.removeItem('ayurtrack_tokens');
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const hasRole = (requiredRoles) => {
    if (!user || !user.role) return false;
    if (typeof requiredRoles === 'string') {
      return user.role === requiredRoles;
    }
    return requiredRoles.includes(user.role);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    hasRole,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [], allowPublic = false }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="text-center p-10">Loading authentication...</div>;
  }

  // If route allows public access, render without auth check
  if (allowPublic) {
    return children;
  }

  if (!isAuthenticated()) {
    // Redirect to login with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    // User is authenticated but doesn't have required role
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Lazy load pages
const Home = lazy(() => import("./Pages/Home"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const CollectionEvent = lazy(() => import("./Pages/CollectionEvent"));
const ProcessingStep = lazy(() => import("./Pages/ProcessingStep"));
const QualityTest = lazy(() => import("./Pages/QualityTest"));
const BatchLabel = lazy(() => import("./Pages/BatchLabel"));
const ConsumerPortal = lazy(() => import("./Pages/ConsumerPortal"));
const NotFound = lazy(() => import("./Pages/NotFound"));
const AdminDashboard = lazy(() => import("./Pages/AdminDashboard"));
const AddHerb = lazy(() => import("./Pages/AddHerb"));
const CreateUser = lazy(() => import("./Pages/CreateUser"));
const Login = lazy(() => import("./Pages/Login"));

// Create Unauthorized component
const Unauthorized = lazy(() => Promise.resolve({
  default: () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
        <h1 className="text-2xl font-bold text-red-800 mb-4">Access Denied</h1>
        <p className="text-red-600 mb-4">You don't have permission to access this page.</p>
        <button
          onClick={() => window.history.back()}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}));

// Role-based route configuration
const getRouteConfig = () => [
  // Public routes (accessible without authentication)
  { path: "/", component: Home, allowPublic: true },
  { path: "/home", component: Home, allowPublic: true },
  { path: "/about", component: About, allowPublic: true },
  { path: "/login", component: Login, allowPublic: true },
  { path: "/consumer", component: ConsumerPortal, allowPublic: true },
  
  // Protected routes - General (any authenticated user)
  { path: "/home", component: Dashboard, roles: [] },
  
  // Farmer routes
  { path: "/collection", component: CollectionEvent, roles: ["farmer"] },
  
  
  // Manufacturer/Processor routes
  { path: "/processing", component: ProcessingStep, roles: ["processor"] },
  { path: "/quality", component: QualityTest, roles: ["lab"] },
  { path: "/batch", component: BatchLabel, roles: ["manufacturer"] },
  
  // Admin routes
  { path: "/admin", component: AdminDashboard, roles: ["admin"] },
  { path: "/admin-dashboard", component: AdminDashboard, roles: ["admin"] },
  { path: "/add-herb", component: AddHerb, roles: ["admin"] },
  { path: "/create-user", component: CreateUser, roles: ["admin"] },
  
  // Special routes
  { path: "/unauthorized", component: Unauthorized, allowPublic: true },
  { path: "*", component: NotFound, allowPublic: true }
];

export default function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <ScrollToTop />
        <main className="flex-grow">
          <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
            <Routes>
              {getRouteConfig().map((route, index) => {
                const Component = route.component;
                return (
                  <Route
                    key={index}
                    path={route.path}
                    element={
                      <ProtectedRoute 
                        requiredRoles={route.roles || []} 
                        allowPublic={route.allowPublic || false}
                      >
                        <Component />
                      </ProtectedRoute>
                    }
                  />
                );
              })}
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
