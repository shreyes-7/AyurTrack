import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiEndpoints } from "../services/api";
import { useSubmit } from "../hooks/useFetch";
import { ButtonLoader } from "../Components/Loader";
import Layout from "../Components/Layout";

export default function CollectorForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    collectorName: "",
    herbName: "",
    harvestDate: "",
    gpsLat: "",
    gpsLng: "",
    location: "",
    qualityNotes: "",
    quantity: "",
    unit: "kg",
  });

  const { submit, submitting, error, success } = useSubmit(
    apiEndpoints.createCollectorEvent,
    {
      onSuccess: (result) => {
        console.log("Collection event created:", result);
        navigate("/dashboard");
      },
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            gpsLat: position.coords.latitude.toString(),
            gpsLng: position.coords.longitude.toString(),
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Unable to get your location. Please enter coordinates manually."
          );
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.collectorName ||
      !formData.herbName ||
      !formData.harvestDate
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (!formData.gpsLat || !formData.gpsLng) {
      alert("Please provide GPS coordinates");
      return;
    }

    const submissionData = {
      ...formData,
      gpsLat: parseFloat(formData.gpsLat),
      gpsLng: parseFloat(formData.gpsLng),
      quantity: parseFloat(formData.quantity) || 0,
      timestamp: new Date().toISOString(),
    };

    await submit(submissionData);
  };

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-green-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-green-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
              <h2 className="text-2xl font-bold text-white text-center">
                🌿 Herb Collection Form
              </h2>
              <p className="text-green-100 text-center mt-1">
                Record your herb collection data
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-400 rounded-lg p-4">
                  <p className="text-green-700 text-sm">
                    Collection data submitted successfully!
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="collectorName"
                  className="block text-sm font-medium text-green-800 mb-2"
                >
                  Collector Name *
                </label>
                <input
                  type="text"
                  id="collectorName"
                  name="collectorName"
                  value={formData.collectorName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="herbName"
                  className="block text-sm font-medium text-green-800 mb-2"
                >
                  Herb Name *
                </label>
                <input
                  type="text"
                  id="herbName"
                  name="herbName"
                  value={formData.herbName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-400"
                  placeholder="e.g., Ashwagandha, Turmeric"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="harvestDate"
                  className="block text-sm font-medium text-green-800 mb-2"
                >
                  Harvest Date *
                </label>
                <input
                  type="date"
                  id="harvestDate"
                  name="harvestDate"
                  value={formData.harvestDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900"
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-green-800 mb-2"
                  >
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-400"
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="unit"
                    className="block text-sm font-medium text-green-800 mb-2"
                  >
                    Unit
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900"
                  >
                    <option value="kg">Kilograms</option>
                    <option value="g">Grams</option>
                    <option value="tons">Tons</option>
                  </select>
                </div>
              </div>

              {/* GPS */}
              <div>
                <label className="block text-sm font-medium text-green-800 mb-2">
                  GPS Coordinates *
                </label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    📍 Get Current Location
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      name="gpsLat"
                      value={formData.gpsLat}
                      onChange={handleChange}
                      className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-400"
                      placeholder="Latitude"
                      step="any"
                      required
                    />
                    <input
                      type="number"
                      name="gpsLng"
                      value={formData.gpsLng}
                      onChange={handleChange}
                      className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-400"
                      placeholder="Longitude"
                      step="any"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="qualityNotes"
                  className="block text-sm font-medium text-green-800 mb-2"
                >
                  Quality Notes
                </label>
                <textarea
                  id="qualityNotes"
                  name="qualityNotes"
                  value={formData.qualityNotes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-400"
                  placeholder="Note any observations about quality, appearance, etc."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <ButtonLoader />
                    <span className="ml-2">Submitting...</span>
                  </>
                ) : (
                  "🌱 Record Collection"
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full bg-green-100 hover:bg-green-200 text-green-900 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
