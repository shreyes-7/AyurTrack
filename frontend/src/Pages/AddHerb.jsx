import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../Components/Layout";

export default function AddHerb() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    scientificName: "",
    commonNames: [""], // Array to handle multiple common names
    category: "",
    parts: [] // Array for multiple parts
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Category options based on your API data
  const categoryOptions = [
    "MEDICINAL",
    "ADAPTOGEN", 
    "RESPIRATORY",
    "DIGESTIVE",
    "CULINARY",
    "AROMATIC"
  ];

  // Parts options
  const partsOptions = [
    "LEAF",
    "ROOT", 
    "BARK",
    "SEED",
    "FLOWER",
    "FRUIT",
    "STEM",
    "WHOLE_PLANT"
  ];

  // Generate herb ID based on name
  const generateHerbId = (name) => {
    return `HERB_${name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '')}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle common names array
  const handleCommonNameChange = (index, value) => {
    const newCommonNames = [...formData.commonNames];
    newCommonNames[index] = value;
    setFormData((prev) => ({
      ...prev,
      commonNames: newCommonNames
    }));
  };

  const addCommonName = () => {
    setFormData((prev) => ({
      ...prev,
      commonNames: [...prev.commonNames, ""]
    }));
  };

  const removeCommonName = (index) => {
    const newCommonNames = formData.commonNames.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      commonNames: newCommonNames.length > 0 ? newCommonNames : [""]
    }));
  };

  // Handle parts selection (checkbox)
  const handlePartChange = (part) => {
    setFormData((prev) => {
      const newParts = prev.parts.includes(part)
        ? prev.parts.filter(p => p !== part)
        : [...prev.parts, part];
      return {
        ...prev,
        parts: newParts
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.name || !formData.scientificName || !formData.category) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.parts.length === 0) {
      setError("Please select at least one plant part");
      return;
    }

    // Filter out empty common names
    const filteredCommonNames = formData.commonNames.filter(name => name.trim() !== "");
    if (filteredCommonNames.length === 0) {
      setError("Please add at least one common name");
      return;
    }

    // Prepare submission data in the required format
    const submissionData = {
      id: generateHerbId(formData.name),
      name: formData.name,
      scientificName: formData.scientificName,
      commonNames: filteredCommonNames,
      category: formData.category,
      parts: formData.parts
    };

    setSubmitting(true);

    try {
      const response = await axios.post('http://localhost:3000/v1/herbs', submissionData);
      console.log("Herb created:", response.data);
      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        navigate("/admin");
      }, 2000);

    } catch (err) {
      console.error('Error creating herb:', err);
      setError(err.response?.data?.message || 'Failed to create herb. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 shadow-xl rounded-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                🌿 Add New Herb
              </h1>
              <p className="text-gray-400">
                Add a new herb to the database
              </p>
              {formData.name && (
                <p className="text-gray-500 text-sm mt-2">
                  Generated ID: <span className="font-mono text-emerald-400">{generateHerbId(formData.name)}</span>
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-lg">
                Herb added successfully! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Herb Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Herb Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 focus:bg-gray-600 transition-colors duration-200"
                  placeholder="e.g., Cumin"
                />
              </div>

              {/* Scientific Name */}
              <div>
                <label htmlFor="scientificName" className="block text-sm font-medium text-gray-300 mb-2">
                  Scientific Name *
                </label>
                <input
                  type="text"
                  id="scientificName"
                  name="scientificName"
                  value={formData.scientificName}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 focus:bg-gray-600 transition-colors duration-200"
                  placeholder="e.g., Cuminum cyminum"
                />
              </div>

              {/* Common Names */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Common Names *
                </label>
                <p className="text-gray-500 text-xs mb-3">Add local and regional names for this herb</p>
                {formData.commonNames.map((commonName, index) => (
                  <div key={index} className="flex mb-3">
                    <input
                      type="text"
                      value={commonName}
                      onChange={(e) => handleCommonNameChange(index, e.target.value)}
                      className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 focus:bg-gray-600 transition-colors duration-200"
                      placeholder={`e.g., ${index === 0 ? 'Jeera' : index === 1 ? 'Zeera' : index === 2 ? 'Jilakarra' : 'Common name'}`}
                    />
                    {formData.commonNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCommonName(index)}
                        className="ml-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                        title="Remove this common name"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCommonName}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center"
                >
                  <span className="mr-1">+</span> Add another common name
                </button>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 focus:bg-gray-600 transition-colors duration-200"
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parts Used */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Parts Used *
                </label>
                <p className="text-gray-500 text-xs mb-3">Select which parts of the plant are used</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {partsOptions.map((part) => (
                    <label key={part} className="flex items-center space-x-2 text-gray-300 cursor-pointer hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.parts.includes(part)}
                        onChange={() => handlePartChange(part)}
                        className="rounded border-gray-600 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-gray-800 bg-gray-700"
                      />
                      <span className="text-sm">{part}</span>
                    </label>
                  ))}
                </div>
                {formData.parts.length > 0 && (
                  <p className="text-emerald-400 text-xs mt-2">
                    Selected: {formData.parts.join(", ")}
                  </p>
                )}
              </div>

              {/* Data Preview */}
              {formData.name && formData.scientificName && formData.category && formData.parts.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Data Preview:</h3>
                  <pre className="text-xs text-gray-400 overflow-x-auto">
{JSON.stringify({
  id: generateHerbId(formData.name),
  name: formData.name,
  scientificName: formData.scientificName,
  commonNames: formData.commonNames.filter(name => name.trim() !== ""),
  category: formData.category,
  parts: formData.parts
}, null, 2)}
                  </pre>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Adding Herb...
                    </>
                  ) : (
                    "🌱 Add Herb"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
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