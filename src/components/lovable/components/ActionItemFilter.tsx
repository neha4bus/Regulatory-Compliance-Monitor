/**
 * Action Item Filter Component
 * Provides filtering and sorting controls for action items
 */

import React from 'react';
import { ActionItemFilter as FilterType, ActionItem } from '../../../types/models';

interface ActionItemFilterProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  availableUsers?: string[];
  className?: string;
}

export const ActionItemFilter: React.FC<ActionItemFilterProps> = ({
  filter,
  onFilterChange,
  availableUsers = [],
  className = ''
}) => {
  const updateFilter = (updates: Partial<FilterType>) => {
    onFilterChange({ ...filter, ...updates });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filter).length > 0;

  return (
    <div className={`bg-white rounded-lg border p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <div className="space-y-1">
            {(['pending', 'in_progress', 'completed', 'blocked'] as ActionItem['status'][]).map(status => (
              <label key={status} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.status?.includes(status) || false}
                  onChange={(e) => {
                    const currentStatuses = filter.status || [];
                    if (e.target.checked) {
                      updateFilter({ status: [...currentStatuses, status] });
                    } else {
                      updateFilter({ status: currentStatuses.filter(s => s !== status) });
                    }
                  }}
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-xs text-gray-600 capitalize">
                  {status.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Priority
          </label>
          <div className="space-y-1">
            {(['critical', 'high', 'medium', 'low'] as ActionItem['priority'][]).map(priority => (
              <label key={priority} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.priority?.includes(priority) || false}
                  onChange={(e) => {
                    const currentPriorities = filter.priority || [];
                    if (e.target.checked) {
                      updateFilter({ priority: [...currentPriorities, priority] });
                    } else {
                      updateFilter({ priority: currentPriorities.filter(p => p !== priority) });
                    }
                  }}
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-xs text-gray-600 capitalize">
                  {priority}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Category
          </label>
          <div className="space-y-1">
            {(['compliance', 'implementation', 'review', 'training', 'reporting'] as ActionItem['category'][]).map(category => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.category?.includes(category) || false}
                  onChange={(e) => {
                    const currentCategories = filter.category || [];
                    if (e.target.checked) {
                      updateFilter({ category: [...currentCategories, category] });
                    } else {
                      updateFilter({ category: currentCategories.filter(c => c !== category) });
                    }
                  }}
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-xs text-gray-600 capitalize">
                  {category}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Assignee Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Assigned To
          </label>
          {availableUsers.length > 0 ? (
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {availableUsers.map(user => (
                <label key={user} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filter.assignedTo?.includes(user) || false}
                    onChange={(e) => {
                      const currentUsers = filter.assignedTo || [];
                      if (e.target.checked) {
                        updateFilter({ assignedTo: [...currentUsers, user] });
                      } else {
                        updateFilter({ assignedTo: currentUsers.filter(u => u !== user) });
                      }
                    }}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-xs text-gray-600">
                    {user}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              placeholder="Enter username"
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value) {
                    const currentUsers = filter.assignedTo || [];
                    if (!currentUsers.includes(value)) {
                      updateFilter({ assignedTo: [...currentUsers, value] });
                    }
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          )}
          
          {/* Show selected users */}
          {filter.assignedTo && filter.assignedTo.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {filter.assignedTo.map(user => (
                <span
                  key={user}
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                >
                  {user}
                  <button
                    onClick={() => {
                      updateFilter({ 
                        assignedTo: filter.assignedTo?.filter(u => u !== user) 
                      });
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Due Date Range */}
      <div className="border-t pt-4">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Due Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={filter.dueDateRange?.start?.toISOString().split('T')[0] || ''}
            onChange={(e) => {
              const start = e.target.value ? new Date(e.target.value) : undefined;
              updateFilter({
                dueDateRange: {
                  ...filter.dueDateRange,
                  start
                }
              });
            }}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Start date"
          />
          <input
            type="date"
            value={filter.dueDateRange?.end?.toISOString().split('T')[0] || ''}
            onChange={(e) => {
              const end = e.target.value ? new Date(e.target.value) : undefined;
              updateFilter({
                dueDateRange: {
                  ...filter.dueDateRange,
                  end
                }
              });
            }}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="End date"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="border-t pt-4">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Quick Filters
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateFilter({ status: ['pending', 'in_progress'] })}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
          >
            Active Items
          </button>
          <button
            onClick={() => updateFilter({ priority: ['critical', 'high'] })}
            className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200"
          >
            High Priority
          </button>
          <button
            onClick={() => {
              const sevenDaysFromNow = new Date();
              sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
              updateFilter({
                dueDateRange: { end: sevenDaysFromNow },
                status: ['pending', 'in_progress']
              });
            }}
            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
          >
            Due Soon
          </button>
          <button
            onClick={() => {
              const today = new Date();
              updateFilter({
                dueDateRange: { end: today },
                status: ['pending', 'in_progress']
              });
            }}
            className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200"
          >
            Overdue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionItemFilter;