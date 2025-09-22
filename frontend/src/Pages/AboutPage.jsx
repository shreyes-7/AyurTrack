import React from "react";
import Card from "../Components/Card";
import Layout from "../Components/Layout";
import { Shield, Eye, Zap, Leaf } from "lucide-react";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 15, duration: 0.6 },
  },
  hover: {
    scale: 1.04,
    borderColor: "#06b6d4",
    boxShadow: "0 12px 30px rgba(6,182,212,0.4)",
  },
};

const iconVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.15,
    rotate: [0, 10, -10, 0],
    transition: { duration: 1, repeat: Infinity, repeatType: "mirror" },
  },
};

export default function About() {
  const features = [
    {
      icon: <Shield className="w-6 h-6 text-red-400" />,
      title: "Secure & Private",
      text: "AyurTrack leverages blockchain encryption to ensure your data is secure, private, and tamper-proof. Only authorized participants can access sensitive info. Every transaction is digitally signed and verified to maintain integrity.",
      color: "bg-red-500/20",
    },
    {
      icon: <Eye className="w-6 h-6 text-cyan-400" />,
      title: "Transparent & Trustworthy",
      text: "Every step in the supply chain is recorded on blockchain, ensuring complete transparency and accountability. Participants can independently verify records at any time, creating trust among farmers, processors, and consumers.",
      color: "bg-cyan-400/20",
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Efficient & Reliable",
      text: "The portal automates data collection, tracking, and verification, reducing errors and saving time. Notifications and real-time updates ensure smooth workflow and reliable information.",
      color: "bg-yellow-400/20",
    },
    {
      icon: <Leaf className="w-6 h-6 text-green-400" />,
      title: "Sustainable & Ethical",
      text: "AyurTrack promotes responsible sourcing and sustainable practices. All products are ethically harvested and verified, supporting eco-friendly methods and preserving natural resources for future generations.",
      color: "bg-green-400/20",
    },
  ];

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-black text-slate-100 p-6">
       
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
            className="text-4xl font-bold text-cyan-400 mb-4"
          >
            About AyurTrack
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.2, duration: 0.6 } }}
            className="text-gray-300 max-w-2xl mx-auto"
          >
            AyurTrack is a blockchain-powered platform designed to ensure
            transparency, traceability, and quality in the Ayurvedic supply
            chain—from herb collection to consumer verification.
          </motion.p>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="relative overflow-visible rounded-2xl"
            >
              <Card className="bg-gray-900/80 border border-gray-800 shadow-2xl p-6 flex flex-col gap-3 cursor-pointer transition-all">
              
                <div className="relative flex items-center gap-3 mb-2">
                  <motion.div
                    variants={iconVariants}
                    whileHover="hover"
                    className={`absolute -inset-2 rounded-full ${feature.color} blur-xl opacity-40 pointer-events-none`}
                  />
                  {feature.icon}
                  <h2
                    className={`text-xl font-semibold ${
                      feature.icon.props.className.split(" ")[2]
                    }`}
                  >
                    {feature.title}
                  </h2>
                </div>
                <p className="text-gray-400">{feature.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center max-w-3xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-cyan-400 mb-4">
            Why AyurTrack?
          </h3>
          <p className="text-gray-400">
            AyurTrack bridges the gap between Ayurvedic herb producers and
            consumers by ensuring transparency, safety, and sustainability.
            Whether you are a farmer, processor, tester, hospital, or consumer,
            our platform provides actionable insights and verifiable data at
            every step of the supply chain.
          </p>
        </motion.div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 max-w-3xl mx-auto bg-gray-900/80 border border-gray-800 shadow-2xl rounded-2xl p-6"
        >
          <h3 className="text-2xl font-bold text-cyan-400 mb-6 text-center">
            Contact Us
          </h3>
          <form className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-1">Name</label>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Message</label>
              <textarea
                placeholder="Your message..."
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-slate-100 h-32 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-600 text-white font-semibold py-2 rounded-lg hover:bg-cyan-500 transition"
            >
              Send Message
            </button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
