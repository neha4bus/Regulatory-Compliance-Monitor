/**
 * Action Item Component - Displays action items with status and priority
 */

import React from 'react';
import { ActionItemProps } from '../types/dashboard';
import { formatDate, getPriorityColor } from '../utils/formatting';

export const ActionItem: React.FC<ActionItemProps> = ({
  id,
  title,
  description,
  priority,
  status,
  assignee,
  dueDate,
  regulationId,
  onClick,
  onStatusChange,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const handleStatusChange = (newStatus: ActionItemProps['status']) => {
    if (onStatusChange) {
      onStatusChange(id, newStatus);
    }
  };

  const getStatusIcon = (status: ActionItemProps['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in_progress': return '🔄';
      case 'completed': return '✅';
      case 'overdue': return '🚨';
      default: return '❓';
    }
  };

  const getStatusColor = (status: ActionItemProps['status']) => {
    switch (status) {
      case 'pending': return '#ed8936';
      case 'in_progress': return '#3182ce';
      case 'completed': return '#38a169';
      case 'overdue': return '#e53e3e';
      default: return '#718096';
    }
  };

  const getPriorityIcon = (priority: ActionItemProps['priority']) => {
    switch (priority) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'completed';

  return (
    <div className={`action-item ${status} ${priority}`} onClick={handleClick}>
      {/* Header */}
      <div className="action-header">
        <div className="action-title-section">
          <h4 className="action-title">{title}</h4>
          <div className="action-meta">
            <span className="action-priority">
              {getPriorityIcon(priority)} {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
            {assignee && (
              <span className="action-assignee">
                👤 {assignee}
              </span>
            )}
            {dueDate && (
              <span className={`action-due-date ${isOverdue ? 'overdue' : ''}`}>
                📅 {formatDate(dueDate)}
              </span>
            )}
          </div>
        </div>
        
        <div className="action-status-section">
          <div 
            className="action-status"
            style={{ color: getStatusColor(status) }}
          >
            {getStatusIcon(status)} {status.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="action-description">
        {description}
      </div>

      {/* Actions */}
      <div className="action-controls">
        <div className="status-controls">
          <label className="status-label">Status:</label>
          <select
            className="status-select"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as ActionItemProps['status'])}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        
        {regulationId && (
          <button
            className="regulation-link"
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Navigate to regulation: ${regulationId}`);
            }}
          >
            📋 View Regulation
          </button>
        )}
      </div>

      {/* Inline Styles */}
      <style>{`
        .action-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1.25rem;
          margin-bottom: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .action-item:hover {
          border-color: #cbd5e0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .action-item.completed {
          background: #f0fff4;
          border-color: #9ae6b4;
        }

        .action-item.overdue {
          background: #fed7d7;
          border-color: #fc8181;
        }

        .action-item.critical {
          border-left: 4px solid #e53e3e;
        }

        .action-item.high {
          border-left: 4px solid #ed8936;
        }

        .action-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .action-title-section {
          flex: 1;
          margin-right: 1rem;
        }

        .action-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 0.5rem 0;
          line-height: 1.4;
        }

        .action-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #718096;
          flex-wrap: wrap;
        }

        .action-priority {
          font-weight: 500;
          color: ${getPriorityColor(priority)};
        }

        .action-due-date.overdue {
          color: #e53e3e;
          font-weight: 600;
        }

        .action-status-section {
          text-align: right;
        }

        .action-status {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .action-description {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .action-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 1rem;
          gap: 1rem;
        }

        .status-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #4a5568;
        }

        .status-select {
          padding: 0.375rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: white;
          cursor: pointer;
        }

        .status-select:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .regulation-link {
          padding: 0.375rem 0.75rem;
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .regulation-link:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .action-header {
            flex-direction: column;
            gap: 0.75rem;
          }

          .action-title-section {
            margin-right: 0;
          }

          .action-meta {
            gap: 0.5rem;
          }

          .action-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }

          .status-controls {
            justify-content: space-between;
          }

          .regulation-link {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ActionItem;