import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";

// Lazy load pages
const Home = lazy(() => import("./Pages/Home"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const CollectionEvent = lazy(() => import("./Pages/CollectionEvent"));
const ProcessingStep = lazy(() => import("./Pages/ProcessingStep"));
const QualityTest = lazy(() => import("./Pages/QualityTest"));
const BatchLabel = lazy(() => import("./Pages/BatchLabel"));
const ConsumerPortal = lazy(() => import("./Pages/ConsumerPortal"));
const Settings = lazy(() => import("./Pages/Settings"));
const NotFound = lazy(() => import("./Pages/NotFound"));

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/collection" element={<CollectionEvent />} />
            <Route path="/processing" element={<ProcessingStep />} />
            <Route path="/quality" element={<QualityTest />} />
            <Route path="/batch" element={<BatchLabel />} />
            <Route path="/consumer" element={<ConsumerPortal />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
