import React from "react";

export default function Footer() {
  return (
    <footer className="bg-green-50 border-t border-green-200 py-6 text-center text-green-900 text-sm">
      <p>
        © {new Date().getFullYear()} AyurTrace — Trust Ayurveda, Trust
        Blockchain.
      </p>
      <p className="mt-2">
        Built with ❤️ using React, TailwindCSS & Blockchain Tech
      </p>
    </footer>
  );
}
