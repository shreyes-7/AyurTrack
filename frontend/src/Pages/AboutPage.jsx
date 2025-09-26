import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { 
  Shield, 
  Eye, 
  Zap, 
  Leaf, 
  Users, 
  Globe, 
  ArrowRight,
  Sparkles,
  Star,
  Award,
  CheckCircle,
  MapPin,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Github,
  Linkedin,
  Twitter,
  Cpu,
  Database,
  Network,
  Lock,
  TrendingUp,
  Target,
  Layers
} from "lucide-react";
import { assets } from "../assets/assets";
import Layout from "../Components/Layout";

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.6
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 12,
      duration: 0.6
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, rotateX: -15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    rotateX: 0,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  hover: {
    scale: 1.03,
    y: -5,
    rotateY: 2,
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
    transition: { duration: 0.3 }
  }
};

const iconVariants = {
  hover: {
    scale: 1.2,
    rotate: [0, -10, 10, 0],
    transition: { duration: 0.4 }
  }
};

// Floating animation for background elements
const floatingVariants = {
  animate: {
    y: [-10, 10, -10],
    rotate: [0, 5, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function About() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const stats = [
    { number: "50K+", label: "Herbs Tracked", icon: <Leaf className="w-5 h-5" /> },
    { number: "1000+", label: "Farmers Connected", icon: <Users className="w-5 h-5" /> },
    { number: "99.9%", label: "Accuracy Rate", icon: <Target className="w-5 h-5" /> },
    { number: "24/7", label: "Real-time Monitoring", icon: <Clock className="w-5 h-5" /> }
  ];

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Blockchain Security",
      description: "Military-grade encryption with immutable ledger technology ensuring complete data integrity and tamper-proof records.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-200/50"
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Complete Transparency",
      description: "End-to-end visibility across the entire supply chain with real-time tracking and verification capabilities.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-200/50"
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: "Smart Automation",
      description: "AI-powered quality control with automated compliance checks and intelligent routing optimization.",
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-200/50"
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: "Sustainable Practices",
      description: "Promoting eco-friendly harvesting methods with carbon footprint tracking and sustainability scoring.",
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-200/50"
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Global Network",
      description: "Connecting stakeholders worldwide through our permissioned blockchain network with seamless integration.",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-200/50"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Sub-second transaction processing with optimized smart contracts for maximum efficiency and minimal latency.",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-200/50"
    }
  ];

  const team = [
    {
      name: "Shreyes Jaiswal",
      role: "Blockchain Architect",
      img: "/team/placeholder.jpg",
      description: "Leading blockchain innovation with 5+ years in DeFi",
      skills: ["Solidity", "Web3", "Smart Contracts"],
      social: { github: "#", linkedin: "#", twitter: "#" }
    },
    {
      name: "Prabhu Pachisia",
      role: "Backend Developer",
      img: assets.prabhu,
      description: "Expert in scalable systems and API architecture",
      skills: ["Node.js", "Python", "DevOps"],
      social: { github: "#", linkedin: "#", twitter: "#" }
    },
    {
      name: "Abhinav Pandey",
      role: "ML Engineer",
      img: "/team/placeholder.jpg",
      description: "Specializing in predictive analytics and AI models",
      skills: ["TensorFlow", "PyTorch", "Data Science"],
      social: { github: "#", linkedin: "#", twitter: "#" }
    },
    {
      name: "Vedanth Saxena",
      role: "ML Engineer",
      img: "/team/placeholder.jpg",
      description: "Computer vision expert for quality assessment",
      skills: ["OpenCV", "Deep Learning", "MLOps"],
      social: { github: "#", linkedin: "#", twitter: "#" }
    },
    {
      name: "Shridhan Suman",
      role: "Frontend Developer",
      img: "/team/placeholder.jpg",
      description: "Creating intuitive user experiences with modern tech",
      skills: ["React", "TypeScript", "UI/UX"],
      social: { github: "#", linkedin: "#", twitter: "#" }
    },
    {
      name: "Akshita Shrivastav",
      role: "Frontend Developer",
      img: "/team/placeholder.jpg",
      description: "Responsive design specialist and accessibility advocate",
      skills: ["React", "CSS", "Design Systems"],
      social: { github: "#", linkedin: "#", twitter: "#" }
    }
  ];

  const testimonials = [
    {
      name: "Ramesh Kumar",
      role: "Organic Farmer",
      location: "Kerala, India",
      text: "AyurTrack revolutionized how I document my harvest. The GPS tracking gives my customers complete confidence in my organic certification.",
      rating: 5,
      avatar: "/avatars/farmer1.jpg"
    },
    {
      name: "Dr. Meera Joshi",
      role: "Ayurveda Practitioner",
      location: "Mumbai, India",
      text: "The QR scanning feature is incredible. I can verify authenticity instantly and provide my patients with complete transparency about their medicines.",
      rating: 5,
      avatar: "/avatars/doctor1.jpg"
    },
    {
      name: "Ankit Sharma",
      role: "Supply Chain Manager",
      location: "Delhi, India",
      text: "Our processing efficiency improved by 40% after implementing AyurTrack. The real-time monitoring is a game-changer for quality control.",
      rating: 5,
      avatar: "/avatars/manager1.jpg"
    }
  ];

  const milestones = [
    { year: "2024", event: "Founded with vision to revolutionize Ayurvedic supply chain" },
    { year: "2024", event: "Developed MVP with blockchain integration" },
    { year: "2025", event: "Launched pilot program with 50+ farmers" },
    { year: "2025", event: "Achieved 1000+ successful transactions" }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 overflow-hidden">
        
        {/* Floating Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            variants={floatingVariants}
            animate="animate"
            className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-green-200/20 to-emerald-300/20 rounded-full blur-3xl"
          />
          <motion.div 
            variants={floatingVariants}
            animate="animate"
            style={{ animationDelay: "2s" }}
            className="absolute top-1/3 right-20 w-48 h-48 bg-gradient-to-br from-blue-200/20 to-cyan-300/20 rounded-full blur-3xl"
          />
          <motion.div 
            variants={floatingVariants}
            animate="animate"
            style={{ animationDelay: "4s" }}
            className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-purple-200/20 to-indigo-300/20 rounded-full blur-3xl"
          />
        </div>

        {/* Hero Section with Parallax */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <motion.div 
            style={{ y: backgroundY }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-emerald-800/10 to-teal-900/20" />
            <div 
              className="w-full h-full bg-cover bg-center bg-fixed opacity-10"
              style={{ backgroundImage: `url(${assets.bg1_img})` }}
            />
          </motion.div>

          <motion.div 
            style={{ y: textY }}
            className="relative z-10 text-center max-w-6xl mx-auto px-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="mb-8"
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8">
                <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 bg-clip-text text-transparent">
                  About
                </span>
                <br />
                <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 bg-clip-text text-transparent">
                  AyurTrack
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-12 font-medium"
            >
              Revolutionizing the Ayurvedic supply chain through{" "}
              <span className="text-green-600 font-bold">blockchain technology</span>,{" "}
              <span className="text-emerald-600 font-bold">AI-powered insights</span>, and{" "}
              <span className="text-teal-600 font-bold">complete transparency</span>{" "}
              from farm to medicine cabinet.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-6 mb-16"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                <Award className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-800">AYUSH Certified</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-800">ISO 27001</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-800">Blockchain Verified</span>
              </div>
            </motion.div>

            {/* Stats Section */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 hover:scale-105"
                >
                  <div className="flex items-center justify-center mb-3 text-green-600">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-black text-gray-800 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
                Revolutionary Features
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Cutting-edge technology meets traditional Ayurvedic wisdom
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  variants={cardVariants}
                  whileHover="hover"
                  className={`relative group p-8 ${feature.bgColor} backdrop-blur-sm rounded-3xl border ${feature.borderColor} shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer`}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`} />
                  
                  <div className="relative">
                    <motion.div
                      variants={iconVariants}
                      className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                    >
                      {feature.icon}
                    </motion.div>

                    <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-green-700 transition-colors duration-300">
                      {feature.title}
                    </h3>

                    <p className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>

                    <div className="flex items-center text-green-600 font-semibold group-hover:text-green-700 transition-colors duration-300">
                      <span>Learn More</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-gray-50 to-green-50/30 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
                Meet Our Visionaries
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                The brilliant minds behind AyurTrack's innovative technology
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {team.map((member, i) => (
                <motion.div
                  key={i}
                  variants={cardVariants}
                  whileHover="hover"
                  className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl border border-white/50 transition-all duration-500 overflow-hidden"
                >
                  {/* Profile Image */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-green-400 to-emerald-500 p-1 group-hover:scale-105 transition-transform duration-300">
                      {/* <img
                        src={member.img}
                        alt={member.name}
                        className="w-full h-full object-cover rounded-2xl"
                      /> */}
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </motion.div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{member.name}</h3>
                    <p className="text-green-600 font-semibold mb-3">{member.role}</p>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{member.description}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {member.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Social Links */}
                    <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <a href={member.social.github} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        <Github className="w-4 h-4 text-gray-600" />
                      </a>
                      <a href={member.social.linkedin} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        <Linkedin className="w-4 h-4 text-gray-600" />
                      </a>
                      <a href={member.social.twitter} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        <Twitter className="w-4 h-4 text-gray-600" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
                Success Stories
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Real impact from real people across the Ayurvedic ecosystem
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={i}
                  variants={cardVariants}
                  whileHover="hover"
                  className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl border border-white/50 transition-all duration-500"
                >
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, idx) => (
                      <Star key={idx} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  <blockquote className="text-gray-700 italic mb-6 leading-relaxed">
                    "{testimonial.text}"
                  </blockquote>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{testimonial.name}</p>
                      <p className="text-green-600 font-medium text-sm">{testimonial.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <p className="text-gray-400 text-xs">{testimonial.location}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-green-50/30 to-emerald-50/30 relative">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
                Our Journey
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Milestones in our mission to revolutionize Ayurvedic traceability
              </p>
            </motion.div>

            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 to-emerald-600"></div>
              
              {milestones.map((milestone, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                  viewport={{ once: true }}
                  className="relative flex items-center gap-8 mb-12"
                >
                  <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">{milestone.year}</span>
                  </div>
                  <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                    <p className="text-gray-700 font-medium leading-relaxed">{milestone.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-24 px-6 relative">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
                Let's Connect
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Ready to transform your Ayurvedic supply chain? Get in touch with our team
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50"
              >
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Name</label>
                      <input
                        type="text"
                        className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition-all"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Email</label>
                      <input
                        type="email"
                        className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Subject</label>
                    <input
                      type="text"
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition-all"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Message</label>
                    <textarea
                      rows={6}
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition-all resize-none"
                      placeholder="Tell us about your project or question..."
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Send Message
                  </motion.button>
                </form>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-3xl p-8 shadow-xl">
                  <h3 className="text-2xl font-bold mb-6">Get In Touch</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">Email</p>
                        <p className="opacity-90">hello@ayurtrack.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">Phone</p>
                        <p className="opacity-90">+91 99999 99999</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">Location</p>
                        <p className="opacity-90">Mumbai, India</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Why Choose AyurTrack?</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">100% Blockchain Verified</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">Real-time Supply Chain Tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">AI-Powered Quality Control</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">AYUSH Ministry Compliant</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
