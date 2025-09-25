import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiEndpoints } from "../services/api";
import { useSubmit } from "../hooks/useFetch";
import { ButtonLoader } from "../Components/Loader";
import Layout from "../Components/Layout";

// Processing step types configuration
const PROCESSING_STEPS = [
  {
    id: 'cleaning',
    name: 'Cleaning',
    icon: '🧽',
    description: 'Remove impurities, foreign matter, and damaged materials',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    hasParams: false
  },
  {
    id: 'drying',
    name: 'Drying', 
    icon: '🌡️',
    description: 'Moisture reduction using controlled temperature and airflow',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    hasParams: true,
    params: ['temperature', 'duration', 'method']
  },
  {
    id: 'grinding',
    name: 'Grinding',
    icon: '⚙️', 
    description: 'Size reduction to achieve desired mesh size',
    color: 'bg-green-100 text-green-800 border-green-200',
    hasParams: true,
    params: ['mesh_size', 'temperature']
  }
];

export default function ProcessorPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [timestampStatus, setTimestampStatus] = useState('idle');
  
  // Get processor info from session/context
  const [processorInfo, setProcessorInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    // User inputs - ALL INPUT FIELDS
    batchId: "",              // Input: Batch ID to identify which herb batch to process
    herbSpecies: "",          // Input: Name of herb species (tells processor which herb they're working on)
    stepType: "",            // Dropdown: cleaning/drying/grinding
    
    // Processing parameters (varies by step type)
    // Drying parameters
    temperature: "",          // Input: e.g., "40C"
    duration: "",            // Input: e.g., "8hours"
    method: "",              // Input: e.g., "shade-dried"
    
    // Grinding parameters  
    meshSize: "",            // Input: e.g., "80"
    grindingTemperature: "", // Input: e.g., "ambient"
    
    // Auto-generated fields (backend will generate these)
    processId: "",           // PROC_${Date.now()}_${facilityId}
    facilityId: "",          // From logged-in processor session
    timestamp: "",           // Current ISO timestamp
    
    // Additional optional inputs
    operatorName: "",        // Input: Name of operator
    equipmentUsed: "",       // Input: Equipment used for processing
    notes: ""                // Input: Additional processing notes
  });

  const { submit, submitting, error, success } = useSubmit(
    apiEndpoints.addProcessingStep,
    {
      onSuccess: (result) => {
        console.log("Processing step created:", result);
        setTimeout(() => navigate("/dashboard"), 2000);
      },
    }
  );

  // Simulate getting processor info from authentication context
  useEffect(() => {
    // In real implementation, this would come from your auth context/JWT token
    const mockProcessorInfo = {
      id: "P266201K3X", // Following your ID pattern: P + timestamp + random
      name: "Advanced Herbal Processing Facility",
      blockchainUserId: "P266201K3X",
      mspId: "Org1MSP", 
      location: "Jaipur Industrial Area",
      license: "PROC2024001",
      capacity: "1000kg/day",
      certifications: ["GMP", "ISO22000"]
    };
    setProcessorInfo(mockProcessorInfo);
    
    // Generate process ID
    const timestamp = Date.now();
    setFormData(prev => ({
      ...prev,
      facilityId: mockProcessorInfo.blockchainUserId,
      processId: `PROC_${timestamp}_${mockProcessorInfo.blockchainUserId}`
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
        return formData.batchId && formData.herbSpecies && formData.stepType;
      case 2:
        if (formData.stepType === 'cleaning') {
          return true; // No additional parameters required for cleaning
        }
        if (formData.stepType === 'drying') {
          return formData.temperature && formData.duration && formData.method;
        }
        if (formData.stepType === 'grinding') {
          return formData.meshSize && formData.grindingTemperature;
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

    if (!processorInfo?.blockchainUserId) {
      alert("Processor authentication required");
      return;
    }

    // Prepare params object based on step type (following chaincode structure)
    let params = {};
    
    if (formData.stepType === 'cleaning') {
      // No additional parameters for cleaning
      params = {};
    } else if (formData.stepType === 'drying') {
      params = {
        temperature: formData.temperature,
        duration: formData.duration,
        method: formData.method
      };
    } else if (formData.stepType === 'grinding') {
      params = {
        mesh_size: formData.meshSize,
        temperature: formData.grindingTemperature
      };
    }

    // Add optional parameters
    if (formData.operatorName) params.operator = formData.operatorName;
    if (formData.equipmentUsed) params.equipment = formData.equipmentUsed;
    if (formData.notes) params.notes = formData.notes;

    // Prepare data in the format expected by the chaincode
    const submissionData = {
      processId: formData.processId,
      batchId: formData.batchId,
      facilityId: processorInfo.blockchainUserId,
      stepType: formData.stepType,
      params: JSON.stringify(params), // Chaincode expects params as JSON string
      timestamp: formData.timestamp
    };

    console.log("Submitting processing step data:", submissionData);
    await submit(submissionData);
  };

  const getSelectedStepType = () => PROCESSING_STEPS.find(s => s.id === formData.stepType);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-4">
              <span className="text-2xl">🏭</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Processing Operations Portal
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Execute controlled processing steps with precise parameter tracking and blockchain verification
            </p>
            
            {processorInfo && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg inline-block">
                <div className="text-sm text-orange-800">
                  <strong>Processing Facility:</strong> {processorInfo.name} 
                  <span className="ml-2 font-mono text-xs">({processorInfo.blockchainUserId})</span>
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  License: {processorInfo.license} | Capacity: {processorInfo.capacity} | Location: {processorInfo.location}
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
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`
                      w-20 h-1 mx-2
                      ${currentStep > step ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4 space-x-12">
              <span className="text-sm font-medium text-gray-600">Batch & Step Selection</span>
              <span className="text-sm font-medium text-gray-600">Processing Parameters</span>
              <span className="text-sm font-medium text-gray-600">Review & Execute</span>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Processor Info Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white text-sm">
                <div>
                  <span className="font-medium">Process ID:</span>
                  <div className="font-mono text-xs">{formData.processId}</div>
                </div>
                <div>
                  <span className="font-medium">Facility ID:</span>
                  <div className="font-mono text-xs">{processorInfo?.blockchainUserId || 'Loading...'}</div>
                </div>
                <div>
                  <span className="font-medium">Organization:</span>
                  <div className="font-mono text-xs">{processorInfo?.mspId || 'Loading...'}</div>
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
                <div className="text-green-800">Processing step recorded successfully on blockchain!</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6">
              {/* Step 1: Batch & Step Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="text-orange-600 mr-2">📦</span>
                    Batch & Processing Step Selection
                  </h2>

                  {/* Key Information Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="mr-2">ℹ️</span>
                      Key Information
                    </h3>
                    <div className="text-sm text-blue-800 space-y-2">
                      <div><strong>Batch ID:</strong> Identifies which specific herb batch you are processing</div>
                      <div><strong>Herb Species:</strong> Tells you which type of herb you are working with (e.g., Ashwagandha, Turmeric)</div>
                      <div><strong>Step Type:</strong> The specific processing operation you are performing</div>
                    </div>
                  </div>

                  {/* Batch ID Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center">
                        📋 Batch ID * <span className="ml-2 text-xs text-gray-500">(Identifies which batch to process)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="batchId"
                      value={formData.batchId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter batch ID (e.g., BATCH_1737360000000_F266201K3X)"
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      Enter the complete batch ID that you want to process
                    </div>
                  </div>

                  {/* Herb Species Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center">
                        🌿 Herb Species * <span className="ml-2 text-xs text-gray-500">(Tells you which herb you're processing)</span>
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
                      This identifies which type of herb you are processing and helps determine appropriate processing parameters
                    </div>
                  </div>

                  {/* Current Processing Status Preview */}
                  {formData.batchId && formData.herbSpecies && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">🎯</span>
                        Processing Target
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Batch ID:</span>
                            <span className="font-mono text-sm">{formData.batchId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Herb Species:</span>
                            <span className="font-medium text-green-800">{formData.herbSpecies}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Processor:</span>
                            <span className="font-medium">{processorInfo?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="text-blue-600 font-medium">Ready for Processing</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Processing Step Type *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {PROCESSING_STEPS.map((step) => (
                        <div
                          key={step.id}
                          className={`
                            relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-200
                            ${formData.stepType === step.id
                              ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                              : `border-gray-200 hover:border-gray-300 hover:bg-gray-50`
                            }
                          `}
                          onClick={() => setFormData(prev => ({ ...prev, stepType: step.id }))}
                        >
                          <div className="text-center">
                            <span className="text-3xl mb-3 block">{step.icon}</span>
                            <h3 className="font-semibold text-gray-800 mb-2">{step.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                            {step.hasParams && (
                              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                Requires parameters
                              </div>
                            )}
                            {formData.stepType === step.id && (
                              <div className="absolute top-3 right-3 text-orange-500">✓</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Step Type Preview */}
                  {getSelectedStepType() && (
                    <div className={`p-4 rounded-lg border-l-4 border-orange-500 ${getSelectedStepType().color}`}>
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getSelectedStepType().icon}</span>
                        <div>
                          <h3 className="font-semibold">{getSelectedStepType().name}</h3>
                          <p className="text-sm mt-1">{getSelectedStepType().description}</p>
                          {getSelectedStepType().hasParams && (
                            <p className="text-xs mt-2 font-medium">
                              Required parameters: {getSelectedStepType().params.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Processing Parameters */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="text-amber-600 mr-2">⚙️</span>
                    Processing Parameters & Configuration
                  </h2>

                  {/* Cleaning Step - No Parameters */}
                  {formData.stepType === 'cleaning' && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">🧽</span>
                        Cleaning Process Configuration
                      </h3>
                      
                      <div className="bg-blue-100 p-4 rounded-lg">
                        <div className="text-sm text-blue-800">
                          <strong>Standard Cleaning Process:</strong> Remove foreign matter, damaged materials, and impurities according to standard operating procedures. No additional parameters required.
                        </div>
                        <div className="mt-2 text-xs text-blue-600">
                          This step will be recorded with standard cleaning protocols for <strong>{formData.herbSpecies}</strong>.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Drying Step Parameters */}
                  {formData.stepType === 'drying' && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">🌡️</span>
                        Drying Process Configuration for {formData.herbSpecies}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Temperature *
                          </label>
                          <input
                            type="text"
                            name="temperature"
                            value={formData.temperature}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., 40C"
                          />
                          <div className="mt-1 text-xs text-gray-600">
                            Include unit (°C or °F)
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration *
                          </label>
                          <input
                            type="text"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., 8hours"
                          />
                          <div className="mt-1 text-xs text-gray-600">
                            Include time unit (hours/minutes)
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Method *
                          </label>
                          <input
                            type="text"
                            name="method"
                            value={formData.method}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., shade-dried"
                          />
                          <div className="mt-1 text-xs text-gray-600">
                            Drying method (shade-dried, sun-dried, etc.)
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                        <div className="text-sm text-orange-800">
                          <strong>Drying Guidelines for {formData.herbSpecies}:</strong> Maintain consistent temperature and airflow for optimal moisture reduction while preserving active compounds.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grinding Step Parameters */}
                  {formData.stepType === 'grinding' && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">⚙️</span>
                        Grinding Process Configuration for {formData.herbSpecies}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mesh Size *
                          </label>
                          <input
                            type="text"
                            name="meshSize"
                            value={formData.meshSize}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., 80"
                          />
                          <div className="mt-1 text-xs text-gray-600">
                            Mesh number (higher = finer powder)
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Temperature *
                          </label>
                          <input
                            type="text"
                            name="grindingTemperature"
                            value={formData.grindingTemperature}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., ambient"
                          />
                          <div className="mt-1 text-xs text-gray-600">
                            Processing temperature (ambient, cold, etc.)
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-green-100 rounded-lg">
                        <div className="text-sm text-green-800">
                          <strong>Grinding Standards for {formData.herbSpecies}:</strong> Control particle size and prevent heat generation to maintain product quality and bioactive compounds.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Optional Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Operator Name (Optional)
                      </label>
                      <input
                        type="text"
                        name="operatorName"
                        value={formData.operatorName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                        placeholder="Name of the processing operator"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                        placeholder="Equipment model/ID used for processing"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Processing Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      placeholder="Any additional observations, deviations, or special instructions during processing..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Review & Execute */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="text-green-600 mr-2">✅</span>
                    Review & Execute Processing
                  </h2>

                  {/* Timestamp */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Processing Completion Timestamp *
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
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }
                      `}
                    >
                      {timestampStatus === 'loading' ? 'Setting Timestamp...' :
                       timestampStatus === 'success' ? '✓ Timestamp Set' :
                       '🕒 Set Current Timestamp'}
                    </button>
                  </div>

                  {/* Processing Summary */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="mr-2">📊</span>
                      Processing Summary
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Process ID:</span>
                          <span className="font-mono text-sm">{formData.processId.slice(-15)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Batch ID:</span>
                          <span className="font-mono text-sm">{formData.batchId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Herb Species:</span>
                          <span className="font-medium text-green-800">{formData.herbSpecies}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Processing Step:</span>
                          <span className="font-medium">{getSelectedStepType()?.name}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Facility ID:</span>
                          <span className="font-mono text-sm">{processorInfo?.blockchainUserId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Organization:</span>
                          <span className="font-medium">{processorInfo?.mspId}</span>
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

                    {/* Parameters Summary */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Processing Parameters:</h4>
                      {formData.stepType === 'cleaning' && (
                        <div className="text-sm text-gray-600">
                          Standard cleaning process for {formData.herbSpecies} - no additional parameters
                        </div>
                      )}
                      {formData.stepType === 'drying' && (
                        <div className="text-sm text-gray-600">
                          Temperature: {formData.temperature} | Duration: {formData.duration} | Method: {formData.method}
                        </div>
                      )}
                      {formData.stepType === 'grinding' && (
                        <div className="text-sm text-gray-600">
                          Mesh Size: {formData.meshSize} | Temperature: {formData.grindingTemperature}
                        </div>
                      )}
                      {(formData.operatorName || formData.equipmentUsed) && (
                        <div className="text-sm text-gray-600 mt-2">
                          {formData.operatorName && `Operator: ${formData.operatorName} | `}
                          {formData.equipmentUsed && `Equipment: ${formData.equipmentUsed}`}
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
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700'
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
                            Recording to Blockchain...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">⛓️</span>
                            Execute Processing Step
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
