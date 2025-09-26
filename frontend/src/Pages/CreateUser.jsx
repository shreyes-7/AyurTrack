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

  // Form state - FIXED: Added password field
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", // Added this field
    contact: "",
    role: "farmer",
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
      if (name === "role") {
        const selectedType = participantTypes.find(
          (type) => type.value === value
        );
        if (selectedType) {
          setFormData((prev) => ({
            ...prev,
            fabricOrganization: selectedType.org,
          }));
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
          : prev.operationalCapacity.processingTypes.filter(
              (pt) => pt !== type
            ),
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
      certificationDetails: prev.certificationDetails.filter(
        (_, i) => i !== index
      ),
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

  // FIXED: Validation function with proper null checks
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation with null/undefined checks
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation - make it optional since backend generates password
    if (formData.password && formData.password.trim()) {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = "Password must contain at least one letter and one number";
      }
    }

    if (!formData.contact || !formData.contact.trim()) {
      newErrors.contact = "Contact is required";
    }
    
    if (!formData.location.address || !formData.location.address.trim()) {
      newErrors["location.address"] = "Address is required";
    }

    if (!formData.location.latitude || isNaN(formData.location.latitude)) {
      newErrors["location.latitude"] = "Valid latitude is required";
    } else if (
      formData.location.latitude < -90 ||
      formData.location.latitude > 90
    ) {
      newErrors["location.latitude"] = "Latitude must be between -90 and 90";
    }

    if (!formData.location.longitude || isNaN(formData.location.longitude)) {
      newErrors["location.longitude"] = "Valid longitude is required";
    } else if (
      formData.location.longitude < -180 ||
      formData.location.longitude > 180
    ) {
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
      // Prepare data for API - Remove password if empty (let backend generate it)
      const userData = {
        ...formData,
        location: {
          ...formData.location,
          latitude: parseFloat(formData.location.latitude),
          longitude: parseFloat(formData.location.longitude),
        },
      };

      // Remove password if it's empty (backend will generate one)
      if (!userData.password || !userData.password.trim()) {
        delete userData.password;
      }

      // Make API call to create user
      const response = await axios.post(
        "http://localhost:3000/v1/auth/register",
        userData
      );

      // Success - redirect back to dashboard
      console.log("User created successfully:", response.data);
      navigate("/admin-dashboard", {
        state: { message: "User created successfully!" },
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
    switch (formData.role) {
      case "processor":
      case "manufacturer":
        return (
          <div className="space-y-6">
            <h4 className="text-lg md:text-xl font-semibold text-green-800 border-l-4 border-green-400 pl-2">
              Operational Capacity
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  label: "Daily Capacity",
                  name: "dailyCapacity",
                  placeholder: "e.g., 1000 kg/day",
                },
                {
                  label: "Storage Capacity",
                  name: "storageCapacity",
                  placeholder: "e.g., 5000 kg",
                },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    name={`operationalCapacity.${field.name}`}
                    value={formData.operationalCapacity[field.name]}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors hover:shadow-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "lab":
        return (
          <div className="space-y-6">
            <h4 className="text-lg md:text-xl font-semibold text-green-800 border-l-4 border-green-400 pl-2">
              Lab Capabilities
            </h4>

            {/* Processing Types */}
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Processing Types
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {processingTypeOptions.map((type) => (
                  <label
                    key={type}
                    className="flex items-center cursor-pointer text-sm text-green-700 hover:text-green-900 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.operationalCapacity.processingTypes.includes(
                        type
                      )}
                      onChange={(e) =>
                        handleProcessingTypeChange(type, e.target.checked)
                      }
                      className="mr-2 accent-green-600"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Certification Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-green-700">
                  Certification Details
                </label>
                <button
                  type="button"
                  onClick={addCertificationDetail}
                  className="flex items-center gap-1 text-sm text-green-600 hover:text-green-900 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Certification
                </button>
              </div>

              {formData.certificationDetails.map((cert, index) => (
                <div
                  key={index}
                  className="border border-green-200 rounded-xl p-4 mb-4 relative hover:shadow-sm transition-shadow bg-green-50/20"
                >
                  <button
                    type="button"
                    onClick={() => removeCertificationDetail(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        label: "Type",
                        value: cert.type,
                        key: "type",
                        type: "text",
                        placeholder: "Certification type",
                      },
                      {
                        label: "Issuer",
                        value: cert.issuer,
                        key: "issuer",
                        type: "text",
                        placeholder: "Issuing authority",
                      },
                      {
                        label: "Issue Date",
                        value: cert.issueDate,
                        key: "issueDate",
                        type: "date",
                      },
                      {
                        label: "Expiry Date",
                        value: cert.expiryDate,
                        key: "expiryDate",
                        type: "date",
                      },
                      {
                        label: "Certificate Number",
                        value: cert.certificateNumber,
                        key: "certificateNumber",
                        type: "text",
                        placeholder: "Certificate number",
                        colSpan: 2,
                      },
                    ].map((field, idx) => (
                      <div
                        key={idx}
                        className={
                          field.colSpan ? `md:col-span-${field.colSpan}` : ""
                        }
                      >
                        <label className="block text-xs font-medium text-green-600 mb-1">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          value={field.value}
                          placeholder={field.placeholder || ""}
                          onChange={(e) =>
                            updateCertificationDetail(
                              index,
                              field.key,
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-400 transition-colors hover:shadow-sm"
                        />
                      </div>
                    ))}
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
      <div className="space-y-8 px-4 md:px-8 lg:px-16 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="flex items-center gap-2 text-green-700 hover:text-green-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-700 via-green-500 to-green-400">
              Create New User
            </h1>
            <p className="text-gray-500 mt-2 text-sm md:text-base">
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
          <Card className="p-6 md:p-8 shadow-lg hover:shadow-2xl transition-shadow rounded-2xl bg-white">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
                  {errors.general}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-800 flex items-center gap-2 border-l-4 border-green-400 pl-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* FIXED: Added password field */}
                  {["name", "email", "password", "contact"].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-green-700 mb-2 capitalize">
                        {field.replace(/([A-Z])/g, " $1")}{" "}
                        {field !== "password" && <span className="text-red-500">*</span>}
                        {field === "password" && <span className="text-gray-400 text-xs">(Optional - auto-generated if empty)</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={
                            field === "email" 
                              ? "email" 
                              : field === "password" 
                                ? (showPassword ? "text" : "password")
                                : "text"
                          }
                          name={field}
                          value={formData[field]}
                          onChange={handleInputChange}
                          placeholder={`Enter ${field
                            .replace(/([A-Z])/g, " $1")
                            .toLowerCase()}`}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors ${
                            errors[field] ? "border-red-300" : "border-green-200"
                          }`}
                        />
                        {field === "password" && (
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                      {errors[field] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors[field]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rest of the form remains the same... */}
              {/* Blockchain Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-800 flex items-center gap-2 border-l-4 border-green-400 pl-2">
                  <Building className="w-5 h-5" />
                  Blockchain Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Participant Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
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
                      Fabric Organization{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="fabricOrganization"
                      value={formData.fabricOrganization}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
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
                <h3 className="text-xl font-semibold text-green-800 flex items-center gap-2 border-l-4 border-green-400 pl-2">
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
                      placeholder="Enter full address"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors ${
                        errors["location.address"]
                          ? "border-red-300"
                          : "border-green-200"
                      }`}
                    />
                    {errors["location.address"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors["location.address"]}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {["latitude", "longitude"].map((coord) => (
                      <div key={coord}>
                        <label className="block text-sm font-medium text-green-700 mb-2 capitalize">
                          {coord} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          name={`location.${coord}`}
                          value={formData.location[coord]}
                          onChange={handleInputChange}
                          placeholder={
                            coord === "latitude"
                              ? "e.g., 28.6139"
                              : "e.g., 77.2090"
                          }
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors ${
                            errors[`location.${coord}`]
                              ? "border-red-300"
                              : "border-green-200"
                          }`}
                        />
                        {errors[`location.${coord}`] && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors[`location.${coord}`]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-800 flex items-center gap-2 border-l-4 border-green-400 pl-2">
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
                        <label
                          key={cert}
                          className="flex items-center cursor-pointer hover:text-green-900 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.certifications.includes(cert)}
                            onChange={(e) =>
                              handleCertificationChange(cert, e.target.checked)
                            }
                            className="mr-2 accent-green-600"
                          />
                          <span className="text-sm">{cert}</span>
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
                      placeholder="Enter license number (if applicable)"
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Type-specific fields */}
              {renderTypeSpecificFields()}

              {/* Form Actions */}
              <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-6 border-t border-green-200">
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
