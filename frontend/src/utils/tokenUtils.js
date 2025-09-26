// src/utils/tokenUtils.js

/**
 * Safely get environment variable (works in Vite + CRA).
 * Falls back to a default value if not found.
 */
const getEnvVar = (key, defaultValue) => {
  try {
    // For Vite
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return import.meta.env[key] || defaultValue;
    }
  } catch (_) {}

  try {
    // For Create React App (CRA)
    if (typeof process !== "undefined" && process.env) {
      return process.env[key] || defaultValue;
    }
  } catch (_) {}

  return defaultValue;
};

// Base API URL from env or fallback to localhost
const API_BASE_URL =
  getEnvVar("VITE_API_URL", null) ||
  getEnvVar("REACT_APP_API_URL", null) ||
  "http://localhost:3000";

/**
 * Refresh the access token using the refresh token.
 */
export const refreshToken = async () => {
  const tokens = JSON.parse(localStorage.getItem("ayurtrack_tokens"));

  if (!tokens || !tokens.refresh) {
    throw new Error("No refresh token available");
  }

  const response = await fetch(`${API_BASE_URL}/v1/auth/refresh-tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: tokens.refresh.token }),
  });

  if (response.ok) {
    const newTokens = await response.json();
    localStorage.setItem("ayurtrack_tokens", JSON.stringify(newTokens));
    return newTokens;
  } else {
    // clear tokens and redirect to login
    localStorage.removeItem("ayurtrack_user");
    localStorage.removeItem("ayurtrack_tokens");
    window.location.href = "/login";
    throw new Error("Token refresh failed");
  }
};

/**
 * Always return valid Authorization headers.
 * Automatically refreshes token if expired.
 */
export const getAuthHeaders = async () => {
  const tokens = JSON.parse(localStorage.getItem("ayurtrack_tokens"));

  if (!tokens) {
    throw new Error("No tokens available");
  }

  // refresh if access token is expired
  if (new Date(tokens.access.expires) <= new Date()) {
    const newTokens = await refreshToken();
    return {
      Authorization: `Bearer ${newTokens.access.token}`,
      "Content-Type": "application/json",
    };
  }

  return {
    Authorization: `Bearer ${tokens.access.token}`,
    "Content-Type": "application/json",
  };
};

// === Helper functions ===

export const getToken = () => {
  const tokens = JSON.parse(localStorage.getItem("ayurtrack_tokens"));
  return tokens?.access?.token || null;
};

export const setTokens = (tokens) => {
  localStorage.setItem("ayurtrack_tokens", JSON.stringify(tokens));
};

export const removeTokens = () => {
  localStorage.removeItem("ayurtrack_user");
  localStorage.removeItem("ayurtrack_tokens");
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const isLoggedIn = () => {
  const tokens = JSON.parse(localStorage.getItem("ayurtrack_tokens"));
  if (!tokens?.access) return false;
  return new Date(tokens.access.expires) > new Date();
};
