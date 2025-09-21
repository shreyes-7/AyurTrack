import React from "react";

export default function Footer() {
  return (
    <footer className="bg-black/80 border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
      <p>
        © {new Date().getFullYear()} AyurTrace — Trust Ayurveda, Trust Blockchain.
      </p>
      <p className="mt-2">
        Built with ❤️ using React, TailwindCSS & Blockchain Tech
      </p>
    </footer>
  );
}
