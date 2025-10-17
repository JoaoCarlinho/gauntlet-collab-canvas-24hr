import React from 'react';
import { getApiUrl } from '../utils/env';

export const EnvDebug: React.FC = () => {
  const apiUrl = getApiUrl();
  
  // Only show in development and not during Cypress tests
  if (import.meta.env.MODE !== 'development' || window.Cypress) {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>Environment Debug:</strong></div>
      <div>API URL: {apiUrl}</div>
      <div>Mode: {import.meta.env.MODE}</div>
      <div>VITE_API_URL: {import.meta.env.VITE_API_URL || 'NOT SET'}</div>
    </div>
  );
};
