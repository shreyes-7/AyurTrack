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
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
              <h2 className="text-2xl font-bold text-white text-center">
                🔬 Laboratory Test Form
              </h2>
              <p className="text-purple-100 text-center mt-1">
                Record test results and quality analysis
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-900/50 border border-green-700 rounded-lg p-4">
                  <p className="text-green-300 text-sm">
                    Lab test data submitted successfully!
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="batchId"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Batch ID *
                  </label>
                  <input
                    type="text"
                    id="batchId"
                    name="batchId"
                    value={formData.batchId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-400"
                    placeholder="Enter batch identification number"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="labTechnician"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Lab Technician *
                  </label>
                  <input
                    type="text"
                    id="labTechnician"
                    name="labTechnician"
                    value={formData.labTechnician}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-400"
                    placeholder="Technician name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="testDate"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Test Date *
                  </label>
                  <input
                    type="date"
                    id="testDate"
                    name="testDate"
                    value={formData.testDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100"
                    max={new Date().toISOString().split("T")[0]}
                    required
                    style={{
                      colorScheme: "dark",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="testingFacility"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Testing Facility
                  </label>
                  <input
                    type="text"
                    id="testingFacility"
                    name="testingFacility"
                    value={formData.testingFacility}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-400"
                    placeholder="Laboratory name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="moisturePercentage"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Moisture Percentage (%)
                  </label>
                  <input
                    type="number"
                    id="moisturePercentage"
                    name="moisturePercentage"
                    value={formData.moisturePercentage}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-400"
                    placeholder="0.0"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phLevel"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    pH Level
                  </label>
                  <input
                    type="number"
                    id="phLevel"
                    name="phLevel"
                    value={formData.phLevel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-400"
                    placeholder="7.0"
                    min="0"
                    max="14"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="pesticideResult"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Pesticide Test
                  </label>
                  <select
                    id="pesticideResult"
                    name="pesticideResult"
                    value={formData.pesticideResult}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100"
                  >
                    <option value="pass">✅ Pass</option>
                    <option value="fail">❌ Fail</option>
                    <option value="pending">⏳ Pending</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="heavyMetals"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Heavy Metals Test
                  </label>
                  <select
                    id="heavyMetals"
                    name="heavyMetals"
                    value={formData.heavyMetals}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100"
                  >
                    <option value="pass">✅ Pass</option>
                    <option value="fail">❌ Fail</option>
                    <option value="pending">⏳ Pending</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="microbialTest"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Microbial Test
                  </label>
                  <select
                    id="microbialTest"
                    name="microbialTest"
                    value={formData.microbialTest}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100"
                  >
                    <option value="pass">✅ Pass</option>
                    <option value="fail">❌ Fail</option>
                    <option value="pending">⏳ Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="dnaBarcode"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    DNA Barcode
                  </label>
                  <input
                    type="text"
                    id="dnaBarcode"
                    name="dnaBarcode"
                    value={formData.dnaBarcode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-400"
                    placeholder="DNA sequence identifier"
                  />
                </div>

                <div>
                  <label
                    htmlFor="certificationNumber"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Certification Number
                  </label>
                  <input
                    type="text"
                    id="certificationNumber"
                    name="certificationNumber"
                    value={formData.certificationNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-400"
                    placeholder="Quality certification ID"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="additionalNotes"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Additional Test Notes
                </label>
                <textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-400"
                  placeholder="Enter any additional observations, test conditions, or remarks..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
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
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
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
