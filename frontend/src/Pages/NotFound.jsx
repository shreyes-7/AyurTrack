// src/Pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-6xl font-bold text-gray-100 mb-4">404</h1>
        <p className="text-xl text-gray-400 mb-6">
          Oops! The page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl text-white hover:opacity-90 transition"
        >
          Go Home
        </Link>
      </div>
    </Layout>
  );
}
