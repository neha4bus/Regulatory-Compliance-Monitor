/**
 * Error Boundary Component - Catches and handles React errors
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorBoundaryProps } from '../types/dashboard';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => (
  <div className="error-boundary-fallback">
    <div className="error-content">
      <div className="error-icon">⚠️</div>
      <h2 className="error-title">Something went wrong</h2>
      <p className="error-message">
        We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
      </p>
      
      <div className="error-actions">
        <button className="error-btn primary" onClick={resetError}>
          🔄 Try Again
        </button>
        <button 
          className="error-btn secondary" 
          onClick={() => window.location.reload()}
        >
          🔃 Refresh Page
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="error-details">
          <summary>Error Details (Development)</summary>
          <pre className="error-stack">
            {error.name}: {error.message}
            {error.stack}
          </pre>
        </details>
      )}
    </div>

    {/* Inline Styles */}
    <style>{`
      .error-boundary-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: 2rem;
        background: #f7fafc;
      }

      .error-content {
        background: white;
        border-radius: 0.75rem;
        padding: 2rem;
        max-width: 500px;
        width: 100%;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
      }

      .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .error-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1a202c;
        margin: 0 0 1rem 0;
      }

      .error-message {
        color: #4a5568;
        line-height: 1.6;
        margin-bottom: 2rem;
      }

      .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 2rem;
      }

      .error-btn {
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .error-btn.primary {
        background: #3182ce;
        color: white;
      }

      .error-btn.primary:hover {
        background: #2c5282;
      }

      .error-btn.secondary {
        background: #f7fafc;
        color: #4a5568;
        border: 1px solid #e2e8f0;
      }

      .error-btn.secondary:hover {
        background: #edf2f7;
        border-color: #cbd5e0;
      }

      .error-details {
        text-align: left;
        margin-top: 1rem;
        padding: 1rem;
        background: #f7fafc;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
      }

      .error-details summary {
        cursor: pointer;
        font-weight: 500;
        color: #4a5568;
        margin-bottom: 0.5rem;
      }

      .error-stack {
        font-size: 0.75rem;
        color: #e53e3e;
        background: #fed7d7;
        padding: 1rem;
        border-radius: 0.375rem;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        .error-boundary-fallback {
          padding: 1rem;
        }

        .error-content {
          padding: 1.5rem;
        }

        .error-actions {
          flex-direction: column;
        }

        .error-btn {
          width: 100%;
        }
      }
    `}</style>
  </div>
);

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error} 
            resetError={this.resetError} 
          />
        );
      }

      // Use default fallback
      return (
        <DefaultErrorFallback 
          error={this.state.error} 
          resetError={this.resetError} 
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;