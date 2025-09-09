/**
 * Action Item Card Component
 * Displays individual action items with status, priority, and assignment info
 */

import React from 'react';
import { ActionItem } from '../../../types/models';

interface ActionItemCardProps {
  actionItem: ActionItem;
  onStatusChange?: (id: string, status: ActionItem['status']) => void;
  onAssign?: (id: string, assignee: string) => void;
  onEdit?: (actionItem: ActionItem) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export const ActionItemCard: React.FC<ActionItemCardProps> = ({
  actionItem,
  onStatusChange,
  onAssign,
  onEdit,
  onDelete,
  compact = false
}) => {
  const getPriorityColor = (priority: ActionItem['priority']): string => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: ActionItem['status']): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: ActionItem['category']): string => {
    switch (category) {
      case 'compliance': return '⚖️';
      case 'implementation': return '🔧';
      case 'review': return '👀';
      case 'training': return '📚';
      case 'reporting': return '📊';
      default: return '📋';
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = actionItem.dueDate && actionItem.dueDate < new Date() && actionItem.status !== 'completed';
  const isDueSoon = actionItem.dueDate && actionItem.dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && actionItem.status !== 'completed';

  return (
    <div className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getCategoryIcon(actionItem.category)}</span>
          <h3 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
            {actionItem.title}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Priority Badge */}
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(actionItem.priority)}`}>
            {actionItem.priority.toUpperCase()}
          </span>
          
          {/* Status Badge */}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(actionItem.status)}`}>
            {actionItem.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Description */}
      {!compact && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {actionItem.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center space-x-4">
          {actionItem.assignedTo && (
            <span className="flex items-center">
              👤 {actionItem.assignedTo}
            </span>
          )}
          
          {actionItem.dueDate && (
            <span className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : isDueSoon ? 'text-orange-600 font-medium' : ''}`}>
              📅 {formatDate(actionItem.dueDate)}
              {isOverdue && ' (Overdue)'}
              {isDueSoon && !isOverdue && ' (Due Soon)'}
            </span>
          )}
          
          {actionItem.estimatedHours && (
            <span className="flex items-center">
              ⏱️ {actionItem.estimatedHours}h
            </span>
          )}
        </div>
        
        <span>
          Created {formatDate(actionItem.createdAt)}
        </span>
      </div>

      {/* Tags */}
      {actionItem.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {actionItem.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {/* Status Change Dropdown */}
          {onStatusChange && (
            <select
              value={actionItem.status}
              onChange={(e) => onStatusChange(actionItem.id, e.target.value as ActionItem['status'])}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          )}
          
          {/* Assign Button */}
          {onAssign && !actionItem.assignedTo && (
            <button
              onClick={() => {
                const assignee = prompt('Assign to:');
                if (assignee) onAssign(actionItem.id, assignee);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Assign
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Edit Button */}
          {onEdit && (
            <button
              onClick={() => onEdit(actionItem)}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Edit
            </button>
          )}
          
          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this action item?')) {
                  onDelete(actionItem.id);
                }
              }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionItemCard;