import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../Components/Layout";
import { getAuthHeaders } from "../utils/tokenUtils";
import { BASE_URL } from "../../api";

export default function AddHerb() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    scientificName: "",
    commonNames: [""],
    category: "",
    parts: [],
    // Species Rules
    speciesRules: {
      geofence: {
        center: {
          latitude: "",
          longitude: "",
        },
        radiusMeters: "",
      },
      allowedMonths: [],
      qualityThresholds: {
        moistureMax: "",
        pesticidePPMMax: "",
        activeCompounds: {
          curcuminMin: "",
          withanolidesMin: "",
        },
      },
    },
    // Cultivation Info
    cultivationInfo: {
      growingSeason: [],
      harvestingMethod: "",
      dryingMethod: "",
      storageRequirements: "",
    },
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
    "IMMUNE",
    "OTHER",
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

  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const seasonOptions = ["SPRING", "SUMMER", "MONSOON", "AUTUMN", "WINTER"];

  const harvestingMethods = ["MANUAL", "MECHANICAL", "SEMI_AUTOMATIC"];

  const dryingMethods = [
    "SUN_DRYING",
    "SHADE_DRYING",
    "OVEN_DRYING",
    "FREEZE_DRYING",
    "AIR_DRYING",
  ];

  const generateHerbId = (name, existingIds = []) => {
    const cleanName = name
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[^A-Z]/g, "");

    let herbId;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      herbId = `H${cleanName}${randomDigits}`;
      attempts++;
    } while (existingIds.includes(herbId) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      // Fallback: use timestamp if can't generate unique ID
      herbId = `H${cleanName}${Date.now().toString().slice(-4)}`;
    }

    return herbId;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const keys = name.split(".");
      setFormData((prev) => {
        const updated = { ...prev };
        let current = updated;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = type === "checkbox" ? checked : value;
        return updated;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
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

    const filteredCommonNames = formData.commonNames.filter(
      (n) => n.trim() !== ""
    );
    if (filteredCommonNames.length === 0) {
      setError("Please add at least one common name.");
      return;
    }

    const headers = await getAuthHeaders();

    // Clean up the data before submission
    const submissionData = {
      id: generateHerbId(formData.name),
      name: formData.name,
      scientificName: formData.scientificName,
      commonNames: filteredCommonNames,
      category: formData.category,
      parts: formData.parts,
      speciesRules: {
        geofence:
          formData.speciesRules.geofence.center.latitude &&
          formData.speciesRules.geofence.center.longitude
            ? {
                center: {
                  latitude: parseFloat(
                    formData.speciesRules.geofence.center.latitude
                  ),
                  longitude: parseFloat(
                    formData.speciesRules.geofence.center.longitude
                  ),
                },
                radiusMeters:
                  parseInt(formData.speciesRules.geofence.radiusMeters) || 1000,
              }
            : undefined,
        allowedMonths: formData.speciesRules.allowedMonths,
        qualityThresholds: {
          ...(formData.speciesRules.qualityThresholds.moistureMax && {
            moistureMax: parseFloat(
              formData.speciesRules.qualityThresholds.moistureMax
            ),
          }),
          ...(formData.speciesRules.qualityThresholds.pesticidePPMMax && {
            pesticidePPMMax: parseFloat(
              formData.speciesRules.qualityThresholds.pesticidePPMMax
            ),
          }),
          activeCompounds: {
            ...(formData.speciesRules.qualityThresholds.activeCompounds
              .curcuminMin && {
              curcuminMin: parseFloat(
                formData.speciesRules.qualityThresholds.activeCompounds
                  .curcuminMin
              ),
            }),
            ...(formData.speciesRules.qualityThresholds.activeCompounds
              .withanolidesMin && {
              withanolidesMin: parseFloat(
                formData.speciesRules.qualityThresholds.activeCompounds
                  .withanolidesMin
              ),
            }),
          },
        },
      },
      cultivationInfo: {
        growingSeason: formData.cultivationInfo.growingSeason,
        harvestingMethod: formData.cultivationInfo.harvestingMethod,
        dryingMethod: formData.cultivationInfo.dryingMethod,
        storageRequirements: formData.cultivationInfo.storageRequirements,
      },
    };

    setSubmitting(true);

    try {
      await axios.post(`${BASE_URL}/herbs`, submissionData, {
        headers: headers,
      });
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
      <div className="min-h-screen bg-green-50 text-green-900 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl p-10 border border-green-200">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-emerald-400 via-lime-400 to-green-500 bg-clip-text text-transparent">
                🌿 Add New Herb
              </h1>
              <p className="text-green-800 text-lg">
                Add a new herb to the blockchain-ready database
              </p>
              {formData.name && (
                <p className="text-green-700 text-sm mt-2 font-mono">
                  ID:{" "}
                  <span className="text-emerald-500">
                    {generateHerbId(formData.name)}
                  </span>
                </p>
              )}
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-6 bg-red-200 border border-red-400 text-red-800 px-5 py-3 rounded-xl shadow-inner animate-pulse">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-200 border border-emerald-400 text-emerald-800 px-5 py-3 rounded-xl shadow-inner animate-pulse">
                Herb added successfully! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="bg-white/30 rounded-2xl p-6 border border-green-200">
                <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center">
                  📋 Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Herb Name */}
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Herb Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Turmeric"
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                      required
                    />
                  </div>

                  {/* Scientific Name */}
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Scientific Name *
                    </label>
                    <input
                      type="text"
                      name="scientificName"
                      value={formData.scientificName}
                      onChange={handleChange}
                      placeholder="e.g., Curcuma longa"
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Common Names */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Common Names *
                  </label>
                  {formData.commonNames.map((name, i) => (
                    <div key={i} className="flex items-center mb-3 space-x-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) =>
                          handleCommonNameChange(i, e.target.value)
                        }
                        placeholder={`Common name ${i + 1}`}
                        className="flex-1 bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                      />
                      {formData.commonNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCommonName(i)}
                          className="bg-red-300 hover:bg-red-400 text-red-800 px-3 py-2 rounded-xl transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCommonName}
                    className="text-emerald-600 hover:text-emerald-500 text-sm font-semibold transition-colors"
                  >
                    + Add another common name
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                      required
                    >
                      <option value="">Select category</option>
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Parts Used */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Parts Used *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {partsOptions.map((part) => (
                      <label
                        key={part}
                        className={`flex items-center justify-center cursor-pointer rounded-xl px-3 py-2 border border-green-300 transition-all ${
                          formData.parts.includes(part)
                            ? "bg-emerald-400 text-black border-emerald-500 shadow-md scale-105"
                            : "hover:bg-green-200 hover:text-green-900 hover:scale-105"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.parts.includes(part)}
                          onChange={() => handlePartChange(part)}
                        />
                        {part.replace("_", " ")}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Species Rules Section */}
              <div className="bg-white/30 rounded-2xl p-6 border border-green-200">
                <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center">
                  🌍 Species Rules & Geofencing
                </h2>

                {/* Geofence */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Center Latitude
                    </label>
                    <input
                      type="number"
                      name="speciesRules.geofence.center.latitude"
                      value={formData.speciesRules.geofence.center.latitude}
                      onChange={handleChange}
                      step="0.000001"
                      min="-90"
                      max="90"
                      placeholder="e.g., 28.6139"
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Center Longitude
                    </label>
                    <input
                      type="number"
                      name="speciesRules.geofence.center.longitude"
                      value={formData.speciesRules.geofence.center.longitude}
                      onChange={handleChange}
                      step="0.000001"
                      min="-180"
                      max="180"
                      placeholder="e.g., 77.2090"
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Radius (meters)
                    </label>
                    <input
                      type="number"
                      name="speciesRules.geofence.radiusMeters"
                      value={formData.speciesRules.geofence.radiusMeters}
                      onChange={handleChange}
                      min="1000"
                      placeholder="e.g., 50000"
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    />
                  </div>
                </div>

                {/* Allowed Months - FIXED */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Allowed Harvest Months
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {monthOptions.map((month) => (
                      <label
                        key={month.value}
                        className={`flex items-center justify-center cursor-pointer rounded-lg px-2 py-2 border transition-all text-xs font-medium ${
                          formData.speciesRules.allowedMonths.includes(
                            month.value
                          )
                            ? "bg-emerald-400 text-black border-emerald-500 shadow-md scale-105"
                            : "bg-white/50 border-green-300 hover:bg-green-200 text-green-800 hover:scale-102"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.speciesRules.allowedMonths.includes(
                            month.value
                          )}
                          onChange={() => {
                            setFormData((prev) => ({
                              ...prev,
                              speciesRules: {
                                ...prev.speciesRules,
                                allowedMonths:
                                  prev.speciesRules.allowedMonths.includes(
                                    month.value
                                  )
                                    ? prev.speciesRules.allowedMonths.filter(
                                        (m) => m !== month.value
                                      )
                                    : [
                                        ...prev.speciesRules.allowedMonths,
                                        month.value,
                                      ],
                              },
                            }));
                          }}
                        />
                        {month.label.substring(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quality Thresholds */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Max Moisture (%)
                    </label>
                    <input
                      type="number"
                      name="speciesRules.qualityThresholds.moistureMax"
                      value={
                        formData.speciesRules.qualityThresholds.moistureMax
                      }
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g., 12.5"
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Max Pesticide (PPM)
                    </label>
                    <input
                      type="number"
                      name="speciesRules.qualityThresholds.pesticidePPMMax"
                      value={
                        formData.speciesRules.qualityThresholds.pesticidePPMMax
                      }
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="e.g., 0.5"
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Min Curcumin (%) - For Turmeric
                    </label>
                    <input
                      type="number"
                      name="speciesRules.qualityThresholds.activeCompounds.curcuminMin"
                      value={
                        formData.speciesRules.qualityThresholds.activeCompounds
                          .curcuminMin
                      }
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      placeholder="e.g., 3.0"
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Min Withanolides (%) - For Ashwagandha
                    </label>
                    <input
                      type="number"
                      name="speciesRules.qualityThresholds.activeCompounds.withanolidesMin"
                      value={
                        formData.speciesRules.qualityThresholds.activeCompounds
                          .withanolidesMin
                      }
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      placeholder="e.g., 1.5"
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Cultivation Information Section */}
              <div className="bg-white/30 rounded-2xl p-6 border border-green-200">
                <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center">
                  🌱 Cultivation Information
                </h2>

                {/* Growing Season - FIXED */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Growing Season
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {seasonOptions.map((season) => (
                      <label
                        key={season}
                        className={`flex items-center justify-center cursor-pointer rounded-xl px-3 py-2 border transition-all font-medium ${
                          formData.cultivationInfo.growingSeason.includes(
                            season
                          )
                            ? "bg-emerald-400 text-black border-emerald-500 shadow-md scale-105"
                            : "bg-white/50 border-green-300 hover:bg-green-200 text-green-800 hover:scale-102"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.cultivationInfo.growingSeason.includes(
                            season
                          )}
                          onChange={() => {
                            setFormData((prev) => ({
                              ...prev,
                              cultivationInfo: {
                                ...prev.cultivationInfo,
                                growingSeason:
                                  prev.cultivationInfo.growingSeason.includes(
                                    season
                                  )
                                    ? prev.cultivationInfo.growingSeason.filter(
                                        (s) => s !== season
                                      )
                                    : [
                                        ...prev.cultivationInfo.growingSeason,
                                        season,
                                      ],
                              },
                            }));
                          }}
                        />
                        {season}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Harvesting Method */}
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Harvesting Method
                    </label>
                    <select
                      name="cultivationInfo.harvestingMethod"
                      value={formData.cultivationInfo.harvestingMethod}
                      onChange={handleChange}
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    >
                      <option value="">Select method</option>
                      {harvestingMethods.map((method) => (
                        <option key={method} value={method}>
                          {method.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Drying Method */}
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Drying Method
                    </label>
                    <select
                      name="cultivationInfo.dryingMethod"
                      value={formData.cultivationInfo.dryingMethod}
                      onChange={handleChange}
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    >
                      <option value="">Select method</option>
                      {dryingMethods.map((method) => (
                        <option key={method} value={method}>
                          {method.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Storage Requirements */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Storage Requirements
                  </label>
                  <textarea
                    name="cultivationInfo.storageRequirements"
                    value={formData.cultivationInfo.storageRequirements}
                    onChange={handleChange}
                    placeholder="e.g., Store in cool, dry place. Temperature: 15-25°C, Humidity: <60%"
                    rows="3"
                    className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 px-8 rounded-2xl transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {submitting ? "Adding Herb..." : "🌱 Add Herb to Database"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="flex-1 bg-green-100 hover:bg-green-200 text-green-900 font-medium py-4 px-8 rounded-2xl transition-all"
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
