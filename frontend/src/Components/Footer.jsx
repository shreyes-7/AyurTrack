import React, { useState } from "react";
import {
  Leaf,
  Twitter,
  Github,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
} from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const year = new Date().getFullYear();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      // simulate API call
      await new Promise((r) => setTimeout(r, 900));
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand & tagline */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">AyurTrace</h3>
                <p className="text-sm text-slate-500">Trust Ayurveda • Trust Blockchain</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              AyurTrace provides secure, blockchain-backed traceability for botanicals and herbal
              supply chains. Built with privacy, provenance, and modern UX in mind.
            </p>

            <div className="flex items-center gap-3 mt-2">
              <a
                href="#"
                aria-label="Twitter"
                className="p-2 rounded-md hover:bg-slate-50 transition"
              >
                <Twitter className="w-5 h-5 text-slate-600" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="p-2 rounded-md hover:bg-slate-50 transition"
              >
                <Linkedin className="w-5 h-5 text-slate-600" />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="p-2 rounded-md hover:bg-slate-50 transition"
              >
                <Github className="w-5 h-5 text-slate-600" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="/collection" className="hover:text-emerald-600 transition">
                  Collection
                </a>
              </li>
              <li>
                <a href="/processing" className="hover:text-emerald-600 transition">
                  Processing
                </a>
              </li>
              <li>
                <a href="/quality" className="hover:text-emerald-600 transition">
                  Lab Test
                </a>
              </li>
              <li>
                <a href="/batch" className="hover:text-emerald-600 transition">
                  Batches
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="/about" className="hover:text-emerald-600 transition">
                  About
                </a>
              </li>
              <li>
                <a href="/admin" className="hover:text-emerald-600 transition">
                  Admin
                </a>
              </li>
              <li>
                <a href="/settings" className="hover:text-emerald-600 transition">
                  Settings
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-emerald-600 transition">
                  Privacy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="md:col-span-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Contact & Newsletter</h4>

            <div className="flex items-start gap-3 text-sm text-slate-600 mb-4">
              <MapPin className="w-4 h-4 mt-1 text-emerald-500" />
              <div>
                <div className="font-medium text-slate-800">AyurTrace HQ</div>
                <div>Chennai, India</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-slate-600 mb-4">
              <Mail className="w-4 h-4 mt-1 text-emerald-500" />
              <div>
                <div className="font-medium text-slate-800">Support</div>
                <a href="mailto:hello@ayurtrace.example" className="text-slate-600 hover:text-emerald-600 transition">
                  shreyesjaiswal7@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-slate-600 mb-6">
              <Phone className="w-4 h-4 mt-1 text-emerald-500" />
              <div>
                <div className="font-medium text-slate-800">Phone</div>
                <a href="tel:+911234567890" className="text-slate-600 hover:text-emerald-600 transition">
                  +91 12345 67890
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label htmlFor="footer-email" className="sr-only">Email</label>
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="Your email"
                className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition"
                aria-label="Subscribe email"
              />
              <button
                type="submit"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium shadow ${
                  status === "loading" ? "bg-emerald-400/80" : "bg-emerald-500 hover:bg-emerald-600"
                } transition`}
                disabled={status === "loading"}
                aria-live="polite"
              >
                {status === "success" ? <CheckCircle className="w-4 h-4" /> : null}
                {status === "loading" ? "Subscribing..." : status === "success" ? "Subscribed" : "Subscribe"}
              </button>
            </form>

            {status === "error" && (
              <p className="mt-3 text-sm text-rose-600">Please enter a valid email address.</p>
            )}

            <p className="mt-4 text-xs text-slate-500">
              We respect your privacy — unsubscribe at any time.
            </p>
          </div>
        </div>

       
      </div>
    </footer>
  );
}
