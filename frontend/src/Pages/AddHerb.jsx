import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../Components/Layout";

export default function AddHerb() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Basic species information
    species: "",
    displayName: "",
    scientificName: "",
    commonNames: [""],
    category: "",
    
    // Geofence rules (as per chaincode)
    geofence: {
      center: {
        lat: "",
        long: ""
      },
      radiusMeters: ""
    },
    
    // Allowed harvest months (as per chaincode)
    allowedMonths: [],
    
    // Quality thresholds (as per chaincode)
    qualityThresholds: {
      moistureMax: "",
      pesticidePPMMax: "",
      // Optional active compound minimums
      curcuminMin: "",
      withanolidesMin: "",
      customCompound: {
        name: "",
        value: ""
      }
    },

    // Additional metadata (for database)
    parts: [],
    regulatoryInfo: {
      authority: "",
      licenseRequired: false,
      certificationRequired: []
    },
    cultivationInfo: {
      growingSeason: [],
      harvestingMethod: "",
      dryingMethod: "",
      storageRequirements: ""
    }
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const categoryOptions = [
    "MEDICINAL",
    "CULINARY", 
    "AROMATIC",
    "ADAPTOGEN",
    "DIGESTIVE",
    "RESPIRATORY",
    "IMMUNE",
    "OTHER"
  ];

  const partsOptions = [
    "ROOT",
    "LEAF",
    "STEM",
    "FLOWER",
    "SEED",
    "BARK",
    "FRUIT",
    "WHOLE_PLANT"
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
    { value: 12, label: "December" }
  ];

  const seasonOptions = ["SPRING", "SUMMER", "MONSOON", "AUTUMN", "WINTER"];
  const harvestingMethods = ["MANUAL", "MECHANICAL", "SEMI_AUTOMATED"];
  const dryingMethods = ["SUN_DRYING", "SHADE_DRYING", "MECHANICAL_DRYING", "FREEZE_DRYING"];
  const certificationOptions = ["ORGANIC", "FAIR_TRADE", "ISO_22000", "HACCP", "GMP", "FDA_APPROVED"];

  // Generate herb ID in the specified format: H{HerbName}{FlooredLat}{FlooredLng}
  const generateHerbId = (species, latitude, longitude) => {
    if (!species || !latitude || !longitude) return "";
    
    const herbName = species.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z]/g, "");
    const lat = Math.floor(parseFloat(latitude));
    const lng = Math.floor(parseFloat(longitude));
    
    return `H${herbName}${lat}${lng}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
        return newData;
      });
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
  };

  const handleCommonNameChange = (index, value) => {
    const newCommonNames = [...formData.commonNames];
    newCommonNames[index] = value;
    setFormData(prev => ({ ...prev, commonNames: newCommonNames }));
  };

  const addCommonName = () =>
    setFormData(prev => ({
      ...prev,
      commonNames: [...prev.commonNames, ""]
    }));

  const removeCommonName = (index) => {
    const newCommonNames = formData.commonNames.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      commonNames: newCommonNames.length > 0 ? newCommonNames : [""]
    }));
  };

  const handlePartChange = (part) => {
    setFormData(prev => {
      const newParts = prev.parts.includes(part)
        ? prev.parts.filter(p => p !== part)
        : [...prev.parts, part];
      return { ...prev, parts: newParts };
    });
  };

  const handleMonthChange = (month) => {
    setFormData(prev => ({
      ...prev,
      allowedMonths: prev.allowedMonths.includes(month)
        ? prev.allowedMonths.filter(m => m !== month)
        : [...prev.allowedMonths, month]
    }));
  };

  const handleSeasonChange = (season) => {
    setFormData(prev => ({
      ...prev,
      cultivationInfo: {
        ...prev.cultivationInfo,
        growingSeason: prev.cultivationInfo.growingSeason.includes(season)
          ? prev.cultivationInfo.growingSeason.filter(s => s !== season)
          : [...prev.cultivationInfo.growingSeason, season]
      }
    }));
  };

  const handleCertificationChange = (cert) => {
    setFormData(prev => ({
      ...prev,
      regulatoryInfo: {
        ...prev.regulatoryInfo,
        certificationRequired: prev.regulatoryInfo.certificationRequired.includes(cert)
          ? prev.regulatoryInfo.certificationRequired.filter(c => c !== cert)
          : [...prev.regulatoryInfo.certificationRequired, cert]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Basic validation
    if (!formData.species || !formData.displayName || !formData.scientificName) {
      setError("Please fill in species name, display name, and scientific name.");
      return;
    }

    if (!formData.geofence.center.lat || !formData.geofence.center.long) {
      setError("Please provide latitude and longitude for geofence center.");
      return;
    }

    const filteredCommonNames = formData.commonNames.filter(n => n.trim() !== "");

    // Prepare species rules data (for chaincode)
    const speciesRulesData = {
      species: formData.species,
      geofence: {
        center: {
          lat: parseFloat(formData.geofence.center.lat),
          long: parseFloat(formData.geofence.center.long)
        },
        radiusMeters: formData.geofence.radiusMeters ? 
          parseInt(formData.geofence.radiusMeters) : 50000
      },
      allowedMonths: formData.allowedMonths,
      qualityThresholds: {
        ...(formData.qualityThresholds.moistureMax && {
          moistureMax: parseFloat(formData.qualityThresholds.moistureMax)
        }),
        ...(formData.qualityThresholds.pesticidePPMMax && {
          pesticidePPMMax: parseFloat(formData.qualityThresholds.pesticidePPMMax)
        }),
        ...(formData.qualityThresholds.curcuminMin && {
          curcuminMin: parseFloat(formData.qualityThresholds.curcuminMin)
        }),
        ...(formData.qualityThresholds.withanolidesMin && {
          withanolidesMin: parseFloat(formData.qualityThresholds.withanolidesMin)
        }),
        ...(formData.qualityThresholds.customCompound.name && 
            formData.qualityThresholds.customCompound.value && {
          [formData.qualityThresholds.customCompound.name]: 
            parseFloat(formData.qualityThresholds.customCompound.value)
        })
      }
    };

    // Prepare herb database entry
    const herbDatabaseEntry = {
      id: generateHerbId(
        formData.species, 
        formData.geofence.center.lat, 
        formData.geofence.center.long
      ),
      name: formData.displayName,
      species: formData.species,
      scientificName: formData.scientificName,
      commonNames: filteredCommonNames,
      category: formData.category,
      parts: formData.parts,
      
      // Include species rules for database reference
      speciesRules: speciesRulesData,

      regulatoryInfo: {
        authority: formData.regulatoryInfo.authority || undefined,
        licenseRequired: formData.regulatoryInfo.licenseRequired,
        certificationRequired: formData.regulatoryInfo.certificationRequired
      },

      cultivationInfo: {
        growingSeason: formData.cultivationInfo.growingSeason,
        harvestingMethod: formData.cultivationInfo.harvestingMethod || undefined,
        dryingMethod: formData.cultivationInfo.dryingMethod || undefined,
        storageRequirements: formData.cultivationInfo.storageRequirements || undefined
      }
    };

    setSubmitting(true);

    try {
      // First, add species rules to blockchain (this would be done via chaincode)
      console.log("Species rules for blockchain:", speciesRulesData);
      
      // Then, add herb to database
      await axios.post("http://localhost:3000/v1/herbs", herbDatabaseEntry);
      
      setSuccess(true);
      setTimeout(() => navigate("/admin"), 2000);
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to create herb species.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentHerbId = generateHerbId(
    formData.species,
    formData.geofence.center.lat,
    formData.geofence.center.long
  );

  return (
    <Layout>
      <div className="min-h-screen bg-green-50 text-green-900 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl p-10 border border-green-200">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-emerald-400 via-lime-400 to-green-500 bg-clip-text text-transparent">
                🌿 Add Herb Species
              </h1>
              <p className="text-green-800 text-lg">
                Add new herb species with blockchain validation rules
              </p>
              {currentHerbId && (
                <p className="text-green-700 text-sm mt-2 font-mono">
                  Generated ID: <span className="text-emerald-500">{currentHerbId}</span>
                </p>
              )}
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-6 bg-red-200 border border-red-400 text-red-800 px-5 py-3 rounded-xl shadow-inner">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-200 border border-emerald-400 text-emerald-800 px-5 py-3 rounded-xl shadow-inner">
                Herb species added successfully! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Species Information */}
              <div className="bg-green-50/50 p-6 rounded-2xl border border-green-200">
                <h3 className="text-xl font-bold text-green-800 mb-4">📝 Species Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Species Name (for rules) *
                    </label>
                    <input
                      type="text"
                      name="species"
                      value={formData.species}
                      onChange={handleChange}
                      placeholder="e.g., Ashwagandha (exact match for chaincode)"
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                      required
                    />
                    <p className="text-xs text-green-600 mt-1">This must match exactly with chaincode species rules</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      placeholder="e.g., Ashwagandha Root Extract"
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Scientific Name *
                    </label>
                    <input
                      type="text"
                      name="scientificName"
                      value={formData.scientificName}
                      onChange={handleChange}
                      placeholder="e.g., Withania somnifera"
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-white/50 border border-green-300 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    >
                      <option value="">Select category</option>
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Common Names */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Common Names
                  </label>
                  {formData.commonNames.map((name, i) => (
                    <div key={i} className="flex items-center mb-3 space-x-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleCommonNameChange(i, e.target.value)}
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

                {/* Parts Used */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Parts Used
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {partsOptions.map(part => (
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
                        {part}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Blockchain Geofence Rules */}
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-200">
                <h3 className="text-xl font-bold text-blue-800 mb-4">🔗 Blockchain Geofence Rules</h3>
                <p className="text-sm text-blue-700 mb-4">These rules will be stored in the blockchain for collection validation</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 mb-2">
                      Center Latitude *
                    </label>
                    <input
                      type="number"
                      name="geofence.center.lat"
                      value={formData.geofence.center.lat}
                      onChange={handleChange}
                      step="0.000001"
                      min="-90"
                      max="90"
                      placeholder="e.g., 26.9124"
                      className="w-full bg-white/50 border border-blue-300 rounded-xl px-4 py-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-blue-700 mb-2">
                      Center Longitude *
                    </label>
                    <input
                      type="number"
                      name="geofence.center.long"
                      value={formData.geofence.center.long}
                      onChange={handleChange}
                      step="0.000001"
                      min="-180"
                      max="180"
                      placeholder="e.g., 75.7873"
                      className="w-full bg-white/50 border border-blue-300 rounded-xl px-4 py-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-blue-700 mb-2">
                      Radius (meters)
                    </label>
                    <input
                      type="number"
                      name="geofence.radiusMeters"
                      value={formData.geofence.radiusMeters}
                      onChange={handleChange}
                      min="1000"
                      placeholder="50000 (default)"
                      className="w-full bg-white/50 border border-blue-300 rounded-xl px-4 py-3 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    />
                  </div>
                </div>

                {/* Allowed Harvest Months */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-blue-700 mb-2">
                    Allowed Harvest Months (Blockchain Validation)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {monthOptions.map(month => (
                      <label
                        key={month.value}
                        className={`flex items-center justify-center cursor-pointer rounded-lg px-2 py-1 border border-blue-300 transition-all text-xs ${
                          formData.allowedMonths.includes(month.value)
                            ? "bg-blue-400 text-white border-blue-500"
                            : "hover:bg-blue-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.allowedMonths.includes(month.value)}
                          onChange={() => handleMonthChange(month.value)}
                        />
                        {month.label.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Blockchain Quality Thresholds */}
              <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-200">
                <h3 className="text-xl font-bold text-purple-800 mb-4">🔬 Blockchain Quality Thresholds</h3>
                <p className="text-sm text-purple-700 mb-4">Maximum allowed values for blockchain validation during collection</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-purple-700 mb-2">
                      Maximum Moisture (%)
                    </label>
                    <input
                      type="number"
                      name="qualityThresholds.moistureMax"
                      value={formData.qualityThresholds.moistureMax}
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g., 10.0"
                      className="w-full bg-white/50 border border-purple-300 rounded-xl px-4 py-3 text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-700 mb-2">
                      Maximum Pesticide PPM
                    </label>
                    <input
                      type="number"
                      name="qualityThresholds.pesticidePPMMax"
                      value={formData.qualityThresholds.pesticidePPMMax}
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      placeholder="e.g., 2.0"
                      className="w-full bg-white/50 border border-purple-300 rounded-xl px-4 py-3 text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-700 mb-2">
                      Minimum Curcumin (%) - Optional
                    </label>
                    <input
                      type="number"
                      name="qualityThresholds.curcuminMin"
                      value={formData.qualityThresholds.curcuminMin}
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      placeholder="e.g., 3.0 (for turmeric)"
                      className="w-full bg-white/50 border border-purple-300 rounded-xl px-4 py-3 text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-purple-700 mb-2">
                      Minimum Withanolides (%) - Optional
                    </label>
                    <input
                      type="number"
                      name="qualityThresholds.withanolidesMin"
                      value={formData.qualityThresholds.withanolidesMin}
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      placeholder="e.g., 2.5 (for ashwagandha)"
                      className="w-full bg-white/50 border border-purple-300 rounded-xl px-4 py-3 text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                    />
                  </div>

                  {/* Custom Active Compound */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-purple-700 mb-2">
                      Custom Active Compound (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="qualityThresholds.customCompound.name"
                        value={formData.qualityThresholds.customCompound.name}
                        onChange={handleChange}
                        placeholder="Compound name"
                        className="w-full bg-white/50 border border-purple-300 rounded-xl px-4 py-3 text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                      />
                      <input
                        type="number"
                        name="qualityThresholds.customCompound.value"
                        value={formData.qualityThresholds.customCompound.value}
                        onChange={handleChange}
                        step="0.1"
                        min="0"
                        placeholder="Minimum value"
                        className="w-full bg-white/50 border border-purple-300 rounded-xl px-4 py-3 text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information Sections (Similar to previous code) */}
              {/* ... Regulatory Information ... */}
              {/* ... Cultivation Information ... */}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {submitting ? "Adding Species..." : "🌱 Add Herb Species & Rules"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-4 px-6 rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </div>

              {/* Blockchain Rules Preview */}
              {formData.species && formData.geofence.center.lat && formData.geofence.center.long && (
                <div className="bg-gray-100/50 border border-gray-300 rounded-2xl p-4 mt-6">
                  <h4 className="font-semibold text-gray-800 mb-2">Blockchain Species Rules Preview:</h4>
                  <pre className="text-xs text-gray-700 overflow-x-auto bg-white p-3 rounded">
{JSON.stringify({
  species: formData.species,
  geofence: {
    center: {
      lat: parseFloat(formData.geofence.center.lat) || 0,
      long: parseFloat(formData.geofence.center.long) || 0
    },
    radiusMeters: parseInt(formData.geofence.radiusMeters) || 50000
  },
  allowedMonths: formData.allowedMonths,
  qualityThresholds: {
    ...(formData.qualityThresholds.moistureMax && {moistureMax: parseFloat(formData.qualityThresholds.moistureMax)}),
    ...(formData.qualityThresholds.pesticidePPMMax && {pesticidePPMMax: parseFloat(formData.qualityThresholds.pesticidePPMMax)})
  }
}, null, 2)}
                  </pre>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Generated ID:</strong> {currentHerbId}
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
