// src/Pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import Layout from "../Components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center bg-green-50">
        <h1 className="text-6xl font-bold text-green-900 mb-4">404</h1>
        <p className="text-xl text-green-700 mb-6">
          Oops! The page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-400 rounded-2xl text-white hover:opacity-90 transition"
        >
          Go Home
        </Link>
      </div>
    </Layout>
  );
}
