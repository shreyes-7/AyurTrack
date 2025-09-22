import React from "react";
import Card from "../Components/Card";
import Layout from "../Components/Layout";
import { Shield, Eye, Zap, Leaf, Users, Globe } from "lucide-react";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 16, duration: 0.7 },
  },
  hover: {
    scale: 1.06,
    borderColor: "#06b6d4",
    boxShadow: "0 14px 30px rgba(6,182,212,0.5)",
  },
};

const iconVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.2,
    rotate: [0, 10, -10, 0],
    transition: { duration: 1, repeat: Infinity, repeatType: "mirror" },
  },
};

export default function About() {
  const features = [
    {
      icon: <Shield className="w-6 h-6 text-red-400" />,
      title: "Secure & Private",
      text: "AyurTrack uses blockchain encryption ensuring data security, privacy, and tamper-proof records. Only authorized participants can access sensitive information.",
      color: "bg-red-500/30",
    },
    {
      icon: <Eye className="w-6 h-6 text-cyan-400" />,
      title: "Transparent & Trustworthy",
      text: "Every step in the supply chain is recorded on blockchain for complete transparency. Independent verification is possible, creating trust between all stakeholders.",
      color: "bg-cyan-400/30",
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Efficient & Reliable",
      text: "Automated data collection, tracking, and verification reduce errors and save time. Real-time updates ensure smooth workflow and reliable information.",
      color: "bg-yellow-400/30",
    },
    {
      icon: <Leaf className="w-6 h-6 text-green-400" />,
      title: "Sustainable & Ethical",
      text: "AyurTrack promotes responsible sourcing and sustainable practices. Products are ethically harvested, supporting eco-friendly methods and preserving natural resources.",
      color: "bg-green-400/30",
    },
  ];

  const team = [
    { name: "Shreyes Jaiswal", role: "Blockchain Architect", img: "/team/placeholder.jpg" },
    { name: "Prabhu Pachisia", role: "Backend Developer", img: "/team/placeholder.jpg" },
    { name: "Abhinav Pandey", role: "ML Engineer", img: "/team/placeholder.jpg" },
    { name: "Vedanth Saxena", role: "ML Engineer", img: "/team/placeholder.jpg" },
    { name: "Shridhan Suman", role: "Frontend Developer", img: "/team/placeholder.jpg" },
    { name: "Akshita Shrivastav", role: "Frontend Developer", img: "/team/placeholder.jpg" },
  ];

  const testimonials = [
    {
      name: "Ramesh Kumar",
      role: "Farmer",
      text: "AyurTrack helped me record my herb collections digitally. I trust that my produce is verified and traceable now.",
    },
    {
      name: "Dr. Meera Joshi",
      role: "Ayurveda Practitioner",
      text: "I can check product quality instantly via QR scans. The platform ensures I get authentic herbs for my patients.",
    },
  ];

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-black text-slate-100 p-6 lg:p-12">

        {/* Hero Section */}
        <div className="text-center mb-24">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.7 } }}
            className="text-5xl md:text-6xl font-extrabold text-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 mb-6 bg-clip-text text-transparent"
          >
            About AyurTrack
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.2, duration: 0.7 } }}
            className="text-gray-400 max-w-3xl mx-auto text-lg md:text-xl"
          >
            AyurTrack is a blockchain-powered platform for transparency, traceability, and quality in the Ayurvedic supply chain—from herb collection to consumer verification. Ensuring trust and authenticity at every step.
          </motion.p>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="relative overflow-visible"
            >
              <Card className="bg-gray-900/90 border border-gray-800 shadow-2xl p-6 flex flex-col gap-4 cursor-pointer transition-all hover:scale-105 hover:shadow-cyan-500/40">
                <div className="relative flex items-center gap-3 mb-3">
                  <motion.div
                    variants={iconVariants}
                    whileHover="hover"
                    className={`absolute -inset-2 rounded-full ${feature.color} blur-2xl opacity-40 pointer-events-none`}
                  />
                  {feature.icon}
                  <h2 className={`text-xl font-semibold ${feature.icon.props.className.split(" ")[2]}`}>
                    {feature.title}
                  </h2>
                </div>
                <p className="text-gray-400 text-sm md:text-base">{feature.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Why Choose Us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 max-w-4xl mx-auto text-center"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 mb-6">
            Why Choose AyurTrack?
          </h3>
          <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
            AyurTrack bridges the gap between herb producers and consumers, ensuring transparency, safety, and sustainability. The platform provides actionable insights and verifiable data for farmers, processors, testers, hospitals, and consumers.
          </p>
        </motion.div>

        {/* Team Section */}
        <div className="mb-24">
          <h3 className="text-3xl md:text-4xl font-bold text-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 text-center mb-12">
            Meet Our Team
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
            {team.map((member, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gray-900/90 border border-gray-800 rounded-3xl shadow-2xl p-6 text-center transition-all"
              >
                <div className="w-28 h-28 mx-auto rounded-full overflow-hidden mb-4 border-2 border-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-lg font-semibold text-cyan-400">{member.name}</h4>
                <p className="text-gray-400 text-sm">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-24 max-w-4xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 text-center mb-12">
            What Our Users Say
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03 }}
                className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 shadow-xl transition-all hover:shadow-cyan-500/30"
              >
                <p className="text-gray-400 mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-4">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-cyan-400 font-semibold">{t.name}</p>
                    <p className="text-gray-500 text-sm">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-gray-900/90 border border-gray-800 shadow-2xl rounded-3xl p-8 mb-12"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 mb-6 text-center">
            Contact Us
          </h3>
          <form className="space-y-5">
            <div>
              <label className="block text-gray-400 mb-1">Name</label>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Message</label>
              <textarea
                placeholder="Your message..."
                className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-slate-100 h-36 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-semibold py-3 rounded-2xl hover:opacity-90 transition-all"
            >
              Send Message
            </button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
