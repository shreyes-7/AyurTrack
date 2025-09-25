// src/components/Unauthorized.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <div className="unauthorized-container">
      <h1>Access Denied</h1>
      <p>You don't have permission to access this page.</p>
      {user && (
        <p>Current role: <strong>{user.role}</strong></p>
      )}
      <Link to="/dashboard">Go to Dashboard</Link>
    </div>
  );
};

export default Unauthorized;
