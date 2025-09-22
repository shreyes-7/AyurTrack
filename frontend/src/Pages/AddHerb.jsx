import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../Components/Layout";

export default function AddHerb() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    scientificName: "",
    commonNames: [""],
    category: "",
    parts: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const categoryOptions = [
    "MEDICINAL",
    "ADAPTOGEN",
    "RESPIRATORY",
    "DIGESTIVE",
    "CULINARY",
    "AROMATIC",
  ];

  const partsOptions = [
    "LEAF",
    "ROOT",
    "BARK",
    "SEED",
    "FLOWER",
    "FRUIT",
    "STEM",
    "WHOLE_PLANT",
  ];

  const generateHerbId = (name) =>
    `HERB_${name.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z_]/g, "")}`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCommonNameChange = (index, value) => {
    const newCommonNames = [...formData.commonNames];
    newCommonNames[index] = value;
    setFormData((prev) => ({ ...prev, commonNames: newCommonNames }));
  };

  const addCommonName = () =>
    setFormData((prev) => ({
      ...prev,
      commonNames: [...prev.commonNames, ""],
    }));

  const removeCommonName = (index) => {
    const newCommonNames = formData.commonNames.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      commonNames: newCommonNames.length > 0 ? newCommonNames : [""],
    }));
  };

  const handlePartChange = (part) => {
    setFormData((prev) => {
      const newParts = prev.parts.includes(part)
        ? prev.parts.filter((p) => p !== part)
        : [...prev.parts, part];
      return { ...prev, parts: newParts };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name || !formData.scientificName || !formData.category) {
      setError("Please fill in all required fields.");
      return;
    }
    if (formData.parts.length === 0) {
      setError("Please select at least one plant part.");
      return;
    }
    const filteredCommonNames = formData.commonNames.filter((n) => n.trim() !== "");
    if (filteredCommonNames.length === 0) {
      setError("Please add at least one common name.");
      return;
    }

    const submissionData = {
      id: generateHerbId(formData.name),
      name: formData.name,
      scientificName: formData.scientificName,
      commonNames: filteredCommonNames,
      category: formData.category,
      parts: formData.parts,
    };

    setSubmitting(true);

    try {
      await axios.post("http://localhost:3000/v1/herbs", submissionData);
      setSuccess(true);
      setTimeout(() => navigate("/admin"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create herb.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-900 shadow-2xl rounded-3xl p-10 border border-gray-800">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-400 mb-2 animate-pulse">
                🌿 Add New Herb
              </h1>
              <p className="text-gray-400 text-lg">
                Add a new herb to the blockchain-ready database
              </p>
              {formData.name && (
                <p className="text-gray-500 text-sm mt-2 font-mono">
                  ID: <span className="text-emerald-300">{generateHerbId(formData.name)}</span>
                </p>
              )}
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-6 bg-red-900 border border-red-700 text-red-300 px-5 py-3 rounded-xl shadow-inner animate-pulse">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-900 border border-green-700 text-green-300 px-5 py-3 rounded-xl shadow-inner animate-pulse">
                Herb added successfully! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Herb Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Herb Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Cumin"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>

              {/* Scientific Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Scientific Name *</label>
                <input
                  type="text"
                  name="scientificName"
                  value={formData.scientificName}
                  onChange={handleChange}
                  placeholder="e.g., Cuminum cyminum"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>

              {/* Common Names */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Common Names *</label>
                {formData.commonNames.map((name, i) => (
                  <div key={i} className="flex items-center mb-3 space-x-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleCommonNameChange(i, e.target.value)}
                      placeholder={`Common name ${i + 1}`}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    {formData.commonNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCommonName(i)}
                        className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-xl transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCommonName}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold transition-colors"
                >
                  + Add another common name
                </button>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Parts Used */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Parts Used *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {partsOptions.map((part) => (
                    <label
                      key={part}
                      className={`flex items-center justify-center cursor-pointer rounded-xl px-3 py-2 border border-gray-700 transition-all ${
                        formData.parts.includes(part)
                          ? "bg-emerald-600 text-black border-emerald-500"
                          : "hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.parts.includes(part)}
                        onChange={() => handlePartChange(part)}
                      />
                      {part}
                    </label>
                  ))}
                </div>
              </div>

              {/* Data Preview */}
              {formData.name && formData.scientificName && formData.category && formData.parts.length > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 mt-4 text-sm text-gray-300 font-mono overflow-x-auto">
                  {JSON.stringify({
                    id: generateHerbId(formData.name),
                    name: formData.name,
                    scientificName: formData.scientificName,
                    commonNames: formData.commonNames.filter((n) => n.trim() !== ""),
                    category: formData.category,
                    parts: formData.parts,
                  }, null, 2)}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-2xl transition-all"
                >
                  {submitting ? "Adding Herb..." : "🌱 Add Herb"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 px-6 rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
