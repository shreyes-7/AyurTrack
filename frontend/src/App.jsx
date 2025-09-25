import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import ScrollToTop from "./Components/ScrollToTop";
import About from "./Pages/AboutPage";

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
const Login = lazy(() => import("./Pages/Login")); // Add this line

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <ScrollToTop />
      <main className="flex-grow">
        <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} /> {/* Add this line */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/collection" element={<CollectionEvent />} />
            <Route path="/processing" element={<ProcessingStep />} />
            <Route path="/quality" element={<QualityTest />} />
            <Route path="/batch" element={<BatchLabel />} />
            <Route path="/consumer" element={<ConsumerPortal />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/add-herb" element={<AddHerb />} />
            <Route path="/create-user" element={<CreateUser />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
