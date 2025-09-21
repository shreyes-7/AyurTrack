import React from "react";

export default function Loader({
  size = "medium",
  text = "Loading...",
  fullScreen = false,
}) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  const SpinnerComponent = () => (
    <div className="flex flex-col items-center space-y-3">
      {/* Spinning herb icon */}
      <div className={`${sizeClasses[size]} animate-spin`}>
        <svg
          className="w-full h-full text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </div>

      {/* Loading text */}
      {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <SpinnerComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <SpinnerComponent />
    </div>
  );
}

// Alternative loaders for different contexts
export const ButtonLoader = ({ className = "" }) => (
  <svg
    className={`animate-spin w-4 h-4 text-white ${className}`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const InlineLoader = ({ text = "Loading" }) => (
  <div className="flex items-center space-x-2 text-sm text-gray-600">
    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    <span>{text}</span>
  </div>
);

export const SkeletonLoader = ({ className = "", lines = 3 }) => (
  <div className={`animate-pulse ${className}`}>
    {[...Array(lines)].map((_, index) => (
      <div
        key={index}
        className={`h-4 bg-gray-200 rounded mb-2 ${
          index === lines - 1 ? "w-3/4" : "w-full"
        }`}
      />
    ))}
  </div>
);
