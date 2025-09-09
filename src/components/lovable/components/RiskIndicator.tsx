/**
 * Risk Indicator Component - Visual risk score and priority display
 */

import React from 'react';
import { RiskIndicatorProps } from '../types/dashboard';
import { formatRiskScore, getPriorityColor } from '../utils/formatting';

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  score,
  priority,
  size = 'medium',
  showLabel = true,
  animated = false,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return { width: '40px', height: '40px', fontSize: '0.75rem' };
      case 'large': return { width: '80px', height: '80px', fontSize: '1.25rem' };
      default: return { width: '60px', height: '60px', fontSize: '1rem' };
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  const getProgressPercentage = () => {
    return Math.min(100, (score / 10) * 100);
  };

  const sizeStyles = getSize();
  const progressPercentage = getProgressPercentage();
  const priorityColor = getPriorityColor(priority);

  return (
    <div className="risk-indicator">
      {/* Circular Progress Indicator */}
      <div className="risk-circle" style={sizeStyles}>
        <svg
          className="risk-progress"
          width={sizeStyles.width}
          height={sizeStyles.height}
          viewBox="0 0 100 100"
        >
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          
          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={priorityColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progressPercentage * 2.827} 282.7`}
            strokeDashoffset="70.675"
            className={animated ? 'animated' : ''}
            transform="rotate(-90 50 50)"
          />
        </svg>
        
        {/* Score Display */}
        <div className="risk-score" style={{ fontSize: sizeStyles.fontSize }}>
          {formatRiskScore(score)}
        </div>
      </div>

      {/* Label and Priority */}
      {showLabel && (
        <div className="risk-label">
          <div className="risk-priority" style={{ color: priorityColor }}>
            {getPriorityIcon(priority)} {priority.toUpperCase()}
          </div>
          <div className="risk-text">Risk Score</div>
        </div>
      )}

      {/* Inline Styles */}
      <style>{`
        .risk-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .risk-circle {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .risk-progress {
          transform: rotate(-90deg);
        }

        .risk-progress circle.animated {
          transition: stroke-dasharray 1s ease-in-out;
        }

        .risk-score {
          position: absolute;
          font-weight: 700;
          color: #1a202c;
          text-align: center;
        }

        .risk-label {
          text-align: center;
        }

        .risk-priority {
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.125rem;
        }

        .risk-text {
          font-size: 0.625rem;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Size Variations */
        .risk-indicator.small .risk-priority {
          font-size: 0.625rem;
        }

        .risk-indicator.small .risk-text {
          font-size: 0.5rem;
        }

        .risk-indicator.large .risk-priority {
          font-size: 0.875rem;
        }

        .risk-indicator.large .risk-text {
          font-size: 0.75rem;
        }

        /* Animation for score changes */
        @keyframes scoreChange {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .risk-score.changing {
          animation: scoreChange 0.3s ease-in-out;
        }

        /* Pulse animation for critical items */
        @keyframes criticalPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .risk-indicator.critical .risk-circle {
          animation: criticalPulse 2s infinite;
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          .risk-indicator {
            gap: 0.25rem;
          }
          
          .risk-priority {
            font-size: 0.625rem !important;
          }
          
          .risk-text {
            font-size: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RiskIndicator;