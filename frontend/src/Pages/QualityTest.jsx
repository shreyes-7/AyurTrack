import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiEndpoints } from "../services/api";
import { useSubmit } from "../hooks/useFetch";
import { ButtonLoader } from "../Components/Loader";
import Layout from "../Components/Layout";

// Test types configuration based on chaincode requirements
const TEST_TYPES = [
  {
    id: 'moisturetest',
    name: 'Moisture Test',
    icon: '💧',
    description: 'Determines moisture content using Loss on Drying (LOD) method',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'pesticidetest', 
    name: 'Pesticide Test',
    icon: '🧪',
    description: 'Analyzes pesticide residue levels using advanced chromatography',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  {
    id: 'activecompound',
    name: 'Active Compound',
    icon: '🔬',
    description: 'Measures bioactive compounds specific to each herb species',
    color: 'bg-green-100 text-green-800 border-green-200'
  }
];

// Pesticide compounds for multi-select
const PESTICIDE_COMPOUNDS = [
  'organophosphates',
  'organochlorines',
  'carbamates',
  'pyrethroids',
  'neonicotinoids',
  'triazines',
  'glyphosate',
  'paraquat'
];

// Species-specific active compounds
const ACTIVE_COMPOUNDS_BY_SPECIES = {
  'Ashwagandha': { compound: 'withanolides', unit: '%', min: 0.3 },
  'Turmeric': { compound: 'curcumin', unit: '%', min: 3.0 },
  'Tulsi': { compound: 'eugenol', unit: '%', min: 0.1 },
  'Amla': { compound: 'vitamin_c', unit: 'mg/100g', min: 500 },
  'Neem': { compound: 'azadirachtin', unit: 'ppm', min: 300 }
};

export default function LabTesterPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [timestampStatus, setTimestampStatus] = useState('idle');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  
  // Get lab info from session/context
  const [labInfo, setLabInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    // User inputs
    batchId: "",
    testType: "",
    
    // Test results (varies by test type)
    // Moisture test
    moisture: "",
    moistureMethod: "",
    temperature: "",
    
    // Pesticide test
    pesticidePPM: "",
    compoundsTested: [],
    pesticideMethod: "",
    
    // Active compound test
    activeCompoundLevel: "",
    activeCompoundMethod: "",
    standard: "",
    
    // Auto-generated fields
    testId: "",
    labId: "",
    timestamp: "",
    
    // Additional fields
    notes: "",
    certificationRef: ""
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
      location: "Mumbai"
    };
    setLabInfo(mockLabInfo);
    
    // Generate test ID
    const timestamp = Date.now();
    setFormData(prev => ({
      ...prev,
      labId: mockLabInfo.blockchainUserId,
      testId: `TEST_${timestamp}_${mockLabInfo.blockchainUserId}`
    }));
  }, []);

  // Mock available batches - in real implementation, fetch from API
  useEffect(() => {
    const mockBatches = [
      {
        batchId: 'BATCH_1737360000000_F266201K3X',
        species: 'Ashwagandha',
        quantity: 50.5,
        collectorId: 'F266201K3X',
        status: 'collected',
        collectionDate: '2025-01-15T08:30:00Z'
      },
      {
        batchId: 'BATCH_1737446400000_F266202M9Z', 
        species: 'Turmeric',
        quantity: 75.2,
        collectorId: 'F266202M9Z',
        status: 'processed:drying',
        collectionDate: '2025-01-16T10:00:00Z'
      },
      {
        batchId: 'BATCH_1737532800000_F266203A7B',
        species: 'Tulsi',
        quantity: 25.0,
        collectorId: 'F266203A7B',
        status: 'processed:grinding',
        collectionDate: '2025-01-17T06:00:00Z'
      }
    ];
    setAvailableBatches(mockBatches);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Update selected batch when batchId changes
    if (name === 'batchId') {
      const batch = availableBatches.find(b => b.batchId === value);
      setSelectedBatch(batch);
    }
  };

  const handleCompoundsChange = (compound) => {
    setFormData(prev => ({
      ...prev,
      compoundsTested: prev.compoundsTested.includes(compound)
        ? prev.compoundsTested.filter(c => c !== compound)
        : [...prev.compoundsTested, compound]
    }));
  };

  const getCurrentTimestamp = () => {
    setTimestampStatus('loading');
    setTimeout(() => {
      const currentTimestamp = new Date().toISOString();
      setFormData(prev => ({
        ...prev,
        timestamp: currentTimestamp
      }));
      setTimestampStatus('success');
    }, 500);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.batchId && formData.testType;
      case 2:
        if (formData.testType === 'moisturetest') {
          return formData.moisture && formData.moistureMethod && formData.temperature;
        }
        if (formData.testType === 'pesticidetest') {
          return formData.pesticidePPM && formData.compoundsTested.length > 0 && formData.pesticideMethod;
        }
        if (formData.testType === 'activecompound') {
          return formData.activeCompoundLevel && formData.activeCompoundMethod && formData.standard;
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
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      alert("Please fill in all required fields for this step.");
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      alert("Please fill in all required fields");
      return;
    }

    if (!labInfo?.blockchainUserId) {
      alert("Lab authentication required");
      return;
    }

    // Prepare results object based on test type
    let results = {};
    
    if (formData.testType === 'moisturetest') {
      results = {
        moisture: parseFloat(formData.moisture),
        method: formData.moistureMethod,
        temperature: formData.temperature
      };
    } else if (formData.testType === 'pesticidetest') {
      results = {
        pesticidePPM: parseFloat(formData.pesticidePPM),
        compounds_tested: formData.compoundsTested,
        method: formData.pesticideMethod
      };
    } else if (formData.testType === 'activecompound') {
      const species = selectedBatch?.species;
      const compoundInfo = ACTIVE_COMPOUNDS_BY_SPECIES[species];
      if (compoundInfo) {
        results[compoundInfo.compound] = formData.activeCompoundLevel;
      }
      results.method = formData.activeCompoundMethod;
      results.standard = formData.standard;
    }

    // Prepare data in the format expected by the chaincode
    const submissionData = {
      testId: formData.testId,
      batchId: formData.batchId,
      labId: labInfo.blockchainUserId,
      testType: formData.testType,
      results: results,
      timestamp: formData.timestamp,
      notes: formData.notes,
      certificationRef: formData.certificationRef
    };

    console.log("Submitting quality test data:", submissionData);
    await submit(submissionData);
  };

  const getSelectedTestType = () => TEST_TYPES.find(t => t.id === formData.testType);
  const getActiveCompoundInfo = () => {
    if (!selectedBatch) return null;
    return ACTIVE_COMPOUNDS_BY_SPECIES[selectedBatch.species];
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
              Conduct comprehensive quality analysis with advanced testing protocols and blockchain verification
            </p>
            
            {labInfo && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg inline-block">
                <div className="text-sm text-purple-800">
                  <strong>Laboratory:</strong> {labInfo.name} 
                  <span className="ml-2 font-mono text-xs">({labInfo.blockchainUserId})</span>
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  Certifications: {labInfo.certifications.join(', ')} | Location: {labInfo.location}
                </div>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep >= step 
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`
                      w-20 h-1 mx-2
                      ${currentStep > step ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4 space-x-12">
              <span className="text-sm font-medium text-gray-600">Batch & Test Selection</span>
              <span className="text-sm font-medium text-gray-600">Test Parameters</span>
              <span className="text-sm font-medium text-gray-600">Review & Submit</span>
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
                  <div className="font-mono text-xs">{labInfo?.blockchainUserId || 'Loading...'}</div>
                </div>
                <div>
                  <span className="font-medium">Organization:</span>
                  <div className="font-mono text-xs">{labInfo?.mspId || 'Loading...'}</div>
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
                <div className="text-green-800">Quality test data submitted successfully to blockchain!</div>
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

                  {/* Batch Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Batch for Testing *
                    </label>
                    <select
                      name="batchId"
                      value={formData.batchId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">-- Select a batch --</option>
                      {availableBatches.map((batch) => (
                        <option key={batch.batchId} value={batch.batchId}>
                          {batch.batchId.slice(-12)}... - {batch.species} ({batch.quantity}kg) - {batch.status}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1 text-sm text-gray-500">
                      Choose from available batches ready for testing
                    </div>
                  </div>

                  {/* Selected Batch Info */}
                  {selectedBatch && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">📦</span>
                        Selected Batch Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Species:</span>
                            <span className="font-medium">{selectedBatch.species}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{selectedBatch.quantity} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedBatch.status.includes('processed') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {selectedBatch.status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Collector ID:</span>
                            <span className="font-mono text-sm">{selectedBatch.collectorId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Collection Date:</span>
                            <span className="text-sm">{new Date(selectedBatch.collectionDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Batch ID:</span>
                            <span className="font-mono text-xs">{selectedBatch.batchId.slice(-20)}...</span>
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
                            ${formData.testType === test.id
                              ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                              : `border-gray-200 hover:border-gray-300 hover:bg-gray-50 ${test.color.replace('text-', 'hover:text-').replace('bg-', 'hover:bg-')}`
                            }
                          `}
                          onClick={() => setFormData(prev => ({ ...prev, testType: test.id }))}
                        >
                          <div className="text-center">
                            <span className="text-3xl mb-3 block">{test.icon}</span>
                            <h3 className="font-semibold text-gray-800 mb-2">{test.name}</h3>
                            <p className="text-sm text-gray-600">{test.description}</p>
                            {formData.testType === test.id && (
                              <div className="absolute top-3 right-3 text-purple-500">✓</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Test Type Preview */}
                  {getSelectedTestType() && (
                    <div className={`p-4 rounded-lg border-l-4 border-purple-500 ${getSelectedTestType().color}`}>
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getSelectedTestType().icon}</span>
                        <div>
                          <h3 className="font-semibold">{getSelectedTestType().name}</h3>
                          <p className="text-sm mt-1">{getSelectedTestType().description}</p>
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
                    Test Parameters & Results
                  </h2>

                  {/* Moisture Test Parameters */}
                  {formData.testType === 'moisturetest' && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">💧</span>
                        Moisture Test Configuration
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
                          <strong>Standard Reference:</strong> Loss on Drying (LOD) method as per USP/BP monograph
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pesticide Test Parameters */}
                  {formData.testType === 'pesticidetest' && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg border border-red-200">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">🧪</span>
                        Pesticide Residue Analysis
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Compounds Tested * (Select all that apply)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {PESTICIDE_COMPOUNDS.map((compound) => (
                            <label
                              key={compound}
                              className={`
                                flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200
                                ${formData.compoundsTested.includes(compound)
                                  ? 'border-red-500 bg-red-50 text-red-800'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }
                              `}
                            >
                              <input
                                type="checkbox"
                                checked={formData.compoundsTested.includes(compound)}
                                onChange={() => handleCompoundsChange(compound)}
                                className="sr-only"
                              />
                              <span className="text-sm font-medium">{compound}</span>
                              {formData.compoundsTested.includes(compound) && (
                                <span className="ml-auto text-red-500">✓</span>
                              )}
                            </label>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Selected: {formData.compoundsTested.length} compound(s)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Compound Test Parameters */}
                  {formData.testType === 'activecompound' && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">🔬</span>
                        Active Compound Analysis
                      </h3>

                      {selectedBatch && getActiveCompoundInfo() ? (
                        <div className="space-y-6">
                          <div className="p-4 bg-green-100 rounded-lg">
                            <div className="text-sm text-green-800">
                              <strong>Target Compound for {selectedBatch.species}:</strong> {getActiveCompoundInfo().compound}
                              <br />
                              <strong>Minimum Required:</strong> {getActiveCompoundInfo().min} {getActiveCompoundInfo().unit}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {getActiveCompoundInfo().compound} Level *
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  name="activeCompoundLevel"
                                  value={formData.activeCompoundLevel}
                                  onChange={handleChange}
                                  step="0.01"
                                  min="0"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                  placeholder={`e.g., ${getActiveCompoundInfo().min}`}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                  <span className="text-gray-500 text-sm">{getActiveCompoundInfo().unit}</span>
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
                                <span className="font-medium">Quality Assessment:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  parseFloat(formData.activeCompoundLevel) >= getActiveCompoundInfo().min
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {parseFloat(formData.activeCompoundLevel) >= getActiveCompoundInfo().min 
                                    ? 'Meets Standard' 
                                    : 'Below Standard'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="text-yellow-800">
                            Please select a batch first to configure active compound testing parameters.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional Test Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certification Reference (Optional)
                      </label>
                      <input
                        type="text"
                        name="certificationRef"
                        value={formData.certificationRef}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        placeholder="Internal certificate/report reference"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        placeholder="Any additional observations or remarks..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="text-green-600 mr-2">📋</span>
                    Review & Submit
                  </h2>

                  {/* Timestamp */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          placeholder="ISO timestamp will be auto-generated"
                          readOnly={timestampStatus === 'loading'}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={getCurrentTimestamp}
                      disabled={timestampStatus === 'loading'}
                      className={`
                        w-full md:w-auto px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center
                        ${timestampStatus === 'loading'
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : timestampStatus === 'success'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                        }
                      `}
                    >
                      {timestampStatus === 'loading' ? 'Setting Timestamp...' :
                       timestampStatus === 'success' ? '✓ Timestamp Set' :
                       '🕒 Set Current Timestamp'}
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
                          <span className="font-mono text-sm">{formData.testId.slice(-15)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Batch ID:</span>
                          <span className="font-mono text-sm">{formData.batchId.slice(-15)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Test Type:</span>
                          <span className="font-medium">{getSelectedTestType()?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Species:</span>
                          <span className="font-medium">{selectedBatch?.species}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lab ID:</span>
                          <span className="font-mono text-sm">{labInfo?.blockchainUserId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Organization:</span>
                          <span className="font-medium">{labInfo?.mspId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Timestamp:</span>
                          <span className="text-sm">{formData.timestamp ? 'Set' : 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Blockchain:</span>
                          <span className="text-green-600 text-sm">Ready for submission</span>
                        </div>
                      </div>
                    </div>

                    {/* Test Results Summary */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Test Results Preview:</h4>
                      {formData.testType === 'moisturetest' && (
                        <div className="text-sm text-gray-600">
                          Moisture: {formData.moisture}% | Method: {formData.moistureMethod} | Temperature: {formData.temperature}
                        </div>
                      )}
                      {formData.testType === 'pesticidetest' && (
                        <div className="text-sm text-gray-600">
                          Pesticide PPM: {formData.pesticidePPM} | Method: {formData.pesticideMethod} | Compounds: {formData.compoundsTested.join(', ')}
                        </div>
                      )}
                      {formData.testType === 'activecompound' && getActiveCompoundInfo() && (
                        <div className="text-sm text-gray-600">
                          {getActiveCompoundInfo().compound}: {formData.activeCompoundLevel} {getActiveCompoundInfo().unit} | Method: {formData.activeCompoundMethod} | Standard: {formData.standard}
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
                        ${validateStep(currentStep)
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
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
                        disabled={submitting || !validateStep(1) || !validateStep(2) || !validateStep(3)}
                        className={`
                          px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center
                          ${submitting
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600'
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
