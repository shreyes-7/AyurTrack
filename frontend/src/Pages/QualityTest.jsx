import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiEndpoints } from "../services/api";
import { useSubmit } from "../hooks/useFetch";
import { ButtonLoader } from "../Components/Loader";
import Layout from "../Components/Layout";

export default function LabForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    batchId: "",
    labTechnician: "",
    testDate: "",
    moisturePercentage: "",
    pesticideResult: "pass",
    dnaBarcode: "",
    phLevel: "",
    heavyMetals: "pass",
    microbialTest: "pass",
    additionalNotes: "",
    testingFacility: "",
    certificationNumber: "",
  });

  const { submit, submitting, error, success } = useSubmit(
    apiEndpoints.createLabTest,
    {
      onSuccess: (result) => {
        console.log("Lab test result created:", result);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.batchId || !formData.labTechnician || !formData.testDate) {
      alert("Please fill in all required fields");
      return;
    }

    const submissionData = {
      ...formData,
      moisturePercentage: parseFloat(formData.moisturePercentage) || 0,
      phLevel: parseFloat(formData.phLevel) || 0,
      timestamp: new Date().toISOString(),
    };

    await submit(submissionData);
  };

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-purple-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 rounded-xl shadow-2xl border border-purple-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
              <h2 className="text-2xl font-bold text-white text-center">
                🔬 Laboratory Test Form
              </h2>
              <p className="text-purple-100 text-center mt-1">
                Record test results and quality analysis
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error / Success messages */}
              {error && (
                <div className="bg-red-100 border border-red-400 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-100 border border-green-400 rounded-lg p-4">
                  <p className="text-green-700 text-sm">
                    Lab test data submitted successfully!
                  </p>
                </div>
              )}

              {/* Batch ID & Technician */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Batch ID *
                  </label>
                  <input
                    type="text"
                    id="batchId"
                    name="batchId"
                    value={formData.batchId}
                    onChange={handleChange}
                    placeholder="Enter batch identification number"
                    required
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-900 placeholder-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Lab Technician *
                  </label>
                  <input
                    type="text"
                    id="labTechnician"
                    name="labTechnician"
                    value={formData.labTechnician}
                    onChange={handleChange}
                    placeholder="Technician name"
                    required
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-900 placeholder-purple-400"
                  />
                </div>
              </div>

              {/* Test Date & Facility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Test Date *
                  </label>
                  <input
                    type="date"
                    id="testDate"
                    name="testDate"
                    value={formData.testDate}
                    onChange={handleChange}
                    max={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Testing Facility
                  </label>
                  <input
                    type="text"
                    id="testingFacility"
                    name="testingFacility"
                    value={formData.testingFacility}
                    onChange={handleChange}
                    placeholder="Laboratory name"
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-900 placeholder-purple-400"
                  />
                </div>
              </div>

              {/* Moisture & pH */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Moisture Percentage (%)
                  </label>
                  <input
                    type="number"
                    id="moisturePercentage"
                    name="moisturePercentage"
                    value={formData.moisturePercentage}
                    onChange={handleChange}
                    placeholder="0.0"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-900 placeholder-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    pH Level
                  </label>
                  <input
                    type="number"
                    id="phLevel"
                    name="phLevel"
                    value={formData.phLevel}
                    onChange={handleChange}
                    placeholder="7.0"
                    min="0"
                    max="14"
                    step="0.1"
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-900 placeholder-purple-400"
                  />
                </div>
              </div>

              {/* Tests */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Pesticide Test
                  </label>
                  <select
                    id="pesticideResult"
                    name="pesticideResult"
                    value={formData.pesticideResult}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-900"
                  >
                    <option value="pass">✅ Pass</option>
                    <option value="fail">❌ Fail</option>
                    <option value="pending">⏳ Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Heavy Metals Test
                  </label>
                  <select
                    id="heavyMetals"
                    name="heavyMetals"
                    value={formData.heavyMetals}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-900"
                  >
                    <option value="pass">✅ Pass</option>
                    <option value="fail">❌ Fail</option>
                    <option value="pending">⏳ Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Microbial Test
                  </label>
                  <select
                    id="microbialTest"
                    name="microbialTest"
                    value={formData.microbialTest}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-900"
                  >
                    <option value="pass">✅ Pass</option>
                    <option value="fail">❌ Fail</option>
                    <option value="pending">⏳ Pending</option>
                  </select>
                </div>
              </div>

              {/* DNA & Certification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    DNA Barcode
                  </label>
                  <input
                    type="text"
                    id="dnaBarcode"
                    name="dnaBarcode"
                    value={formData.dnaBarcode}
                    onChange={handleChange}
                    placeholder="DNA sequence identifier"
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-900 placeholder-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Certification Number
                  </label>
                  <input
                    type="text"
                    id="certificationNumber"
                    name="certificationNumber"
                    value={formData.certificationNumber}
                    onChange={handleChange}
                    placeholder="Quality certification ID"
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-900 placeholder-purple-400"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  Additional Test Notes
                </label>
                <textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter any additional observations, test conditions, or remarks..."
                  className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-900 placeholder-purple-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-200"
                >
                  {submitting ? (
                    <>
                      <ButtonLoader />
                      <span className="ml-2">Submitting...</span>
                    </>
                  ) : (
                    "🧪 Submit Test Results"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
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
