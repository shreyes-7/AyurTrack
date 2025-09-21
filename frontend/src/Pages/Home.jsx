import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, TestTube2, Boxes, QrCode, Users } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: <Leaf className="w-8 h-8 text-green-400" />,
    title: "Raw Herb Collection",
    description: "Track Ayurvedic herbs right from farmers with GPS + offline logging.",
    link: "/collection",
  },
  {
    icon: <TestTube2 className="w-8 h-8 text-purple-400" />,
    title: "Processing & Testing",
    description: "Ensure GMP-certified handling and FHIR-compliant test records.",
    link: "/processing",
  },
  {
    icon: <Boxes className="w-8 h-8 text-blue-400" />,
    title: "Batch Tracking",
    description: "Create immutable QR-coded batches stored on blockchain.",
    link: "/batch",
  },
  {
    icon: <QrCode className="w-8 h-8 text-yellow-400" />,
    title: "Consumer Portal",
    description: "Scan a QR and verify product origin, safety & quality instantly.",
    link: "/consumer",
  },
  {
    icon: <Users className="w-8 h-8 text-pink-400" />,
    title: "Multi-role Access",
    description: "Separate logins for farmers, processors, testers, hospitals & patients.",
    link: "/home",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-950 text-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 bg-clip-text text-transparent"
          >
            AyurTrack
          </motion.h1>
          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Blockchain-powered end-to-end traceability for Ayurvedic medicines — from farm to consumer trust.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-10 flex justify-center"
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 text-lg font-medium rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90 transition"
            >
              Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative bg-gray-950/60 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="bg-gray-800/60 backdrop-blur rounded-2xl shadow-lg p-6 border border-gray-700 hover:border-green-400 transition"
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-gray-400">{f.description}</p>
                <Link
                  to={f.link}
                  className="mt-4 inline-flex items-center text-green-400 hover:text-green-300"
                >
                  Explore <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      
    </div>
  );
}
