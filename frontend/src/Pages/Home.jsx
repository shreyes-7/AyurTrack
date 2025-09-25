import React, { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Leaf,
  MapPin,
  Shield,
  Globe,
  QrCode,
  Users,
  Zap,
  Award,
  CheckCircle,
  BarChart3,
  Database,
  Layers,
  Network,
  LogIn,
  PlayCircle,
  Star,
  Lock,
  Cpu,
  Workflow,
  TreePine,
  TestTube,
  Factory,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";

// Optimized animation variants with reduced durations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05 }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

// Main features based on problem statement
const features = [
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Geo-Tagged Collection",
    description: "GPS-enabled tracking from farmers and wild collectors with precise location data and species identification.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Smart Contract Validation",
    description: "Automated enforcement of sustainability guidelines and quality thresholds via blockchain.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: <TestTube className="w-6 h-6" />,
    title: "Quality Gate System",
    description: "FHIR-compliant testing with moisture, pesticide, and DNA validation at every step.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: <QrCode className="w-6 h-6" />,
    title: "Consumer Transparency",
    description: "Unique QR codes reveal complete provenance journey with interactive maps.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: <Network className="w-6 h-6" />,
    title: "Permissioned Network",
    description: "Hyperledger Fabric-based ledger connecting all supply chain stakeholders.",
    color: "from-teal-500 to-blue-500",
  },
  {
    icon: <Workflow className="w-6 h-6" />,
    title: "End-to-End Traceability",
    description: "Immutable audit trail from collection to final formulation and retail.",
    color: "from-pink-500 to-rose-500",
  }
];

// Supply chain participants
const participants = [
  {
    icon: <TreePine className="w-8 h-8 text-green-600" />,
    title: "Farmers & Collectors",
    description: "GPS-enabled collection with mobile DApp",
    count: "500+",
    role: "Data Capture"
  },
  {
    icon: <TestTube className="w-8 h-8 text-blue-600" />,
    title: "Testing Labs",
    description: "FHIR-compliant quality validation",
    count: "25+",
    role: "Quality Assurance"
  },
  {
    icon: <Factory className="w-8 h-8 text-purple-600" />,
    title: "Processing Facilities",
    description: "GMP-certified blockchain integration",
    count: "40+",
    role: "Processing"
  },
  {
    icon: <ShoppingCart className="w-8 h-8 text-orange-600" />,
    title: "Manufacturers",
    description: "Formulation with QR generation",
    count: "15+",
    role: "Final Product"
  }
];

// Blockchain benefits
const benefits = [
  { 
    icon: <Lock className="w-5 h-5" />, 
    title: "Immutable Records",
    description: "Tamper-proof data integrity",
    metric: "100%"
  },
  { 
    icon: <Zap className="w-5 h-5" />, 
    title: "Real-time Tracking",
    description: "Instant supply visibility",
    metric: "24/7"
  },
  { 
    icon: <Award className="w-5 h-5" />, 
    title: "Auto Compliance",
    description: "NMPB & AYUSH enforcement",
    metric: "Auto"
  },
  { 
    icon: <Globe className="w-5 h-5" />, 
    title: "Global Standards",
    description: "Export-ready documentation",
    metric: "ISO"
  }
];

// Live stats
const liveStats = [
  { label: "Herbs Tracked", value: "1,250+", icon: <Leaf className="w-4 h-4" />, change: "+15%" },
  { label: "Collection Points", value: "85", icon: <MapPin className="w-4 h-4" />, change: "+8%" },
  { label: "Quality Tests", value: "3,420", icon: <TestTube className="w-4 h-4" />, change: "+23%" },
  { label: "Consumer Scans", value: "12.5K", icon: <QrCode className="w-4 h-4" />, change: "+45%" },
];

// Technology stack (removed IoT)
const techStack = [
  { 
    name: "Hyperledger Fabric", 
    description: "Permissioned blockchain network", 
    icon: <Database className="w-8 h-8" />,
    color: "from-blue-500 to-indigo-600"
  },
  { 
    name: "Smart Contracts", 
    description: "Automated validation & compliance", 
    icon: <Cpu className="w-8 h-8" />,
    color: "from-green-500 to-emerald-600"
  },
  { 
    name: "FHIR Standards", 
    description: "Healthcare data interoperability", 
    icon: <Layers className="w-8 h-8" />,
    color: "from-purple-500 to-violet-600"
  }
];

function CounterAnimation({ end, duration = 1.5 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isInView]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

function AnimatedSection({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  // Temporary auth state management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check auth status on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 text-green-900 font-sans overflow-x-hidden">
      
      {/* Hero Section - Optimized */}
      <section className="relative min-h-[85vh] pt-16 pb-12 overflow-hidden">
        {/* Clean Background */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%), url(${assets.bg_img})`,
            }}
          />
          
          {/* Simplified floating elements - reduced count */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-5, -15, -5],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random(),
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Simplified geometric shapes */}
          <motion.div 
            className="absolute top-20 left-10 w-16 h-16 border border-white/20 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute top-1/2 right-10 w-12 h-12 border border-white/20 rotate-45"
            animate={{ rotate: [45, 135, 45] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-20 max-w-6xl mx-auto px-4">
          <div className="text-center">
            
            {/* Welcome Message */}
            {isAuthenticated && user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="mb-4 inline-block"
              >
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <p className="text-white text-sm font-medium">
                    Welcome back, <span className="font-bold text-green-200">{user.name || user.email}</span>! 🌿
                  </p>
                </div>
              </motion.div>
            )}

            {/* Main Heading - Smooth animation */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="mb-6"
            >
              <motion.h1 
                className="text-4xl md:text-6xl font-black tracking-tight leading-none mb-3"
                style={{
                  background: "linear-gradient(90deg, #ffffff, #dcfce7, #bbf7d0, #ffffff)",
                  backgroundSize: "200% 200%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}
              >
                AyurTrack
              </motion.h1>
              
              <div className="max-w-3xl mx-auto space-y-3">
                <motion.h2 
                  className="text-xl md:text-2xl font-bold text-white/90 leading-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  Blockchain-Powered Botanical Traceability
                </motion.h2>
                <motion.p 
                  className="text-base md:text-lg text-white/80 font-medium leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  From geo-tagged collection to consumer transparency —
                  revolutionizing Ayurvedic herb supply chains
                </motion.p>
              </div>
            </motion.div>

            {/* Key Value Propositions - Faster stagger */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mb-8"
            >
              <div className="flex flex-wrap justify-center gap-3 text-xs md:text-sm font-semibold">
                {[
                  { icon: <CheckCircle className="w-3 h-3" />, text: "NMPB Compliant" },
                  { icon: <CheckCircle className="w-3 h-3" />, text: "FHIR Standards" },
                  { icon: <CheckCircle className="w-3 h-3" />, text: "Hyperledger Fabric" }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.2 }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors duration-200"
                  >
                    <span className="text-green-200">{item.icon}</span>
                    <span className="text-white">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA Buttons - Optimized */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="mb-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                to="/admin"
                className="group relative px-6 py-3 bg-white text-green-800 font-bold text-base rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 overflow-hidden"
              >
                <div className="relative flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Explore Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </Link>

              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="group px-6 py-3 bg-transparent border-2 border-white text-white font-bold text-base rounded-xl hover:bg-white hover:text-green-800 transform hover:scale-105 transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Sign In to Start
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </Link>
              ) : (
                <button
                  onClick={() => logout()}
                  className="group px-6 py-3 bg-red-500/20 border-2 border-red-300 text-white font-bold text-base rounded-xl hover:bg-red-500 hover:border-red-500 transform hover:scale-105 transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <LogIn className="w-5 h-5 rotate-180" />
                    Sign Out
                  </div>
                </button>
              )}

              <button className="group px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Watch Demo
                </div>
              </button>
            </motion.div>

            {/* Live Stats - Smooth animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto"
            >
              {liveStats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.05, duration: 0.2 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-4 bg-white/15 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/25 transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-center justify-center mb-2 text-white/80 group-hover:text-white transition-colors duration-200">
                    {stat.icon}
                  </div>
                  <div className="text-xl md:text-2xl font-black text-white mb-1">
                    <CounterAnimation end={parseInt(stat.value.replace(/[^0-9]/g, ''))} />
                    {stat.value.replace(/[0-9]/g, '')}
                  </div>
                  <div className="text-xs text-white/80 mb-1">{stat.label}</div>
                  <div className="text-xs text-green-200 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Supply Chain Participants Section - Optimized */}
      <AnimatedSection className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4"
              variants={slideInLeft}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              Trusted Ecosystem Participants
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              variants={slideInRight}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              A permissioned network connecting every stakeholder in the supply chain
            </motion.p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {participants.map((participant, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ scale: 1.03, y: -3 }}
                className="group p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg hover:shadow-xl border-2 border-gray-100 hover:border-green-200 transition-all duration-200 cursor-pointer"
              >
                <div className="text-center">
                  <div className="mb-4 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl w-fit mx-auto group-hover:scale-105 transition-transform duration-200">
                    {participant.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{participant.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{participant.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-black text-green-600">{participant.count}</span>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{participant.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Core Features Section - Optimized */}
      <AnimatedSection className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4"
              {...fadeInUp}
            >
              Revolutionary Blockchain Features
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-700 max-w-2xl mx-auto"
              {...fadeInUp}
            >
              Advanced technology ensuring authenticity and transparency at every step
            </motion.p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ scale: 1.02, y: -2 }}
                className="group relative p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-white/50 hover:border-green-200/50 transition-all duration-200 overflow-hidden cursor-pointer"
              >
                <div className="relative">
                  <motion.div 
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4 group-hover:scale-105 transition-transform duration-200`}
                  >
                    {feature.icon}
                  </motion.div>
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-green-700 transition-colors duration-200">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-4 text-sm">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center text-green-600 font-semibold group-hover:text-green-700 transition-colors duration-200 text-sm">
                    <span>Learn More</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Technology Stack Section - Optimized */}
      <AnimatedSection className="py-16 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-2xl md:text-3xl font-bold text-white mb-4"
              {...fadeInUp}
            >
              Built on Enterprise-Grade Technology
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-300 max-w-2xl mx-auto"
              {...fadeInUp}
            >
              Leveraging cutting-edge blockchain technologies for security and reliability
            </motion.p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {techStack.map((tech, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ scale: 1.03, y: -3 }}
                className="group relative p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 hover:border-green-500/50 transition-all duration-200 cursor-pointer overflow-hidden"
              >
                <div className="relative">
                  <div className="text-green-400 mb-4 group-hover:scale-105 transition-transform duration-200">
                    {tech.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-200">
                    {tech.name}
                  </h3>
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-200">
                    {tech.description}
                  </p>
                  
                  {/* Simplified sparkle effect */}
                  <motion.div
                    className="absolute top-2 right-2 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Benefits Section - Optimized */}
      <AnimatedSection className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4"
              {...fadeInUp}
            >
              Unmatched Blockchain Benefits
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              {...fadeInUp}
            >
              Experience the power of decentralized trust and automated compliance
            </motion.p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ scale: 1.03, y: -2 }}
                className="group text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100 hover:border-green-300 transition-all duration-200 cursor-pointer"
              >
                <div className="inline-flex p-3 bg-green-500 text-white rounded-xl mb-4 group-hover:scale-105 transition-transform duration-200">
                  {benefit.icon}
                </div>
                <div className="text-2xl font-black text-green-600 mb-2">
                  {benefit.metric}
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Call-to-Action Section - Optimized */}
      {!isAuthenticated && (
        <AnimatedSection className="py-16 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 relative overflow-hidden">
          {/* Simplified background elements */}
          <motion.div 
            className="absolute top-10 left-10 w-24 h-24 border-2 border-white/20 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full"
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <motion.h2 
              className="text-2xl md:text-3xl font-bold text-white mb-4"
              {...fadeInUp}
            >
              Ready to Transform Your Supply Chain?
            </motion.h2>
            <motion.p 
              className="text-lg text-green-100 mb-8 leading-relaxed"
              {...fadeInUp}
            >
              Join the revolution in Ayurvedic herb traceability with blockchain technology.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              {...fadeInUp}
            >
              <Link
                to="/login"
                className="group px-8 py-4 bg-white text-green-600 font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center gap-3 hover:scale-105 transform"
              >
                <LogIn className="w-5 h-5" />
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              
              <button className="group px-6 py-4 bg-transparent border-2 border-white text-white font-bold text-base rounded-xl hover:bg-white hover:text-green-600 transition-all duration-200 flex items-center gap-2 hover:scale-105 transform">
                <PlayCircle className="w-5 h-5" />
                Schedule Demo
              </button>
            </motion.div>

            <motion.div 
              className="mt-10 flex flex-wrap justify-center gap-6 text-green-100"
              {...fadeInUp}
            >
              {[
                { icon: <Star className="w-4 h-4 text-yellow-300 fill-current" />, text: "AYUSH Ministry Approved" },
                { icon: <Shield className="w-4 h-4" />, text: "Enterprise Security" },
                { icon: <Award className="w-4 h-4" />, text: "ISO 27001 Certified" }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="flex items-center gap-2 hover:scale-105 transition-transform duration-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.2 }}
                >
                  {item.icon}
                  <span className="text-sm">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </AnimatedSection>
      )}
    </div>
  );
}
