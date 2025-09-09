/**
 * Regulation Card Component - Displays regulation information in a card format
 */

import React from 'react';
import { RegulationCardProps } from '../types/dashboard';
import { RiskIndicator } from './RiskIndicator';
import { formatDate, formatRiskScore } from '../utils/formatting';

export const RegulationCard: React.FC<RegulationCardProps> = ({
  regulation,
  onClick,
  onActionClick,
  compact = false,
  showActions = true,
}) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick(regulation);
    }
  };

  const handleActionClick = (action: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onActionClick) {
      onActionClick(regulation, action);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#3182ce';
      case 'analyzed': return '#38a169';
      case 'reviewed': return '#805ad5';
      case 'archived': return '#718096';
      default: return '#4a5568';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`regulation-card ${compact ? 'compact' : ''}`} onClick={handleCardClick}>
      {/* Header */}
      <div className="card-header">
        <div className="card-title-section">
          <h3 className="card-title">
            {compact ? truncateText(regulation.title || 'Untitled Regulation', 60) : regulation.title}
          </h3>
          <div className="card-meta">
            <span className="card-source">{regulation.source}</span>
            <span className="card-date">{formatDate(regulation.date)}</span>
            <span 
              className="card-status"
              style={{ color: getStatusColor(regulation.status) }}
            >
              {regulation.status}
            </span>
          </div>
        </div>
        
        <div className="card-risk">
          <RiskIndicator
            score={regulation.riskScore || 0}
            priority={regulation.priority || 'low'}
            size={compact ? 'small' : 'medium'}
            showLabel={!compact}
          />
        </div>
      </div>

      {/* Content */}
      {!compact && (
        <div className="card-content">
          {regulation.summary && (
            <p className="card-summary">
              {truncateText(regulation.summary, 200)}
            </p>
          )}
          
          {regulation.insights && (
            <div className="card-insights">
              <div className="insight-item">
                <strong>What Changed:</strong> {truncateText(regulation.insights.whatChanged, 100)}
              </div>
              {regulation.insights.whoImpacted && regulation.insights.whoImpacted.length > 0 && (
                <div className="insight-item">
                  <strong>Who's Impacted:</strong> {regulation.insights.whoImpacted.slice(0, 3).join(', ')}
                  {regulation.insights.whoImpacted.length > 3 && ` +${regulation.insights.whoImpacted.length - 3} more`}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="card-actions">
          <button
            className="action-btn primary"
            onClick={(e) => handleActionClick('view', e)}
          >
            📄 View Details
          </button>
          <button
            className="action-btn secondary"
            onClick={(e) => handleActionClick('analyze', e)}
          >
            🔍 Re-analyze
          </button>
          {regulation.complianceChecklist && regulation.complianceChecklist.length > 0 && (
            <button
              className="action-btn secondary"
              onClick={(e) => handleActionClick('checklist', e)}
            >
              ✅ Checklist ({regulation.complianceChecklist.length})
            </button>
          )}
        </div>
      )}

      {/* Inline Styles */}
      <style>{`
        .regulation-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: ${compact ? '1rem' : '1.5rem'};
          margin-bottom: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .regulation-card:hover {
          border-color: #cbd5e0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .regulation-card.compact {
          padding: 1rem;
          margin-bottom: 0.5rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: ${compact ? '0' : '1rem'};
        }

        .card-title-section {
          flex: 1;
          margin-right: 1rem;
        }

        .card-title {
          font-size: ${compact ? '1rem' : '1.125rem'};
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 0.5rem 0;
          line-height: 1.4;
        }

        .card-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #718096;
        }

        .card-source {
          font-weight: 500;
        }

        .card-status {
          font-weight: 600;
          text-transform: capitalize;
        }

        .card-content {
          margin-bottom: 1rem;
        }

        .card-summary {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .card-insights {
          background: #f7fafc;
          border-radius: 0.5rem;
          padding: 1rem;
        }

        .insight-item {
          font-size: 0.875rem;
          color: #4a5568;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .insight-item:last-child {
          margin-bottom: 0;
        }

        .insight-item strong {
          color: #2d3748;
        }

        .card-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          border-top: 1px solid #e2e8f0;
          padding-top: 1rem;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .action-btn.primary {
          background: #3182ce;
          color: white;
        }

        .action-btn.primary:hover {
          background: #2c5282;
        }

        .action-btn.secondary {
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }

        .action-btn.secondary:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .card-header {
            flex-direction: column;
            gap: 1rem;
          }

          .card-title-section {
            margin-right: 0;
          }

          .card-meta {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .card-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default RegulationCard;