import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiEndpoints } from "../services/api";
import { useSubmit } from "../hooks/useFetch";
import { ButtonLoader } from "../Components/Loader";
import Layout from "../Components/Layout";
import QRCodeDisplay from "../Components/QRCodeDisplay";

// Product types configuration based on chaincode requirements
const PRODUCT_TYPES = [
  {
    id: 'capsules',
    name: 'Capsules',
    icon: '💊',
    description: 'Encapsulated herbal formulations for precise dosing',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    requiresWeight: false
  },
  {
    id: 'tablets',
    name: 'Tablets',
    icon: '🟫',
    description: 'Compressed tablet formulations with binding agents',
    color: 'bg-green-100 text-green-800 border-green-200',
    requiresWeight: true
  },
  {
    id: 'powder',
    name: 'Powder',
    icon: '🥄',
    description: 'Fine powder formulations for flexible dosing',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    requiresWeight: false
  }
];

// Common excipients for different product types
const EXCIPIENTS_BY_TYPE = {
  capsules: [
    'microcrystalline_cellulose',
    'magnesium_stearate',
    'silicon_dioxide',
    'gelatin_capsules',
    'hypromellose_capsules'
  ],
  tablets: [
    'microcrystalline_cellulose',
    'magnesium_stearate',
    'croscarmellose_sodium',
    'povidone',
    'lactose_monohydrate',
    'talc',
    'titanium_dioxide'
  ],
  powder: [
    'silicon_dioxide',
    'natural_flavoring',
    'stevia_extract',
    'ascorbic_acid'
  ]
};

export default function ManufacturerBatchPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [timestampStatus, setTimestampStatus] = useState('idle');
  const [qrGenerated, setQrGenerated] = useState(false);
  
  // Get manufacturer info from session/context
  const [manufacturerInfo, setManufacturerInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    // User inputs - ALL INPUT FIELDS
    inputBatches: "",                    // Input: Comma-separated batch IDs
    herbSpecies: "",                    // Input: Herbs being used (derived from input batches)
    productType: "",                    // Dropdown: capsules/tablets/powder
    dosage: "",                         // Input: e.g., "500mg"
    batchSize: "",                      // Input: e.g., 10000 (number of units)
    excipients: "",                     // Input: Comma-separated excipient names
    
    // Additional fields for multi-herb products
    formulaRatio: "",                   // Input: JSON string e.g., '{"Ashwagandha": "40%", "Tulsi": "30%"}'
    tabletWeight: "",                   // Input: For tablet products e.g., "1000mg"
    
    // Auto-generated fields (backend will generate these)
    productBatchId: "",                 // PROD_${Date.now()}_${manufacturerId}
    manufacturerId: "",                 // From logged-in manufacturer session
    timestamp: "",                      // Current ISO timestamp
    
    // QR Code fields
    selectedProductBatch: "",           // Input: For QR generation
    qrToken: "",                        // Auto-generated: ${productBatchId}_${Date.now()}
    
    // Additional optional inputs
    productName: "",                    // Input: Commercial product name
    description: "",                    // Input: Product description
    shelfLife: "",                      // Input: e.g., "24 months"
    storageConditions: "",              // Input: Storage requirements
    packagingType: "",                  // Input: Packaging material/type
    notes: ""                          // Input: Manufacturing notes
  });

  const { submit: submitFormulation, submitting: submittingFormulation, error: errorFormulation, success: successFormulation } = useSubmit(
    apiEndpoints.createFormulation,
    {
      onSuccess: (result) => {
        console.log("Formulation created:", result);
        // Auto-generate QR code after successful formulation
        generateQRCode(result.productBatchId);
      },
    }
  );

  const { submit: submitQRGeneration, submitting: submittingQR, error: errorQR, success: successQR } = useSubmit(
    apiEndpoints.generateBatchQR,
    {
      onSuccess: (result) => {
        console.log("QR Code generated:", result);
        setQrGenerated(true);
        setTimeout(() => navigate("/dashboard"), 3000);
      },
    }
  );

  // Simulate getting manufacturer info from authentication context
  useEffect(() => {
    // In real implementation, this would come from your auth context/JWT token
    const mockManufacturerInfo = {
      id: "M266201K3X", // Following your ID pattern: M + timestamp + random
      name: "Advanced Ayurvedic Manufacturing Co.",
      blockchainUserId: "M266201K3X",
      mspId: "Org2MSP",
      location: "Bangalore Tech Park",
      license: "MFG2024001",
      capacity: "50000units/day",
      certifications: ["GMP", "ISO22000", "WHO-GMP"]
    };
    setManufacturerInfo(mockManufacturerInfo);
    
    // Generate product batch ID
    const timestamp = Date.now();
    setFormData(prev => ({
      ...prev,
      manufacturerId: mockManufacturerInfo.blockchainUserId,
      productBatchId: `PROD_${timestamp}_${mockManufacturerInfo.blockchainUserId}`
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleExcipientToggle = (excipient) => {
    const currentExcipients = formData.excipients.split(',').map(e => e.trim()).filter(e => e);
    const isSelected = currentExcipients.includes(excipient);
    
    let newExcipients;
    if (isSelected) {
      newExcipients = currentExcipients.filter(e => e !== excipient);
    } else {
      newExcipients = [...currentExcipients, excipient];
    }
    
    setFormData(prev => ({
      ...prev,
      excipients: newExcipients.join(', ')
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
        return formData.inputBatches && formData.productType && formData.dosage && formData.batchSize;
      case 2:
        const baseValid = formData.excipients;
        if (formData.productType === 'tablets') {
          return baseValid && formData.tabletWeight;
        }
        return baseValid;
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

  const handleSubmitFormulation = async (e) => {
    e.preventDefault();
    
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      alert("Please fill in all required fields");
      return;
    }

    if (!manufacturerInfo?.blockchainUserId) {
      alert("Manufacturer authentication required");
      return;
    }

    // Prepare formulation parameters
    const formulationParams = {
      product_type: formData.productType,
      dosage: formData.dosage,
      batch_size: `${formData.batchSize}_units`
    };

    // Add excipients as array
    if (formData.excipients) {
      formulationParams.excipients = formData.excipients.split(',').map(e => e.trim()).filter(e => e);
    }

    // Add formula ratio for multi-herb products
    if (formData.formulaRatio) {
      try {
        formulationParams.formula_ratio = JSON.parse(formData.formulaRatio);
      } catch (e) {
        alert("Invalid formula ratio format. Please use JSON format like: {\"Ashwagandha\": \"40%\", \"Tulsi\": \"30%\"}");
        return;
      }
    }

    // Add tablet weight for tablets
    if (formData.productType === 'tablets' && formData.tabletWeight) {
      formulationParams.tablet_weight = formData.tabletWeight;
    }

    // Add optional parameters
    if (formData.productName) formulationParams.product_name = formData.productName;
    if (formData.description) formulationParams.description = formData.description;
    if (formData.shelfLife) formulationParams.shelf_life = formData.shelfLife;
    if (formData.storageConditions) formulationParams.storage_conditions = formData.storageConditions;
    if (formData.packagingType) formulationParams.packaging_type = formData.packagingType;
    if (formData.notes) formulationParams.notes = formData.notes;

    // Prepare input batches array
    const inputBatches = formData.inputBatches.split(',').map(b => b.trim()).filter(b => b);

    // Prepare data in the format expected by the chaincode
    const submissionData = {
      productBatchId: formData.productBatchId,
      manufacturerId: manufacturerInfo.blockchainUserId,
      inputBatches: JSON.stringify(inputBatches),
      formulationParams: JSON.stringify(formulationParams),
      timestamp: formData.timestamp
    };

    console.log("Submitting formulation data:", submissionData);
    await submitFormulation(submissionData);
  };

  const generateQRCode = async (productBatchId) => {
    const qrToken = `${productBatchId || formData.selectedProductBatch}_${Date.now()}`;
    
    const qrData = {
      productBatchId: productBatchId || formData.selectedProductBatch,
      token: qrToken
    };

    setFormData(prev => ({ ...prev, qrToken }));
    console.log("Generating QR code:", qrData);
    await submitQRGeneration(qrData);
  };

  const getSelectedProductType = () => PRODUCT_TYPES.find(p => p.id === formData.productType);
  const getAvailableExcipients = () => formData.productType ? EXCIPIENTS_BY_TYPE[formData.productType] || [] : [];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4">
              <span className="text-2xl">🏭</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Manufacturing Operations Portal
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Create advanced herbal formulations with precise ingredient tracking and automated QR code generation
            </p>
            
            {manufacturerInfo && (
              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg inline-block">
                <div className="text-sm text-indigo-800">
                  <strong>Manufacturing Facility:</strong> {manufacturerInfo.name} 
                  <span className="ml-2 font-mono text-xs">({manufacturerInfo.blockchainUserId})</span>
                </div>
                <div className="text-xs text-indigo-600 mt-1">
                  License: {manufacturerInfo.license} | Capacity: {manufacturerInfo.capacity} | Certifications: {manufacturerInfo.certifications.join(', ')}
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
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`
                      w-20 h-1 mx-2
                      ${currentStep > step ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4 space-x-12">
              <span className="text-sm font-medium text-gray-600">Product Configuration</span>
              <span className="text-sm font-medium text-gray-600">Formulation Details</span>
              <span className="text-sm font-medium text-gray-600">Review & QR Generation</span>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Manufacturer Info Banner */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white text-sm">
                <div>
                  <span className="font-medium">Product Batch ID:</span>
                  <div className="font-mono text-xs">{formData.productBatchId}</div>
                </div>
                <div>
                  <span className="font-medium">Manufacturer ID:</span>
                  <div className="font-mono text-xs">{manufacturerInfo?.blockchainUserId || 'Loading...'}</div>
                </div>
                <div>
                  <span className="font-medium">Organization:</span>
                  <div className="font-mono text-xs">{manufacturerInfo?.mspId || 'Loading...'}</div>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {(errorFormulation || errorQR) && (
              <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <span className="text-red-600 text-2xl mr-3">⚠️</span>
                <div className="text-red-800">{errorFormulation || errorQR}</div>
              </div>
            )}

            {(successFormulation || successQR) && (
              <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                <span className="text-green-600 text-2xl mr-3">✅</span>
                <div className="text-green-800">
                  {successQR ? "QR Code generated successfully! Redirecting..." : "Formulation created successfully! Generating QR code..."}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitFormulation} className="p-6">
              {/* Step 1: Product Configuration */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="text-indigo-600 mr-2">⚗️</span>
                    Product Configuration & Input Materials
                  </h2>

                  {/* Input Batches */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center">
                        📦 Input Herb Batches * <span className="ml-2 text-xs text-gray-500">(Comma-separated batch IDs)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="inputBatches"
                      value={formData.inputBatches}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., BATCH_1737360000000_F266201K3X, BATCH_1737446400000_F266202M9Z"
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      Enter the batch IDs of herbs to be used in this formulation (separated by commas)
                    </div>
                  </div>

                  {/* Herb Species Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Herbs in Formulation (Optional - for reference)
                    </label>
                    <input
                      type="text"
                      name="herbSpecies"
                      value={formData.herbSpecies}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., Ashwagandha, Turmeric, Tulsi"
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      List the herb species being used (for reference and labeling)
                    </div>
                  </div>

                  {/* Product Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Product Type *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {PRODUCT_TYPES.map((product) => (
                        <div
                          key={product.id}
                          className={`
                            relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-200
                            ${formData.productType === product.id
                              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                              : `border-gray-200 hover:border-gray-300 hover:bg-gray-50`
                            }
                          `}
                          onClick={() => setFormData(prev => ({ ...prev, productType: product.id }))}
                        >
                          <div className="text-center">
                            <span className="text-3xl mb-3 block">{product.icon}</span>
                            <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                            {product.requiresWeight && (
                              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                Requires tablet weight
                              </div>
                            )}
                            {formData.productType === product.id && (
                              <div className="absolute top-3 right-3 text-indigo-500">✓</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dosage and Batch Size */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dosage per Unit *
                      </label>
                      <input
                        type="text"
                        name="dosage"
                        value={formData.dosage}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., 500mg"
                      />
                      <div className="mt-1 text-xs text-gray-600">
                        Include unit (mg, g, etc.)
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Batch Size (Units) *
                      </label>
                      <input
                        type="number"
                        name="batchSize"
                        value={formData.batchSize}
                        onChange={handleChange}
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., 10000"
                      />
                      <div className="mt-1 text-xs text-gray-600">
                        Number of units to be manufactured
                      </div>
                    </div>
                  </div>

                  {/* Product Preview */}
                  {getSelectedProductType() && formData.dosage && formData.batchSize && (
                    <div className={`p-4 rounded-lg border-l-4 border-indigo-500 ${getSelectedProductType().color}`}>
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getSelectedProductType().icon}</span>
                        <div>
                          <h3 className="font-semibold">{getSelectedProductType().name}</h3>
                          <p className="text-sm mt-1">
                            Batch: {formData.batchSize} units × {formData.dosage} each
                          </p>
                          {formData.herbSpecies && (
                            <p className="text-xs mt-1">Herbs: {formData.herbSpecies}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Formulation Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="text-purple-600 mr-2">🧪</span>
                    Formulation Details & Excipients
                  </h2>

                  {/* Excipients Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Excipients * (Select applicable excipients)
                    </label>
                    {getAvailableExcipients().length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {getAvailableExcipients().map((excipient) => {
                          const isSelected = formData.excipients.split(',').map(e => e.trim()).includes(excipient);
                          return (
                            <label
                              key={excipient}
                              className={`
                                flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200
                                ${isSelected
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }
                              `}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleExcipientToggle(excipient)}
                                className="sr-only"
                              />
                              <span className="text-sm font-medium">
                                {excipient.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              {isSelected && (
                                <span className="ml-auto text-indigo-500">✓</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-yellow-800">
                          Please select a product type first to see available excipients.
                        </div>
                      </div>
                    )}
                    
                    {/* Manual Excipient Input */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Excipients (Manual Entry)
                      </label>
                      <input
                        type="text"
                        name="excipients"
                        value={formData.excipients}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., microcrystalline cellulose, magnesium stearate"
                      />
                      <div className="mt-1 text-xs text-gray-600">
                        Comma-separated list of excipients used in the formulation
                      </div>
                    </div>
                  </div>

                  {/* Multi-herb Formula Ratio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formula Ratio (For multi-herb products)
                    </label>
                    <input
                      type="text"
                      name="formulaRatio"
                      value={formData.formulaRatio}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder='e.g., {"Ashwagandha": "40%", "Tulsi": "30%", "Amla": "30%"}'
                    />
                    <div className="mt-1 text-xs text-gray-600">
                      JSON format specifying the percentage of each herb in the formulation
                    </div>
                  </div>

                  {/* Tablet Weight (if tablets selected) */}
                  {formData.productType === 'tablets' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tablet Weight * (Required for tablets)
                      </label>
                      <input
                        type="text"
                        name="tabletWeight"
                        value={formData.tabletWeight}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., 1000mg"
                      />
                      <div className="mt-1 text-xs text-gray-600">
                        Total weight of each tablet including active ingredients and excipients
                      </div>
                    </div>
                  )}

                  {/* Optional Product Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name (Optional)
                      </label>
                      <input
                        type="text"
                        name="productName"
                        value={formData.productName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="Commercial product name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shelf Life (Optional)
                      </label>
                      <input
                        type="text"
                        name="shelfLife"
                        value={formData.shelfLife}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., 24 months"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Storage Conditions (Optional)
                      </label>
                      <input
                        type="text"
                        name="storageConditions"
                        value={formData.storageConditions}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., Store in cool, dry place"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Packaging Type (Optional)
                      </label>
                      <input
                        type="text"
                        name="packagingType"
                        value={formData.packagingType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., HDPE bottle, Blister pack"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Brief description of the product and its intended use..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturing Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Any special manufacturing instructions, deviations, or observations..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Review & QR Generation */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="text-green-600 mr-2">📋</span>
                    Review & QR Code Generation
                  </h2>

                  {/* Timestamp */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Manufacturing Completion Timestamp *
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

                  {/* Formulation Summary */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="mr-2">📊</span>
                      Manufacturing Summary
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Product Batch ID:</span>
                          <span className="font-mono text-sm">{formData.productBatchId.slice(-20)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Product Type:</span>
                          <span className="font-medium">{getSelectedProductType()?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dosage:</span>
                          <span className="font-medium">{formData.dosage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Batch Size:</span>
                          <span className="font-medium">{formData.batchSize} units</span>
                        </div>
                        {formData.productName && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Product Name:</span>
                            <span className="font-medium">{formData.productName}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Manufacturer ID:</span>
                          <span className="font-mono text-sm">{manufacturerInfo?.blockchainUserId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Organization:</span>
                          <span className="font-medium">{manufacturerInfo?.mspId}</span>
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

                    {/* Input Materials and Formulation Details */}
                    <div className="mt-6 space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">Input Materials:</h4>
                        <div className="text-sm text-gray-600">
                          <div>Batches: {formData.inputBatches}</div>
                          {formData.herbSpecies && <div>Herbs: {formData.herbSpecies}</div>}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">Formulation Details:</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Excipients: {formData.excipients}</div>
                          {formData.formulaRatio && <div>Formula Ratio: {formData.formulaRatio}</div>}
                          {formData.tabletWeight && <div>Tablet Weight: {formData.tabletWeight}</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Generation Section */}
                  {(successFormulation || qrGenerated) && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">📱</span>
                        QR Code Generation
                      </h3>
                      
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1">
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>QR Token:</strong> {formData.qrToken}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Product Batch:</strong> {formData.productBatchId}
                          </div>
                          {qrGenerated && (
                            <div className="mt-2 text-sm text-green-600 font-medium">
                              ✅ QR Code successfully generated and linked to blockchain
                            </div>
                          )}
                        </div>
                        
                        {formData.qrToken && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <QRCodeDisplay value={formData.qrToken} size={120} />
                            <div className="text-center mt-2 text-xs text-gray-500">
                              Product QR Code
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div>
                  {currentStep > 1 && !successFormulation && (
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
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }
                      `}
                    >
                      Next →
                    </button>
                  ) : (
                    <>
                      {!successFormulation && (
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
                            disabled={submittingFormulation || !validateStep(1) || !validateStep(2) || !validateStep(3)}
                            className={`
                              px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center
                              ${submittingFormulation
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600'
                              }
                            `}
                          >
                            {submittingFormulation ? (
                              <>
                                <ButtonLoader />
                                Creating Formulation...
                              </>
                            ) : (
                              <>
                                <span className="mr-2">🏭</span>
                                Create Formulation
                              </>
                            )}
                          </button>
                        </>
                      )}
                      
                      {(successFormulation || qrGenerated) && (
                        <button
                          type="button"
                          onClick={() => navigate("/dashboard")}
                          className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center"
                        >
                          <span className="mr-2">✅</span>
                          Complete & Return to Dashboard
                        </button>
                      )}
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
