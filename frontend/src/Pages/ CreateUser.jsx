import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import Layout from "../Components/Layout";
import Card from "../Components/Card";
import {
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Building,
  Award,
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function CreateUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    participantType: "farmer",
    fabricOrganization: "FarmerOrg",
    location: {
      address: "",
      latitude: "",
      longitude: "",
    },
    certifications: [],
    license: "",
    operationalCapacity: {
      dailyCapacity: "",
      storageCapacity: "",
      processingTypes: [],
    },
    certificationDetails: [],
  });

  // Options for dropdowns
  const participantTypes = [
    { value: "farmer", label: "Farmer", org: "FarmerOrg" },
    { value: "processor", label: "Processor", org: "ProcessorOrg" },
    { value: "lab", label: "Lab Technician", org: "LabOrg" },
    { value: "manufacturer", label: "Manufacturer", org: "ManufacturerOrg" },
  ];

  const organizationOptions = [
    "FarmerOrg",
    "ProcessorOrg",
    "CollectorOrg",
    "LabOrg",
    "ManufacturerOrg",
  ];

  const certificationOptions = [
    "Organic",
    "Fair Trade",
    "ISO 9001",
    "HACCP",
    "GMP",
    "FDA Approved",
    "USDA Organic",
    "Non-GMO",
  ];

  const processingTypeOptions = [
    "Drying",
    "Extraction",
    "Grinding",
    "Packaging",
    "Quality Testing",
    "Purification",
    "Distillation",
  ];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      // Auto-update organization when participant type changes
      if (name === "participantType") {
        const selectedType = participantTypes.find(type => type.value === value);
        if (selectedType) {
          setFormData((prev) => ({ ...prev, fabricOrganization: selectedType.org }));
        }
      }
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle certification changes
  const handleCertificationChange = (certification, isChecked) => {
    setFormData((prev) => ({
      ...prev,
      certifications: isChecked
        ? [...prev.certifications, certification]
        : prev.certifications.filter((cert) => cert !== certification),
    }));
  };

  // Handle processing type changes
  const handleProcessingTypeChange = (type, isChecked) => {
    setFormData((prev) => ({
      ...prev,
      operationalCapacity: {
        ...prev.operationalCapacity,
        processingTypes: isChecked
          ? [...prev.operationalCapacity.processingTypes, type]
          : prev.operationalCapacity.processingTypes.filter((pt) => pt !== type),
      },
    }));
  };

  // Add certification detail
  const addCertificationDetail = () => {
    setFormData((prev) => ({
      ...prev,
      certificationDetails: [
        ...prev.certificationDetails,
        {
          type: "",
          issuer: "",
          issueDate: "",
          expiryDate: "",
          certificateNumber: "",
        },
      ],
    }));
  };

  // Remove certification detail
  const removeCertificationDetail = (index) => {
    setFormData((prev) => ({
      ...prev,
      certificationDetails: prev.certificationDetails.filter((_, i) => i !== index),
    }));
  };

  // Update certification detail
  const updateCertificationDetail = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      certificationDetails: prev.certificationDetails.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      ),
    }));
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    
    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password))
      newErrors.password = "Password must contain at least one letter and one number";

    if (!formData.contact.trim()) newErrors.contact = "Contact is required";
    if (!formData.location.address.trim())
      newErrors["location.address"] = "Address is required";
    
    if (!formData.location.latitude || isNaN(formData.location.latitude)) {
      newErrors["location.latitude"] = "Valid latitude is required";
    } else if (formData.location.latitude < -90 || formData.location.latitude > 90) {
      newErrors["location.latitude"] = "Latitude must be between -90 and 90";
    }
    
    if (!formData.location.longitude || isNaN(formData.location.longitude)) {
      newErrors["location.longitude"] = "Valid longitude is required";
    } else if (formData.location.longitude < -180 || formData.location.longitude > 180) {
      newErrors["location.longitude"] = "Longitude must be between -180 and 180";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Prepare data for API
      const userData = {
        ...formData,
        location: {
          ...formData.location,
          latitude: parseFloat(formData.location.latitude),
          longitude: parseFloat(formData.location.longitude),
        },
      };

      // Make API call to create user
      const response = await axios.post("http://localhost:3000/v1/auth/register", userData);
      
      // Success - redirect back to dashboard
      console.log("User created successfully:", response.data);
      navigate("/admin-dashboard", { 
        state: { message: "User created successfully!" } 
      });
      
    } catch (error) {
      console.error("Error creating user:", error);
      
      // Handle API errors
      if (error.response?.data?.message) {
        if (error.response.data.message.includes("email")) {
          setErrors({ email: "Email already exists" });
        } else {
          setErrors({ general: error.response.data.message });
        }
      } else {
        setErrors({ general: "Failed to create user. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  // Render type-specific fields
  const renderTypeSpecificFields = () => {
    switch (formData.participantType) {
      case "processor":
      case "manufacturer":
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-green-800">
              Operational Capacity
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">
                  Daily Capacity
                </label>
                <input
                  type="text"
                  name="operationalCapacity.dailyCapacity"
                  value={formData.operationalCapacity.dailyCapacity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="e.g., 1000 kg/day"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">
                  Storage Capacity
                </label>
                <input
                  type="text"
                  name="operationalCapacity.storageCapacity"
                  value={formData.operationalCapacity.storageCapacity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="e.g., 5000 kg"
                />
              </div>
            </div>
          </div>
        );

      case "lab":
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-green-800">
              Lab Capabilities
            </h4>
            
            {/* Processing Types */}
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Processing Types
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {processingTypeOptions.map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.operationalCapacity.processingTypes.includes(
                        type
                      )}
                      onChange={(e) =>
                        handleProcessingTypeChange(type, e.target.checked)
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-green-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Certification Details */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-green-700">
                  Certification Details
                </label>
                <button
                  type="button"
                  onClick={addCertificationDetail}
                  className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
                >
                  <Plus className="w-4 h-4" />
                  Add Certification
                </button>
              </div>
              
              {formData.certificationDetails.map((cert, index) => (
                <div
                  key={index}
                  className="border border-green-200 rounded-lg p-4 mb-4 relative"
                >
                  <button
                    type="button"
                    onClick={() => removeCertificationDetail(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-1">
                        Type
                      </label>
                      <input
                        type="text"
                        value={cert.type}
                        onChange={(e) =>
                          updateCertificationDetail(index, "type", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-green-200 rounded focus:outline-none focus:ring-1 focus:ring-green-400"
                        placeholder="Certification type"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-1">
                        Issuer
                      </label>
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) =>
                          updateCertificationDetail(index, "issuer", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-green-200 rounded focus:outline-none focus:ring-1 focus:ring-green-400"
                        placeholder="Issuing authority"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-1">
                        Issue Date
                      </label>
                      <input
                        type="date"
                        value={cert.issueDate}
                        onChange={(e) =>
                          updateCertificationDetail(index, "issueDate", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-green-200 rounded focus:outline-none focus:ring-1 focus:ring-green-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={cert.expiryDate}
                        onChange={(e) =>
                          updateCertificationDetail(index, "expiryDate", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-green-200 rounded focus:outline-none focus:ring-1 focus:ring-green-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-green-600 mb-1">
                        Certificate Number
                      </label>
                      <input
                        type="text"
                        value={cert.certificateNumber}
                        onChange={(e) =>
                          updateCertificationDetail(
                            index,
                            "certificateNumber",
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-1 text-sm border border-green-200 rounded focus:outline-none focus:ring-1 focus:ring-green-400"
                        placeholder="Certificate number"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="flex items-center gap-2 text-green-600 hover:text-green-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-green-500 to-green-400">
              Create New User
            </h1>
            <p className="text-gray-500 mt-1">
              Add a new participant to the blockchain network
            </p>
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* General Error */}
              {errors.general && (
                <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
                  {errors.general}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-800 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
                        errors.name ? "border-red-300" : "border-green-200"
                      }`}
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
                        errors.email ? "border-red-300" : "border-green-200"
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
                          errors.password ? "border-red-300" : "border-green-200"
                        }`}
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
                        errors.contact ? "border-red-300" : "border-green-200"
                      }`}
                      placeholder="Enter contact number"
                    />
                    {errors.contact && (
                      <p className="text-red-500 text-sm mt-1">{errors.contact}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Blockchain Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-800 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Blockchain Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Participant Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="participantType"
                      value={formData.participantType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      {participantTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Fabric Organization <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="fabricOrganization"
                      value={formData.fabricOrganization}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      {organizationOptions.map((org) => (
                        <option key={org} value={org}>
                          {org}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
                        errors["location.address"] ? "border-red-300" : "border-green-200"
                      }`}
                      placeholder="Enter full address"
                    />
                    {errors["location.address"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors["location.address"]}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Latitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="location.latitude"
                        value={formData.location.latitude}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
                          errors["location.latitude"] ? "border-red-300" : "border-green-200"
                        }`}
                        placeholder="e.g., 28.6139"
                        min="-90"
                        max="90"
                      />
                      {errors["location.latitude"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors["location.latitude"]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Longitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="location.longitude"
                        value={formData.location.longitude}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
                          errors["location.longitude"] ? "border-red-300" : "border-green-200"
                        }`}
                        placeholder="e.g., 77.2090"
                        min="-180"
                        max="180"
                      />
                      {errors["location.longitude"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors["location.longitude"]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-800 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certifications & Licenses
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Certifications
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {certificationOptions.map((cert) => (
                        <label key={cert} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.certifications.includes(cert)}
                            onChange={(e) =>
                              handleCertificationChange(cert, e.target.checked)
                            }
                            className="mr-2"
                          />
                          <span className="text-sm text-green-700">{cert}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      name="license"
                      value={formData.license}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="Enter license number (if applicable)"
                    />
                  </div>
                </div>
              </div>

              {/* Type-specific fields */}
              {renderTypeSpecificFields()}

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-green-200">
                <button
                  type="button"
                  onClick={() => navigate("/admin-dashboard")}
                  className="flex items-center gap-2 px-4 py-2 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Creating User..." : "Create User"}
                </button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
