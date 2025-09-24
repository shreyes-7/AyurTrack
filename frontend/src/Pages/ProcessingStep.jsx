import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiEndpoints } from "../services/api";
import { useSubmit } from "../hooks/useFetch";
import { ButtonLoader } from "../Components/Loader";
import Layout from "../Components/Layout";

export default function ProcessorForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    batchId: "",
    processorName: "",
    processingDate: "",
    processingStep: "drying",
    processingNotes: "",
  });

  const { submit, submitting, error, success } = useSubmit(
    apiEndpoints.createProcessorEvent,
    {
      onSuccess: (result) => {
        console.log("Processing event created:", result);
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

    if (
      !formData.batchId ||
      !formData.processorName ||
      !formData.processingDate
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const submissionData = {
      ...formData,
      timestamp: new Date().toISOString(),
    };

    await submit(submissionData);
  };

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/95 rounded-xl shadow-2xl border border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
              <h2 className="text-2xl font-bold text-white text-center">
                🏭 Processing Form
              </h2>
              <p className="text-blue-100 text-center mt-1">
                Record processing operations
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
                    Processing data submitted successfully!
                  </p>
                </div>
              )}

              {/* Batch ID */}
              <div>
                <label
                  htmlFor="batchId"
                  className="block text-sm font-medium text-blue-800 mb-2"
                >
                  Batch ID *
                </label>
                <input
                  type="text"
                  id="batchId"
                  name="batchId"
                  value={formData.batchId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 placeholder-blue-400"
                  placeholder="Enter batch identification number"
                  required
                />
              </div>

              {/* Processor Name */}
              <div>
                <label
                  htmlFor="processorName"
                  className="block text-sm font-medium text-blue-800 mb-2"
                >
                  Processor Name *
                </label>
                <input
                  type="text"
                  id="processorName"
                  name="processorName"
                  value={formData.processorName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 placeholder-blue-400"
                  placeholder="Enter processor/operator name"
                  required
                />
              </div>

              {/* Processing Date */}
              <div>
                <label
                  htmlFor="processingDate"
                  className="block text-sm font-medium text-blue-800 mb-2"
                >
                  Processing Date *
                </label>
                <input
                  type="date"
                  id="processingDate"
                  name="processingDate"
                  value={formData.processingDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900"
                />
              </div>

              {/* Processing Step */}
              <div>
                <label
                  htmlFor="processingStep"
                  className="block text-sm font-medium text-blue-800 mb-2"
                >
                  Processing Step *
                </label>
                <select
                  id="processingStep"
                  name="processingStep"
                  value={formData.processingStep}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2373A5FF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                  }}
                >
                  <option value="drying">🌡️ Drying</option>
                  <option value="grinding">⚙️ Grinding</option>
                  <option value="sieving">🥄 Sieving</option>
                  <option value="packaging">📦 Packaging</option>
                  <option value="quality_check">✅ Quality Check</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="processingNotes"
                  className="block text-sm font-medium text-blue-800 mb-2"
                >
                  Processing Notes
                </label>
                <textarea
                  id="processingNotes"
                  name="processingNotes"
                  value={formData.processingNotes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 resize-none placeholder-blue-400"
                  placeholder="Enter any processing observations, special procedures, or quality notes..."
                />
              </div>

              {/* Buttons */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <ButtonLoader />
                    <span className="ml-2">Submitting...</span>
                  </>
                ) : (
                  "🏭 Record Processing"
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
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
