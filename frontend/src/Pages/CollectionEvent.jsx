import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiEndpoints } from "../services/api";
import { useSubmit } from "../hooks/useFetch";
import { ButtonLoader } from "../Components/Loader";
import Layout from "../Components/Layout";
import axios from "axios";
import { BASE_URL } from "../../api";
import { useAuth } from "../App";
import { getAuthHeaders } from "../utils/tokenUtils";

export default async function FarmerCollectionPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
  const [timestampStatus, setTimestampStatus] = useState('idle');
  const headers= await getAuthHeaders()
  // Get farmer info from session/context (this should come from authentication)
  const [farmerInfo, setFarmerInfo] = useState(null);
  
  // Default quality parameters - these will be used automatically (hidden from UI)
  const defaultQualityParams = {
    moistureLevel: "8.5",
    pesticidePPM: "1.2",
    qualityNotes: "High quality herbs collected with standard organic farming practices"
  };
  
  const [formData, setFormData] = useState({
    // User inputs
    species: "",
    quantity: "",
    
    // Auto-applied quality parameters (no user input needed, hidden from UI)
    moistureLevel: defaultQualityParams.moistureLevel,
    pesticidePPM: defaultQualityParams.pesticidePPM,
    qualityNotes: defaultQualityParams.qualityNotes,
    
    // Auto-generated fields (backend will generate these)
    batchId: "",
    collectionId: "",
    collectorId: "",
    gpsLat: "",
    gpsLng: "",
    timestamp: "",
    
    // Additional fields
    location: "",
    unit: "kg"
  });

  const { submit, submitting, error, success } = useSubmit(
    apiEndpoints.createCollectorEvent,
    {
      onSuccess: (result) => {
        console.log("Collection event created:", result);
        setTimeout(() => navigate("/dashboard"), 2000);
      },
    }
  );

  // Simulate getting farmer info from authentication context
  useEffect(() => {
    // In real implementation, this would come from your auth context/JWT token
    const mockFarmerInfo = {
      id: "F266201K3X", // Example farmer ID following your pattern
      name: "Ram Kumar Farmer",
      blockchainUserId: "F266201K3X",
      mspId: "Org1MSP"
    };
    setFarmerInfo(mockFarmerInfo);
    setFormData(prev => ({
      ...prev,
      collectorId: mockFarmerInfo.blockchainUserId
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCurrentLocation = () => {
    setLocationStatus('loading');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            gpsLat: position.coords.latitude.toString(),
            gpsLng: position.coords.longitude.toString(),
          }));
          setLocationStatus('success');
          
          // Optional: Reverse geocoding for location name
          if (position.coords.latitude && position.coords.longitude) {
            setFormData(prev => ({
              ...prev,
              location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
            }));
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationStatus('error');
          alert("Unable to get your location. Please enter coordinates manually.");
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      setLocationStatus('error');
      alert("Geolocation is not supported by this browser.");
    }
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
        return formData.species && formData.quantity;
      case 2:
        return formData.gpsLat && formData.gpsLng && formData.timestamp;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    } else {
      alert("Please fill in all required fields for this step.");
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(1) || !validateStep(2)) {
      alert("Please fill in all required fields");
      return;
    }

    if (!farmerInfo?.blockchainUserId) {
      alert("Farmer authentication required");
      return;
    }

    // Prepare data in the format expected by the chaincode
    // Quality parameters are automatically included from default values
    const submissionData = {
      collectorId: farmerInfo.blockchainUserId,
      lat: parseFloat(formData.gpsLat),
      long: parseFloat(formData.gpsLng),
      timestamp: formData.timestamp,
      species: formData.species,
      quantity: parseFloat(formData.quantity),
      quality: {
        moisture: parseFloat(formData.moistureLevel),
        pesticidePPM: parseFloat(formData.pesticidePPM)
      },
      qualityNotes: formData.qualityNotes,
      unit: formData.unit
    };

    const response = await axios.post(`${BASE_URL}/collections/createCollection`, collectionData, {
      headers: {headers
      }
    });
    
    console.log('Response:', response.data);
 
    console.log("Submitting collection data with default quality params:", submissionData);
    await submit(submissionData);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
              <span className="text-2xl">🌾</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Herb Collection Portal
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create a new herb batch with precise quality parameters and automated blockchain tracking
            </p>
            
            {farmerInfo && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg inline-block">
                <div className="text-sm text-blue-800">
                  <strong>Logged in as:</strong> {farmerInfo.name} 
                  <span className="ml-2 font-mono text-xs">({farmerInfo.blockchainUserId})</span>
                </div>
              </div>
            )}
          </div>

          {/* Progress Indicator - Now only shows 2 steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep >= step 
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {step}
                  </div>
                  {step < 2 && (
                    <div className={`
                      w-16 h-1 mx-2
                      ${currentStep > step ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4 space-x-16">
              <span className="text-sm font-medium text-gray-600">Basic Info</span>
              <span className="text-sm font-medium text-gray-600">Location & Review</span>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Farmer Info Banner */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white text-sm">
                <div>
                  <span className="font-medium">Farmer ID:</span>
                  <div className="font-mono">{farmerInfo?.blockchainUserId || 'Loading...'}</div>
                </div>
                <div>
                  <span className="font-medium">Organization:</span>
                  <div className="font-mono">{farmerInfo?.mspId || 'Loading...'}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-100">
                Batch and Collection IDs will be auto-generated by the blockchain system
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
                <div className="text-green-800">Collection data submitted successfully to blockchain!</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="text-green-600 mr-2">🌿</span>
                    Basic Collection Information
                  </h2>

                  {/* Species Input (Text Field) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Herb Species Name *
                    </label>
                    <input
                      type="text"
                      name="species"
                      value={formData.species}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter herb species name (e.g., Ashwagandha, Tulsi, Amla, Turmeric, Neem)"
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      Enter the exact name of the herb species you are collecting
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          step="0.1"
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter quantity (e.g., 50.5)"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-500 text-sm">{formData.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="kg">Kilograms (kg)</option>
                        <option value="g">Grams (g)</option>
                        <option value="tons">Tons</option>
                      </select>
                    </div>
                  </div>

                  {/* Collection Preview */}
                  {formData.species && formData.quantity && (
                    <div className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50">
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">🌿</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">{formData.species}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Quantity: <span className="font-medium">{formData.quantity} {formData.unit}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Location & Timestamp */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <span className="text-purple-600 mr-2">📍</span>
                    Location & Timestamp
                  </h2>

                  {/* GPS Coordinates */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      GPS Coordinates *
                    </label>
                    
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                        <input
                          type="text"
                          name="gpsLat"
                          value={formData.gpsLat}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="Latitude"
                          readOnly={locationStatus === 'loading'}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Longitude</label>
                        <input
                          type="text"
                          name="gpsLng"
                          value={formData.gpsLng}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="Longitude"
                          readOnly={locationStatus === 'loading'}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationStatus === 'loading'}
                      className={`
                        w-full md:w-auto px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center
                        ${locationStatus === 'loading'
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : locationStatus === 'success'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                        }
                      `}
                    >
                      {locationStatus === 'loading' && (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {locationStatus === 'loading' ? 'Getting Location...' :
                       locationStatus === 'success' ? '✓ Location Captured' :
                       '📍 Capture Current Location'}
                    </button>

                    {formData.location && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                        <div className="text-sm text-gray-600">
                          <strong>Coordinates:</strong> {formData.location}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Collection Timestamp *
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

                    <div className="mt-2 text-xs text-gray-600">
                      Click to capture the current date and time in ISO format
                    </div>
                  </div>

                  {/* Final Review - Quality parameters hidden but still in data */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="mr-2">📋</span>
                      Collection Summary
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Species:</span>
                          <span className="font-medium">{formData.species || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{formData.quantity ? `${formData.quantity} ${formData.unit}` : 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quality:</span>
                          <span className="font-medium text-green-600">✓ Standard Parameters Applied</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Farmer ID:</span>
                          <span className="font-mono text-sm">{farmerInfo?.blockchainUserId || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Coordinates:</span>
                          <span className="font-mono text-sm">
                            {formData.gpsLat && formData.gpsLng ? 'Set' : 'Not set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Timestamp:</span>
                          <span className="font-mono text-sm">
                            {formData.timestamp ? 'Set' : 'Not set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Blockchain:</span>
                          <span className="text-green-600 text-sm">Ready for submission</span>
                        </div>
                      </div>
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
                  {currentStep < 2 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!validateStep(currentStep)}
                      className={`
                        px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center
                        ${validateStep(currentStep)
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
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
                        disabled={submitting || !validateStep(1) || !validateStep(2)}
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
                            Submit to Blockchain
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
