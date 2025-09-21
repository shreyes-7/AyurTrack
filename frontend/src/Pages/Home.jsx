import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, TestTube2, Boxes, QrCode, Users, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: <Leaf className="w-8 h-8 text-cyan-400" />, title: "Raw Herb Collection", description: "Track Ayurvedic herbs from farmers and wild collectors with GPS + offline logging.", link: "/collection" },
  { icon: <TestTube2 className="w-8 h-8 text-purple-400" />, title: "Processing & Quality Test", description: "GMP-certified handling with FHIR-compliant test records and smart contract enforcement.", link: "/processing" },
  { icon: <Boxes className="w-8 h-8 text-blue-400" />, title: "Batch Tracking", description: "Generate immutable blockchain-backed batches with unique QR codes.", link: "/batch" },
  { icon: <QrCode className="w-8 h-8 text-yellow-400" />, title: "Consumer Verification", description: "Scan QR codes to instantly verify origin, quality, and sustainability.", link: "/consumer" },
  { icon: <Users className="w-8 h-8 text-pink-400" />, title: "Multi-role Access", description: "Separate logins for farmers, processors, testers, hospitals & consumers.", link: "/home" },
];

const stats = [
  { label: "Herbs Tracked", value: "120+" },
  { label: "Collection Points", value: "35" },
  { label: "Lab Tests Done", value: "210+" },
  { label: "Consumers Engaged", value: "500+" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1 initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            AyurTrack
          </motion.h1>
          <motion.p initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1 }}
            className="mt-4 text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Blockchain-powered traceability for Ayurvedic herbs — from collection to consumer trust.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            className="mt-8 flex justify-center flex-wrap gap-6">
            <Link to="/dashboard"
              className="inline-flex items-center px-6 py-3 text-lg font-medium rounded-3xl bg-gradient-to-r from-gray-800 to-gray-900 hover:scale-105 hover:opacity-90 transition duration-300">
              Dashboard <ArrowRight className="ml-2 w-5 h-5 text-cyan-400" />
            </Link>
            <Link to="/consumer"
              className="inline-flex items-center px-6 py-3 text-lg font-medium rounded-3xl bg-gray-900 border border-gray-700 hover:border-cyan-400 hover:scale-105 transition duration-300">
              Consumer Portal <QrCode className="ml-2 w-5 h-5 text-yellow-400" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-gray-900/40 backdrop-blur-lg border border-gray-800 shadow-lg">
                <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
                <div className="mt-1 text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative bg-black py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-cyan-400 mb-10">Core Features</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
                className="bg-gray-900/60 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-gray-800 hover:border-cyan-400 hover:scale-105 transition duration-300">
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-gray-400 text-sm">{f.description}</p>
                <Link to={f.link} className="mt-4 inline-flex items-center text-cyan-400 hover:text-cyan-300 font-medium">
                  Explore <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action */}
      <section className="bg-gradient-to-r from-gray-900/70 to-black/80 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-4">
            Transparency & Provenance
          </h2>
          <p className="text-gray-400 mb-6">
            Empower consumers and stakeholders with blockchain-backed proof of provenance for every Ayurvedic herb.
          </p>
          <Link to="/consumer"
            className="inline-flex items-center px-6 py-3 text-lg font-medium rounded-3xl bg-gradient-to-r from-gray-800 to-gray-900 hover:scale-105 hover:opacity-90 transition duration-300">
            Verify a QR Code <ShieldCheck className="ml-2 w-5 h-5 text-yellow-400" />
          </Link>
        </div>
      </section>
    </div>
  );
}
