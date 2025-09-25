// src/utils/tokenUtils.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const refreshToken = async () => {
  const tokens = JSON.parse(localStorage.getItem('ayurtrack_tokens'));
  
  if (!tokens || !tokens.refresh) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: tokens.refresh.token
      }),
    });

    if (response.ok) {
      const newTokens = await response.json();
      localStorage.setItem('ayurtrack_tokens', JSON.stringify(newTokens));
      return newTokens;
    } else {
      throw new Error('Token refresh failed');
    }
  } catch (error) {
    localStorage.removeItem('ayurtrack_user');
    localStorage.removeItem('ayurtrack_tokens');
    window.location.href = '/login';
    throw error;
  }
};

export const getAuthHeaders = async () => {
  const tokens = JSON.parse(localStorage.getItem('ayurtrack_tokens'));
  
  if (!tokens) {
    throw new Error('No tokens available');
  }

  // Check if access token is expired
  if (new Date(tokens.access.expires) <= new Date()) {
    const newTokens = await refreshToken();
    return {
      'Authorization': `Bearer ${newTokens.access.token}`,
      'Content-Type': 'application/json'
    };
  }

  return {
    'Authorization': `Bearer ${tokens.access.token}`,
    'Content-Type': 'application/json'
  };
};
