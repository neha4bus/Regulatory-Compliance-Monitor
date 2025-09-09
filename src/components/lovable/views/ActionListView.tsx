/**
 * Action List View Component
 * Main view for managing action items with filtering, sorting, and CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { ActionItem, ActionItemFilter, ActionItemStats } from '../../../types/models';
import ActionItemCard from '../components/ActionItemCard';
import { ActionItemFilter as FilterComponent } from '../components/ActionItemFilter';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface ActionListViewProps {
  className?: string;
}

export const ActionListView: React.FC<ActionListViewProps> = ({ className = '' }) => {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ActionItem[]>([]);
  const [filter, setFilter] = useState<ActionItemFilter>({});
  const [stats, setStats] = useState<ActionItemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data for demo - in real app this would come from API
  useEffect(() => {
    loadActionItems();
  }, []);

  const loadActionItems = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockActionItems: ActionItem[] = [
        {
          id: 'action-001',
          regulationId: 'epa-2025-001',
          title: 'Install Continuous Emission Monitoring Systems',
          description: 'Install CEMS on all offshore platforms as required by new EPA regulations',
          priority: 'critical',
          status: 'pending',
          assignedTo: 'john.doe@company.com',
          dueDate: new Date('2025-02-15'),
          createdAt: new Date('2025-01-08'),
          updatedAt: new Date('2025-01-08'),
          category: 'implementation',
          tags: ['EPA', 'offshore', 'monitoring'],
          estimatedHours: 120
        },
        {
          id: 'action-002',
          regulationId: 'epa-2025-001',
          title: 'Submit Compliance Plan to EPA',
          description: 'Prepare and submit detailed compliance plan within 30 days',
          priority: 'high',
          status: 'in_progress',
          assignedTo: 'jane.smith@company.com',
          dueDate: new Date('2025-02-07'),
          createdAt: new Date('2025-01-08'),
          updatedAt: new Date('2025-01-09'),
          category: 'compliance',
          tags: ['EPA', 'documentation', 'deadline'],
          estimatedHours: 16,
          actualHours: 8
        },
        {
          id: 'action-003',
          regulationId: 'tx-rrc-2025-003',
          title: 'Install Gas Capture Systems',
          description: 'Install mandatory gas capture systems for all new wells',
          priority: 'high',
          status: 'pending',
          assignedTo: 'mike.johnson@company.com',
          dueDate: new Date('2025-03-15'),
          createdAt: new Date('2025-01-06'),
          updatedAt: new Date('2025-01-06'),
          category: 'implementation',
          tags: ['Texas RRC', 'gas capture', 'wells'],
          estimatedHours: 80
        },
        {
          id: 'action-004',
          regulationId: 'osha-2025-005',
          title: 'Conduct Safety Training for All Personnel',
          description: 'Complete 16-hour initial safety certification for new workers',
          priority: 'medium',
          status: 'completed',
          assignedTo: 'sarah.wilson@company.com',
          dueDate: new Date('2025-04-01'),
          createdAt: new Date('2025-01-04'),
          updatedAt: new Date('2025-01-10'),
          completedAt: new Date('2025-01-10'),
          category: 'training',
          tags: ['OSHA', 'safety', 'training'],
          estimatedHours: 40,
          actualHours: 35
        },
        {
          id: 'action-005',
          regulationId: 'doe-2025-002',
          title: 'Update Emergency Response Plans',
          description: 'Update emergency response plans with community notification systems',
          priority: 'medium',
          status: 'blocked',
          assignedTo: 'alex.brown@company.com',
          dueDate: new Date('2025-05-01'),
          createdAt: new Date('2025-01-07'),
          updatedAt: new Date('2025-01-09'),
          category: 'compliance',
          tags: ['DOE', 'emergency', 'community'],
          estimatedHours: 24,
          notes: 'Waiting for community liaison approval'
        }
      ];

      setActionItems(mockActionItems);
      setFilteredItems(mockActionItems);
      
      // Calculate stats
      const mockStats: ActionItemStats = {
        total: mockActionItems.length,
        byStatus: {
          pending: mockActionItems.filter(item => item.status === 'pending').length,
          in_progress: mockActionItems.filter(item => item.status === 'in_progress').length,
          completed: mockActionItems.filter(item => item.status === 'completed').length,
          blocked: mockActionItems.filter(item => item.status === 'blocked').length
        },
        byPriority: {
          critical: mockActionItems.filter(item => item.priority === 'critical').length,
          high: mockActionItems.filter(item => item.priority === 'high').length,
          medium: mockActionItems.filter(item => item.priority === 'medium').length,
          low: mockActionItems.filter(item => item.priority === 'low').length
        },
        byCategory: {
          compliance: mockActionItems.filter(item => item.category === 'compliance').length,
          implementation: mockActionItems.filter(item => item.category === 'implementation').length,
          review: mockActionItems.filter(item => item.category === 'review').length,
          training: mockActionItems.filter(item => item.category === 'training').length,
          reporting: mockActionItems.filter(item => item.category === 'reporting').length
        },
        overdue: mockActionItems.filter(item => 
          item.dueDate && item.dueDate < new Date() && item.status !== 'completed'
        ).length,
        dueSoon: mockActionItems.filter(item => 
          item.dueDate && 
          item.dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && 
          item.status !== 'completed'
        ).length
      };
      
      setStats(mockStats);
      setError(null);
    } catch (err) {
      setError('Failed to load action items');
      console.error('Error loading action items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever filter changes
  useEffect(() => {
    applyFilters();
  }, [filter, actionItems]);

  const applyFilters = () => {
    let filtered = [...actionItems];

    if (filter.status && filter.status.length > 0) {
      filtered = filtered.filter(item => filter.status!.includes(item.status));
    }

    if (filter.priority && filter.priority.length > 0) {
      filtered = filtered.filter(item => filter.priority!.includes(item.priority));
    }

    if (filter.category && filter.category.length > 0) {
      filtered = filtered.filter(item => filter.category!.includes(item.category));
    }

    if (filter.assignedTo && filter.assignedTo.length > 0) {
      filtered = filtered.filter(item => 
        item.assignedTo && filter.assignedTo!.includes(item.assignedTo)
      );
    }

    if (filter.regulationId) {
      filtered = filtered.filter(item => item.regulationId === filter.regulationId);
    }

    if (filter.dueDateRange) {
      if (filter.dueDateRange.start) {
        filtered = filtered.filter(item => 
          item.dueDate && item.dueDate >= filter.dueDateRange!.start!
        );
      }
      if (filter.dueDateRange.end) {
        filtered = filtered.filter(item => 
          item.dueDate && item.dueDate <= filter.dueDateRange!.end!
        );
      }
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(item => 
        filter.tags!.some(tag => item.tags.includes(tag))
      );
    }

    setFilteredItems(filtered);
  };

  const handleStatusChange = async (id: string, status: ActionItem['status']) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setActionItems(prev => 
        prev.map(item => 
          item.id === id 
            ? { 
                ...item, 
                status, 
                updatedAt: new Date(),
                completedAt: status === 'completed' ? new Date() : item.completedAt
              }
            : item
        )
      );
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAssign = async (id: string, assignee: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setActionItems(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, assignedTo: assignee, updatedAt: new Date() }
            : item
        )
      );
    } catch (err) {
      console.error('Error assigning action item:', err);
    }
  };

  const handleEdit = (actionItem: ActionItem) => {
    // In a real app, this would open an edit modal
    console.log('Edit action item:', actionItem);
  };

  const handleDelete = async (id: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setActionItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting action item:', err);
    }
  };

  const availableUsers = Array.from(new Set(
    actionItems.map(item => item.assignedTo).filter(Boolean)
  )) as string[];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">⚠️ {error}</div>
        <button
          onClick={loadActionItems}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Action Items</h1>
          <p className="text-gray-600">
            Manage compliance actions and track progress
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 text-sm font-medium rounded-md border ${
              showFilters
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Filters {Object.keys(filter).length > 0 && `(${Object.keys(filter).length})`}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Actions</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.byStatus.pending + stats.byStatus.in_progress}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-red-600">{stats.byPriority.critical + stats.byPriority.high}</div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.dueSoon}</div>
            <div className="text-sm text-gray-600">Due Soon</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <FilterComponent
          filter={filter}
          onFilterChange={setFilter}
          availableUsers={availableUsers}
        />
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredItems.length} of {actionItems.length} action items
        </span>
        
        {filteredItems.length !== actionItems.length && (
          <button
            onClick={() => setFilter({})}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Action Items Grid/List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">📋</div>
          <div className="text-gray-600">
            {actionItems.length === 0 
              ? 'No action items found' 
              : 'No action items match your filters'
            }
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {filteredItems.map(actionItem => (
            <ActionItemCard
              key={actionItem.id}
              actionItem={actionItem}
              onStatusChange={handleStatusChange}
              onAssign={handleAssign}
              onEdit={handleEdit}
              onDelete={handleDelete}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionListView;