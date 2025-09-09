/**
 * Loading Spinner Component - Reusable loading indicator
 */

import React from 'react';
import { LoadingSpinnerProps } from '../types/dashboard';

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#3182ce',
  message,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return '24px';
      case 'large': return '64px';
      default: return '40px';
    }
  };

  const spinnerSize = getSize();

  return (
    <div className="loading-spinner">
      <div className="spinner" style={{ width: spinnerSize, height: spinnerSize }}>
        <div className="spinner-ring" style={{ borderTopColor: color }}></div>
      </div>
      
      {message && (
        <div className="loading-message">{message}</div>
      )}

      {/* Inline Styles */}
      <style>{`
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .spinner {
          position: relative;
          display: inline-block;
        }

        .spinner-ring {
          width: 100%;
          height: 100%;
          border: 3px solid #e2e8f0;
          border-top: 3px solid ${color};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-message {
          color: #4a5568;
          font-size: 0.875rem;
          text-align: center;
          font-weight: 500;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Size-specific adjustments */
        .loading-spinner.small .loading-message {
          font-size: 0.75rem;
        }

        .loading-spinner.large .loading-message {
          font-size: 1rem;
        }

        /* Pulsing animation for message */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .loading-message {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;