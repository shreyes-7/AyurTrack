import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Leaf, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App'; // Import from your main App file
import { BASE_URL } from '../../api';
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
  // Use the BASE_URL constant with the correct endpoint
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: formData.email,
      password: formData.password
    }),
  });

      const data = await response.json();

      if (response.ok) {
        // Use the login function from AuthContext to store user data and tokens
        login(data.user, data.tokens);
        
        // Get the intended destination from location state or redirect based on role
        const from = location.state?.from?.pathname || getDashboardRoute(data.user.role);
        navigate(from, { replace: true });
      } else {
        // Handle different types of errors from the API
        if (data.errors && Array.isArray(data.errors)) {
          // If API returns field-specific errors
          const fieldErrors = {};
          data.errors.forEach(error => {
            if (error.field) {
              fieldErrors[error.field] = error.message;
            }
          });
          setErrors(fieldErrors.email || fieldErrors.password ? fieldErrors : { general: data.message || 'Login failed' });
        } else {
          setErrors({ general: data.message || 'Invalid email or password' });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect user to appropriate dashboard based on their role
  const getDashboardRoute = (role) => {
    const dashboards = {
      farmer: '/dashboard',
      manufacturer: '/dashboard',
      processor: '/dashboard',
      admin: '/admin-dashboard',
      quality_controller: '/dashboard',
      distributor: '/dashboard',
      retailer: '/dashboard',
      consumer: '/consumer'
    };
    return dashboards[role] || '/dashboard';
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-emerald-50">
      {/* Local CSS for glass inputs */}
      <style>{`
        .glass-input {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #111827; /* dark text */
          transition: all 0.22s ease;
        }

        .glass-input::placeholder {
          color: rgba(100, 116, 139, 0.7); /* slate-500 */
        }

        .glass-input:focus {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(16, 185, 129, 0.5); /* emerald */
          box-shadow: 0 8px 30px rgba(16,185,129,0.1);
          outline: none;
        }

        .login-card {
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        .icon-fade {
          transition: color 0.22s ease;
        }
      `}</style>

      <div className="relative z-10 w-full max-w-5xl mx-4 flex items-center justify-center">
        <div className="grid lg:grid-cols-2 gap-8 w-full">
          
          {/* Left Side - Branding & Info */}
          <div className="hidden lg:flex flex-col justify-center space-y-8 p-12">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-slate-800">
                  AyurTrack
                </h1>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-slate-900 leading-tight">
                  Welcome back to the{' '}
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                    future
                  </span>{' '}
                  of herbal tracking
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Experience next-generation blockchain-secured authentication with 
                  cutting-edge traceability technology for modern businesses.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-slate-600">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span>End-to-end encrypted authentication</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <span>AI-powered supply chain insights</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600">
                  <Leaf className="w-5 h-5 text-emerald-500" />
                  <span>Real-time blockchain verification</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="relative backdrop-blur-xl bg-white/70 border border-slate-200 rounded-3xl shadow-2xl p-8 login-card">
                <div className="text-center mb-8 lg:hidden">
                  <div className="inline-flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">
                      AyurTrack
                    </h1>
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In</h2>
                  <p className="text-slate-600 text-sm">Access your secure dashboard</p>
                </div>

                {errors.general && (
                  <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-2xl text-red-700 text-sm backdrop-blur-sm">
                    {errors.general}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className={`h-5 w-5 icon-fade ${
                          focusedField === 'email' ? 'text-emerald-500' : 'text-slate-400'
                        }`} />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField('')}
                        placeholder="Enter your email"
                        className={`glass-input block w-full pl-12 pr-4 py-4 rounded-2xl text-slate-900 focus:outline-none ${
                          errors.email ? 'border-red-400 bg-red-50/70' : ''
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-600 text-xs mt-2">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className={`h-5 w-5 icon-fade ${
                          focusedField === 'password' ? 'text-emerald-500' : 'text-slate-400'
                        }`} />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField('')}
                        placeholder="Enter your password"
                        className={`glass-input block w-full pl-12 pr-14 py-4 rounded-2xl text-slate-900 focus:outline-none ${
                          errors.password ? 'border-red-400 bg-red-50/70' : ''
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-500 transition-colors duration-200 disabled:opacity-50"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-600 text-xs mt-2">{errors.password}</p>
                    )}
                  </div>

                  {/* Remember redirect info */}
                  {location.state?.from && (
                    <div className="text-xs text-slate-600 bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                      You'll be redirected to {location.state.from.pathname} after login
                    </div>
                  )}

                  {/* Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="ml-3">Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to AyurTrack</span>
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                      </>
                    )}
                  </button>
                </form>

               
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
