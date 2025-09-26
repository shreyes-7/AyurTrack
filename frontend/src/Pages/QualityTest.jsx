import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiEndpoints } from "../services/api";
import { useSubmit } from "../hooks/useFetch";
import { ButtonLoader } from "../Components/Loader";
import Layout from "../Components/Layout";
import axios from "axios";
import { getAuthHeaders } from "../utils/tokenUtils";
import { BASE_URL } from "../../api";

// Test types configuration based on chaincode requirements
const TEST_TYPES = [
  {
    id: "moisturetest",
    name: "Moisture Test",
    icon: "💧",
    description:
      "Determines moisture content using Loss on Drying (LOD) method",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "pesticidetest",
    name: "Pesticide Test",
    icon: "🧪",
    description:
      "Analyzes pesticide residue levels using advanced chromatography",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  {
    id: "activecompound",
    name: "Active Compound",
    icon: "🔬",
    description: "Measures bioactive compounds specific to each herb species",
    color: "bg-green-100 text-green-800 border-green-200",
  },
];

// Pesticide compounds for multi-select input
const PESTICIDE_COMPOUNDS = [
  "organophosphates",
  "organochlorines",
  "carbamates",
  "pyrethroids",
  "neonicotinoids",
  "triazines",
  "glyphosate",
  "paraquat",
];

// Species-specific active compounds
const ACTIVE_COMPOUNDS_BY_SPECIES = {
  Ashwagandha: { compound: "withanolides", unit: "%", min: 0.3 },
  Turmeric: { compound: "curcumin", unit: "%", min: 3.0 },
  Tulsi: { compound: "eugenol", unit: "%", min: 0.1 },
  Amla: { compound: "vitamin_c", unit: "mg/100g", min: 500 },
  Neem: { compound: "azadirachtin", unit: "ppm", min: 300 },
};

export default function LabTesterPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [timestampStatus, setTimestampStatus] = useState("idle");

  // Get lab info from session/context
  const [labInfo, setLabInfo] = useState(null);

  const [formData, setFormData] = useState({
    // User inputs - ALL INPUT FIELDS
    batchId: "", // Input: Batch ID to identify which herb batch to test
    herbSpecies: "", // Input: Name of herb species (tells lab which herb they're testing)
    testType: "", // Dropdown: moisturetest/pesticidetest/activecompound

    // Test results (varies by test type)
    // Moisture test parameters
    moisture: "", // Input: e.g., 8.2
    moistureMethod: "", // Input: e.g., "LOD"
    temperature: "", // Input: e.g., "105C"

    // Pesticide test parameters
    pesticidePPM: "", // Input: e.g., 1.1
    compoundsTested: "", // Input: comma-separated list e.g., "organophosphates, organochlorines"
    pesticideMethod: "", // Input: e.g., "GC-MS"

    // Active compound test parameters
    activeCompoundLevel: "", // Input: Withanolides level, Curcumin level, etc.
    activeCompoundMethod: "", // Input: e.g., "HPLC"
    standard: "", // Input: e.g., "USP monograph"

    // Auto-generated fields (backend will generate these)
    testId: "", // TEST_${Date.now()}_${labId}
    labId: "", // From logged-in lab session
    timestamp: "", // Current ISO timestamp

    // Additional optional inputs
    notes: "", // Input: Additional testing notes
    certificationRef: "", // Input: Internal certification reference
    operator: "", // Input: Name of lab operator
    equipmentUsed: "", // Input: Equipment used for testing
  });

  const { submit, submitting, error, success } = useSubmit(
    apiEndpoints.addQualityTest,
    {
      onSuccess: (result) => {
        console.log("Quality test created:", result);
        setTimeout(() => navigate("/dashboard"), 2000);
      },
    }
  );

  // Simulate getting lab info from authentication context
  useEffect(() => {
    // In real implementation, this would come from your auth context/JWT token
    const mockLabInfo = {
      id: "L266201K3X", // Following your ID pattern: L + timestamp + random
      name: "Advanced Quality Testing Lab",
      blockchainUserId: "L266201K3X",
      mspId: "Org2MSP",
      certifications: ["ISO17025", "NABL"],
      location: "Mumbai",
    };
    setLabInfo(mockLabInfo);

    // Generate test ID
    const timestamp = Date.now();
    setFormData((prev) => ({
      ...prev,
      labId: mockLabInfo.blockchainUserId,
      testId: `TEST_${timestamp}_${mockLabInfo.blockchainUserId}`,
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCurrentTimestamp = () => {
    setTimestampStatus("loading");
    setTimeout(() => {
      const currentTimestamp = new Date().toISOString();
      setFormData((prev) => ({
        ...prev,
        timestamp: currentTimestamp,
      }));
      setTimestampStatus("success");
    }, 500);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.batchId && formData.herbSpecies && formData.testType;
      case 2:
        if (formData.testType === "moisturetest") {
          return (
            formData.moisture && formData.moistureMethod && formData.temperature
          );
        }
        if (formData.testType === "pesticidetest") {
          return (
            formData.pesticidePPM &&
            formData.compoundsTested &&
            formData.pesticideMethod
          );
        }
        if (formData.testType === "activecompound") {
          return (
            formData.activeCompoundLevel &&
            formData.activeCompoundMethod &&
            formData.standard
          );
        }
        return false;
      case 3:
        return formData.timestamp;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    } else {
      alert("Please fill in all required fields for this step.");
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const headers = await getAuthHeaders();

      if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
        alert("Please fill in all required fields");
        return;
      }

      if (!labInfo?.blockchainUserId) {
        alert("Lab authentication required");
        return;
      }

      // Prepare results object based on test type (following chaincode structure)
      let results = {};

      if (formData.testType === "moisturetest") {
        results = {
          moisture: parseFloat(formData.moisture),
          method: formData.moistureMethod,
          temperature: formData.temperature,
        };
      } else if (formData.testType === "pesticidetest") {
        // Convert comma-separated string to array
        const compoundsArray = formData.compoundsTested
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c);
        results = {
          pesticidePPM: parseFloat(formData.pesticidePPM),
          compounds_tested: compoundsArray,
          method: formData.pesticideMethod,
        };
      } else if (formData.testType === "activecompound") {
        // Determine compound name based on species
        const compoundInfo = ACTIVE_COMPOUNDS_BY_SPECIES[formData.herbSpecies];
        if (compoundInfo) {
          results[compoundInfo.compound] = formData.activeCompoundLevel;
        }
        results.method = formData.activeCompoundMethod;
        results.standard = formData.standard;
      }

      // Add optional parameters
      if (formData.operator) results.operator = formData.operator;
      if (formData.equipmentUsed) results.equipment = formData.equipmentUsed;
      if (formData.notes) results.notes = formData.notes;

      // Prepare data in the format expected by the chaincode
      // Prepare data in the format expected by the chaincode
// Prepare data in the format expected by the chaincode/service
const submissionData = {
  testId: formData.testId,
  batchId: formData.batchId,
  herbSpecies: formData.herbSpecies,  // <-- add this
  labId: labInfo.blockchainUserId,
  testType: formData.testType,
  results: results,                   // <-- send as object, not string
  timestamp: formData.timestamp,
};

      const response = await axios.post(
        `${BASE_URL}/quality-tests/batch/${formData.batchId}/test`,
        submissionData,
        { headers: headers }
      );

      if (response.data.success) {
        console.log("Quality test created:", response.data);
      }
      console.log("Submitting quality test data:", submissionData);
      await submit(submissionData);
    } catch (error) {
      console.error("Error submitting quality test:", error);
    }
  };

  const getSelectedTestType = () =>
    TEST_TYPES.find((t) => t.id === formData.testType);
  const getActiveCompoundInfo = () => {
    if (!formData.herbSpecies) return null;
    return ACTIVE_COMPOUNDS_BY_SPECIES[formData.herbSpecies];
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mb-4">
              <span className="text-2xl">🔬</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Laboratory Testing Portal
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Conduct comprehensive quality analysis with advanced testing
              protocols and blockchain verification
            </p>

            {labInfo && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg inline-block">
                <div className="text-sm text-purple-800">
                  <strong>Laboratory:</strong> {labInfo.name}
                  <span className="ml-2 font-mono text-xs">
                    ({labInfo.blockchainUserId})
                  </span>
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  Certifications: {labInfo.certifications.join(", ")} |
                  Location: {labInfo.location}
                </div>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium
                    ${
                      currentStep >= step
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }
                  `}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`
                      w-20 h-1 mx-2
                      ${
                        currentStep > step
                          ? "bg-gradient-to-r from-purple-500 to-indigo-500"
                          : "bg-gray-200"
                      }
                    `}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4 space-x-12">
              <span className="text-sm font-medium text-gray-600">
                Batch & Test Selection
              </span>
              <span className="text-sm font-medium text-gray-600">
                Test Parameters
              </span>
              <span className="text-sm font-medium text-gray-600">
                Review & Submit
              </span>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Lab Info Banner */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white text-sm">
                <div>
                  <span className="font-medium">Test ID:</span>
                  <div className="font-mono text-xs">{formData.testId}</div>
                </div>
                <div>
                  <span className="font-medium">Lab ID:</span>
                  <div className="font-mono text-xs">
                    {labInfo?.blockchainUserId || "Loading..."}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Organization:</span>
                  <div className="font-mono text-xs">
                    {labInfo?.mspId || "Loading..."}
                  </div>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <span className="text-red-600 text-2xl mr-3">⚠️</span>
                <div className="text-red-800">{error}</div>
              </div>
            )}

            {success && (
              <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                <span className="text-green-600 text-2xl mr-3">✅</span>
                <div className="text-green-800">
                  Quality test data submitted successfully to blockchain!
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6">
              {/* Step 1: Batch & Test Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="text-purple-600 mr-2">📋</span>
                    Batch & Test Selection
                  </h2>

                  {/* Key Information Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="mr-2">ℹ️</span>
                      Key Information
                    </h3>
                    <div className="text-sm text-blue-800 space-y-2">
                      <div>
                        <strong>Batch ID:</strong> Identifies which specific
                        herb batch you are testing
                      </div>
                      <div>
                        <strong>Herb Species:</strong> Tells you which type of
                        herb you are testing (e.g., Ashwagandha, Turmeric) -
                        determines active compound test parameters
                      </div>
                      <div>
                        <strong>Test Type:</strong> The specific quality
                        analysis you are performing
                      </div>
                    </div>
                  </div>

                  {/* Batch ID Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center">
                        📋 Batch ID *{" "}
                        <span className="ml-2 text-xs text-gray-500">
                          (Identifies which batch to test)
                        </span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="batchId"
                      value={formData.batchId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter batch ID (e.g., BATCH_1737360000000_F266201K3X)"
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      Enter the complete batch ID that you want to test
                    </div>
                  </div>

                  {/* Herb Species Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center">
                        🌿 Herb Species *{" "}
                        <span className="ml-2 text-xs text-gray-500">
                          (Tells you which herb you're testing)
                        </span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="herbSpecies"
                      value={formData.herbSpecies}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter herb species name (e.g., Ashwagandha, Turmeric, Tulsi)"
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      This identifies which type of herb you are testing and
                      determines the active compound parameters
                    </div>
                  </div>

                  {/* Current Testing Target Preview */}
                  {formData.batchId && formData.herbSpecies && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">🎯</span>
                        Testing Target
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Batch ID:</span>
                            <span className="font-mono text-sm">
                              {formData.batchId}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Herb Species:</span>
                            <span className="font-medium text-green-800">
                              {formData.herbSpecies}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Laboratory:</span>
                            <span className="font-medium">{labInfo?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="text-blue-600 font-medium">
                              Ready for Testing
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Test Type *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {TEST_TYPES.map((test) => (
                        <div
                          key={test.id}
                          className={`
                            relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-200
                            ${
                              formData.testType === test.id
                                ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                                : `border-gray-200 hover:border-gray-300 hover:bg-gray-50`
                            }
                          `}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              testType: test.id,
                            }))
                          }
                        >
                          <div className="text-center">
                            <span className="text-3xl mb-3 block">
                              {test.icon}
                            </span>
                            <h3 className="font-semibold text-gray-800 mb-2">
                              {test.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {test.description}
                            </p>
                            {formData.testType === test.id && (
                              <div className="absolute top-3 right-3 text-purple-500">
                                ✓
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Test Type Preview */}
                  {getSelectedTestType() && (
                    <div
                      className={`p-4 rounded-lg border-l-4 border-purple-500 ${
                        getSelectedTestType().color
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {getSelectedTestType().icon}
                        </span>
                        <div>
                          <h3 className="font-semibold">
                            {getSelectedTestType().name}
                          </h3>
                          <p className="text-sm mt-1">
                            {getSelectedTestType().description}
                          </p>
                          {formData.herbSpecies &&
                            formData.testType === "activecompound" &&
                            getActiveCompoundInfo() && (
                              <p className="text-xs mt-2 font-medium">
                                Target compound for {formData.herbSpecies}:{" "}
                                {getActiveCompoundInfo().compound}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Test Parameters */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="text-indigo-600 mr-2">⚗️</span>
                    Test Parameters & Results for {formData.herbSpecies}
                  </h2>

                  {/* Moisture Test Parameters */}
                  {formData.testType === "moisturetest" && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">💧</span>
                        Moisture Test Configuration for {formData.herbSpecies}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Moisture Level *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name="moisture"
                              value={formData.moisture}
                              onChange={handleChange}
                              step="0.1"
                              min="0"
                              max="100"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              placeholder="e.g., 8.2"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <span className="text-gray-500 text-sm">%</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Method *
                          </label>
                          <input
                            type="text"
                            name="moistureMethod"
                            value={formData.moistureMethod}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., LOD"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Temperature *
                          </label>
                          <input
                            type="text"
                            name="temperature"
                            value={formData.temperature}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., 105C"
                          />
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                        <div className="text-sm text-blue-800">
                          <strong>Standard Reference:</strong> Loss on Drying
                          (LOD) method as per USP/BP monograph for{" "}
                          {formData.herbSpecies}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pesticide Test Parameters */}
                  {formData.testType === "pesticidetest" && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg border border-red-200">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">🧪</span>
                        Pesticide Residue Analysis for {formData.herbSpecies}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pesticide PPM *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name="pesticidePPM"
                              value={formData.pesticidePPM}
                              onChange={handleChange}
                              step="0.1"
                              min="0"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                              placeholder="e.g., 1.1"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <span className="text-gray-500 text-sm">ppm</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Compounds Tested *
                          </label>
                          <input
                            type="text"
                            name="compoundsTested"
                            value={formData.compoundsTested}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., organophosphates, organochlorines"
                          />
                          <div className="mt-1 text-xs text-gray-600">
                            Enter comma-separated compound names
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Analysis Method *
                          </label>
                          <input
                            type="text"
                            name="pesticideMethod"
                            value={formData.pesticideMethod}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., GC-MS"
                          />
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-red-100 rounded-lg">
                        <div className="text-sm text-red-800">
                          <strong>Available Compounds:</strong>{" "}
                          {PESTICIDE_COMPOUNDS.join(", ")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Compound Test Parameters */}
                  {formData.testType === "activecompound" && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">🔬</span>
                        Active Compound Analysis for {formData.herbSpecies}
                      </h3>

                      {formData.herbSpecies && getActiveCompoundInfo() ? (
                        <div className="space-y-6">
                          <div className="p-4 bg-green-100 rounded-lg">
                            <div className="text-sm text-green-800">
                              <strong>
                                Target Compound for {formData.herbSpecies}:
                              </strong>{" "}
                              {getActiveCompoundInfo().compound}
                              <br />
                              <strong>Minimum Required:</strong>{" "}
                              {getActiveCompoundInfo().min}{" "}
                              {getActiveCompoundInfo().unit}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {getActiveCompoundInfo()
                                  .compound.charAt(0)
                                  .toUpperCase() +
                                  getActiveCompoundInfo().compound.slice(
                                    1
                                  )}{" "}
                                Level *
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  name="activeCompoundLevel"
                                  value={formData.activeCompoundLevel}
                                  onChange={handleChange}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                  placeholder={`e.g., ${
                                    getActiveCompoundInfo().min
                                  }`}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                  <span className="text-gray-500 text-sm">
                                    {getActiveCompoundInfo().unit}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Analysis Method *
                              </label>
                              <input
                                type="text"
                                name="activeCompoundMethod"
                                value={formData.activeCompoundMethod}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                placeholder="e.g., HPLC"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reference Standard *
                              </label>
                              <input
                                type="text"
                                name="standard"
                                value={formData.standard}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                placeholder="e.g., USP monograph"
                              />
                            </div>
                          </div>

                          {formData.activeCompoundLevel && (
                            <div className="p-4 bg-white border border-green-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  Quality Assessment:
                                </span>
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    parseFloat(formData.activeCompoundLevel) >=
                                    getActiveCompoundInfo().min
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {parseFloat(formData.activeCompoundLevel) >=
                                  getActiveCompoundInfo().min
                                    ? "Meets Standard"
                                    : "Below Standard"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="text-yellow-800">
                            Please enter the herb species first to configure
                            active compound testing parameters.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optional Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lab Operator Name (Optional)
                      </label>
                      <input
                        type="text"
                        name="operator"
                        value={formData.operator}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        placeholder="Name of the testing operator"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Equipment Used (Optional)
                      </label>
                      <input
                        type="text"
                        name="equipmentUsed"
                        value={formData.equipmentUsed}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        placeholder="Equipment model/ID used for testing"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Testing Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Any additional observations, deviations, or special testing conditions..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="text-green-600 mr-2">✅</span>
                    Review & Submit Test Results
                  </h2>

                  {/* Timestamp */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Test Completion Timestamp *
                    </label>

                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          name="timestamp"
                          value={formData.timestamp}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          placeholder="ISO timestamp will be auto-generated"
                          readOnly={timestampStatus === "loading"}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={getCurrentTimestamp}
                      disabled={timestampStatus === "loading"}
                      className={`
                        w-full md:w-auto px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center
                        ${
                          timestampStatus === "loading"
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : timestampStatus === "success"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }
                      `}
                    >
                      {timestampStatus === "loading"
                        ? "Setting Timestamp..."
                        : timestampStatus === "success"
                        ? "✓ Timestamp Set"
                        : "🕒 Set Current Timestamp"}
                    </button>
                  </div>

                  {/* Test Summary */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="mr-2">📊</span>
                      Test Summary
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Test ID:</span>
                          <span className="font-mono text-sm">
                            {formData.testId.slice(-15)}...
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Batch ID:</span>
                          <span className="font-mono text-sm">
                            {formData.batchId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Herb Species:</span>
                          <span className="font-medium text-green-800">
                            {formData.herbSpecies}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Test Type:</span>
                          <span className="font-medium">
                            {getSelectedTestType()?.name}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lab ID:</span>
                          <span className="font-mono text-sm">
                            {labInfo?.blockchainUserId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Organization:</span>
                          <span className="font-medium">{labInfo?.mspId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Timestamp:</span>
                          <span className="text-sm">
                            {formData.timestamp ? "Set" : "Not set"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Blockchain:</span>
                          <span className="text-green-600 text-sm">
                            Ready for submission
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Test Results Summary */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">
                        Test Results Preview:
                      </h4>
                      {formData.testType === "moisturetest" && (
                        <div className="text-sm text-gray-600">
                          Moisture: {formData.moisture}% | Method:{" "}
                          {formData.moistureMethod} | Temperature:{" "}
                          {formData.temperature}
                        </div>
                      )}
                      {formData.testType === "pesticidetest" && (
                        <div className="text-sm text-gray-600">
                          Pesticide PPM: {formData.pesticidePPM} | Method:{" "}
                          {formData.pesticideMethod} | Compounds:{" "}
                          {formData.compoundsTested}
                        </div>
                      )}
                      {formData.testType === "activecompound" &&
                        getActiveCompoundInfo() && (
                          <div className="text-sm text-gray-600">
                            {getActiveCompoundInfo().compound}:{" "}
                            {formData.activeCompoundLevel}{" "}
                            {getActiveCompoundInfo().unit} | Method:{" "}
                            {formData.activeCompoundMethod} | Standard:{" "}
                            {formData.standard}
                          </div>
                        )}
                      {(formData.operator || formData.equipmentUsed) && (
                        <div className="text-sm text-gray-600 mt-2">
                          {formData.operator &&
                            `Operator: ${formData.operator} | `}
                          {formData.equipmentUsed &&
                            `Equipment: ${formData.equipmentUsed}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center"
                    >
                      ← Previous
                    </button>
                  )}
                </div>

                <div className="flex space-x-3">
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!validateStep(currentStep)}
                      className={`
                        px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center
                        ${
                          validateStep(currentStep)
                            ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }
                      `}
                    >
                      Next →
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={
                          submitting ||
                          !validateStep(1) ||
                          !validateStep(2) ||
                          !validateStep(3)
                        }
                        className={`
                          px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center
                          ${
                            submitting
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                          }
                        `}
                      >
                        {submitting ? (
                          <>
                            <ButtonLoader />
                            Submitting to Blockchain...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">⛓️</span>
                            Submit Test Results
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
