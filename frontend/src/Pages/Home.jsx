import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Leaf,
  TestTube2,
  Boxes,
  QrCode,
  Users,
  ShieldCheck,
  LayoutDashboard,
  Shield,
  LogIn,
} from "lucide-react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";

const features = [
  {
    icon: <Leaf className="w-8 h-8 text-cyan-400" />,
    title: "Raw Herb Collection",
    description:
      "Track Ayurvedic herbs from farmers and wild collectors with GPS + offline logging.",
    link: "/collection",
  },
  {
    icon: <TestTube2 className="w-8 h-8 text-purple-400" />,
    title: "Processing & Quality Test",
    description:
      "GMP-certified handling with FHIR-compliant test records and smart contract enforcement.",
    link: "/processing",
  },
  {
    icon: <Boxes className="w-8 h-8 text-blue-400" />,
    title: "Batch Tracking",
    description:
      "Generate immutable blockchain-backed batches with unique QR codes.",
    link: "/batch",
  },
  {
    icon: <Users className="w-8 h-8 text-pink-400" />,
    title: "Multi-role Access",
    description:
      "Separate logins for farmers, processors, testers, hospitals & consumers.",
    link: "/home",
  },
  {
    icon: <QrCode className="w-8 h-8 text-yellow-400" />,
    title: "Consumer Verification",
    description:
      "Scan QR codes to instantly verify origin, quality, and sustainability.",
    link: "/batch",
  },
  {
    icon: <Shield className="w-8 h-8 text-red-400" />,
    title: "Admin Dashboard",
    description:
      "Monitor and manage the entire ecosystem, including users, collections, processing, quality tests, and batch tracking, all in one place.",
    link: "/admin",
  },
];

const stats = [
  { label: "Herbs Tracked", value: "120+" },
  { label: "Collection Points", value: "35" },
  { label: "Lab Tests Done", value: "210+" },
  { label: "Consumers Engaged", value: "500+" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-green-50 text-green-900 font-sans">
      {/* Hero Section */}
      <section className="relative min-h-screen pt-20 pb-32 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-top"
          style={{ backgroundImage: `url(${assets.bg_img})` }}
        ></div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/30 z-10"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 text-center">
          {/* Heading */}
          <motion.h1
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-lime-400 to-green-300 bg-clip-text text-transparent leading-snug"
          >
            AyurTrack
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="mt-4 text-lg md:text-xl text-white max-w-3xl mx-auto"
          >
            Blockchain-powered traceability for Ayurvedic herbs — from
            collection to consumer trust.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8 flex justify-center flex-wrap gap-6"
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 text-lg font-medium rounded-3xl bg-gradient-to-r from-green-600 to-emerald-500 hover:scale-105 hover:opacity-90 transition duration-300 text-white shadow-lg hover:shadow-xl"
            >
              Dashboard <ArrowRight className="ml-2 w-5 h-5 text-green-100" />
            </Link>
            
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 text-lg font-medium rounded-3xl bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-105 hover:opacity-90 transition duration-300 text-white shadow-lg hover:shadow-xl border-2 border-green-400/20"
            >
              <LogIn className="mr-2 w-5 h-5 text-green-100" />
              Sign In
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white/80 border border-green-200 shadow-lg"
              >
                <div className="text-2xl font-bold text-green-700">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-green-800">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative bg-green-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-emerald-600 via-lime-500 to-green-600 bg-clip-text text-transparent mb-10">
            Core Features
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-green-200 hover:border-emerald-500 hover:scale-105 transition duration-300"
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold text-green-800">
                  {f.title}
                </h3>
                <p className="mt-2 text-green-700 text-sm">{f.description}</p>
                <Link
                  to={f.link}
                  className="mt-4 inline-flex items-center text-green-700 hover:text-emerald-600 font-medium"
                >
                  Explore <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action */}
      <section className="bg-gradient-to-r from-green-100/80 to-green-200/80 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
            Transparency & Provenance
          </h2>
          <p className="text-green-700 mb-6">
            Empower consumers and stakeholders with blockchain-backed proof of
            provenance for every Ayurvedic herb.
          </p>
          
          {/* Additional Sign In CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Link
              to="/login"
              className="inline-flex items-center px-8 py-4 text-lg font-bold rounded-3xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <LogIn className="mr-3 w-6 h-6" />
              Get Started - Sign In Now
              <ArrowRight className="ml-3 w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
