/**
 * Regulation List View - Complete regulation feed with filtering, sorting, and pagination
 */

import React, { useState, useEffect, useMemo } from 'react';
import { RegulationCard } from '../components/RegulationCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RiskIndicator } from '../components/RiskIndicator';
import { RegulationListProps, DashboardFilters } from '../types/dashboard';
import { Regulation } from '../../../types';
import { formatDate } from '../utils/formatting';

interface RegulationFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  regulationSources: string[];
  totalCount: number;
}

const RegulationFilters: React.FC<RegulationFiltersProps> = ({
  filters,
  onFiltersChange,
  regulationSources,
  totalCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof DashboardFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof DashboardFilters];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  return (
    <div className="regulation-filters">
      <div className="filters-header">
        <div className="filters-info">
          <h3>Regulations ({totalCount})</h3>
          {activeFilterCount > 0 && (
            <span className="active-filters">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </span>
          )}
        </div>
        <div className="filters-actions">
          {activeFilterCount > 0 && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear All
            </button>
          )}
          <button 
            className="toggle-filters"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '🔼' : '🔽'} Filters
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="filters-content">
          {/* Search */}
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search regulations..."
              value={filters.searchQuery || ''}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="search-input"
            />
          </div>

          {/* Priority Filter */}
          <div className="filter-group">
            <label>Priority</label>
            <div className="checkbox-group">
              {['critical', 'high', 'medium', 'low'].map(priority => (
                <label key={priority} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.priority?.includes(priority as any) || false}
                    onChange={(e) => {
                      const current = filters.priority || [];
                      const updated = e.target.checked
                        ? [...current, priority as any]
                        : current.filter(p => p !== priority);
                      handleFilterChange('priority', updated);
                    }}
                  />
                  <span className={`priority-badge ${priority}`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Source Filter */}
          <div className="filter-group">
            <label>Source</label>
            <div className="checkbox-group">
              {regulationSources.map(source => (
                <label key={source} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.source?.includes(source) || false}
                    onChange={(e) => {
                      const current = filters.source || [];
                      const updated = e.target.checked
                        ? [...current, source]
                        : current.filter(s => s !== source);
                      handleFilterChange('source', updated);
                    }}
                  />
                  <span className="source-badge">{source}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label>Status</label>
            <div className="checkbox-group">
              {['new', 'analyzed', 'reviewed', 'archived'].map(status => (
                <label key={status} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status) || false}
                    onChange={(e) => {
                      const current = filters.status || [];
                      const updated = e.target.checked
                        ? [...current, status]
                        : current.filter(s => s !== status);
                      handleFilterChange('status', updated);
                    }}
                  />
                  <span className={`status-badge ${status}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .regulation-filters {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: ${isExpanded ? '1px solid #e2e8f0' : 'none'};
        }

        .filters-info h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a202c;
        }

        .active-filters {
          font-size: 0.875rem;
          color: #3182ce;
          margin-left: 0.5rem;
        }

        .filters-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .clear-filters {
          background: none;
          border: none;
          color: #e53e3e;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
        }

        .clear-filters:hover {
          text-decoration: underline;
        }

        .toggle-filters {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: #4a5568;
        }

        .toggle-filters:hover {
          background: #edf2f7;
        }

        .filters-content {
          padding: 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .filter-group label {
          font-weight: 500;
          color: #2d3748;
          font-size: 0.875rem;
        }

        .search-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: normal;
        }

        .checkbox-label input[type="checkbox"] {
          margin: 0;
        }

        .priority-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .priority-badge.critical {
          background: #fed7d7;
          color: #c53030;
        }

        .priority-badge.high {
          background: #feebc8;
          color: #dd6b20;
        }

        .priority-badge.medium {
          background: #fef5e7;
          color: #d69e2e;
        }

        .priority-badge.low {
          background: #f0fff4;
          color: #38a169;
        }

        .source-badge,
        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          background: #edf2f7;
          color: #4a5568;
        }

        .status-badge.new {
          background: #bee3f8;
          color: #2b6cb0;
        }

        .status-badge.analyzed {
          background: #c6f6d5;
          color: #2f855a;
        }

        .status-badge.reviewed {
          background: #e9d8fd;
          color: #6b46c1;
        }

        .status-badge.archived {
          background: #e2e8f0;
          color: #718096;
        }

        @media (max-width: 768px) {
          .filters-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .filters-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

interface SortOption {
  key: string;
  label: string;
  direction: 'asc' | 'desc';
}

const SORT_OPTIONS: SortOption[] = [
  { key: 'date', label: 'Date (Newest)', direction: 'desc' },
  { key: 'date', label: 'Date (Oldest)', direction: 'asc' },
  { key: 'riskScore', label: 'Risk Score (High to Low)', direction: 'desc' },
  { key: 'riskScore', label: 'Risk Score (Low to High)', direction: 'asc' },
  { key: 'title', label: 'Title (A-Z)', direction: 'asc' },
  { key: 'title', label: 'Title (Z-A)', direction: 'desc' },
  { key: 'source', label: 'Source (A-Z)', direction: 'asc' },
];

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing {startItem}-{endItem} of {totalItems} regulations
      </div>
      
      <div className="pagination-controls">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="page-size-select"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>

        <div className="page-buttons">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-btn"
          >
            ← Previous
          </button>

          {getVisiblePages().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`page-btn ${page === currentPage ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Next →
          </button>
        </div>
      </div>

      <style>{`
        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          margin-top: 1.5rem;
        }

        .pagination-info {
          color: #718096;
          font-size: 0.875rem;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .page-size-select {
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: white;
        }

        .page-buttons {
          display: flex;
          gap: 0.25rem;
        }

        .page-btn {
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
          font-size: 0.875rem;
          border-radius: 0.375rem;
        }

        .page-btn:hover:not(:disabled) {
          background: #f7fafc;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-btn.active {
          background: #3182ce;
          color: white;
          border-color: #3182ce;
        }

        .page-btn.dots {
          border: none;
          background: none;
          cursor: default;
        }

        @media (max-width: 768px) {
          .pagination {
            flex-direction: column;
            gap: 1rem;
          }

          .pagination-controls {
            flex-direction: column;
            width: 100%;
          }

          .page-buttons {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export const RegulationListView: React.FC<RegulationListProps> = ({
  regulations,
  loading = false,
  onRegulationClick,
  filters = {},
  onFiltersChange,
  pagination,
}) => {
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0]);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Get unique sources for filter options
  const regulationSources = useMemo(() => {
    const sources = new Set(regulations.map(r => r.source));
    return Array.from(sources).sort();
  }, [regulations]);

  // Apply filters and sorting
  const filteredAndSortedRegulations = useMemo(() => {
    let filtered = [...regulations];

    // Apply filters
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(reg =>
        reg.title?.toLowerCase().includes(query) ||
        reg.summary?.toLowerCase().includes(query) ||
        reg.source.toLowerCase().includes(query)
      );
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(reg => 
        filters.priority!.includes(reg.priority || 'low')
      );
    }

    if (filters.source && filters.source.length > 0) {
      filtered = filtered.filter(reg => 
        filters.source!.includes(reg.source)
      );
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(reg => 
        filters.status!.includes(reg.status)
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter(reg => {
        const regDate = new Date(reg.date);
        return regDate >= filters.dateRange!.start && regDate <= filters.dateRange!.end;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortOption.key) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'riskScore':
          aValue = a.riskScore || 0;
          bValue = b.riskScore || 0;
          break;
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'source':
          aValue = a.source.toLowerCase();
          bValue = b.source.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOption.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [regulations, filters, sortOption]);

  // Pagination logic
  const currentPage = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 25;
  const totalItems = filteredAndSortedRegulations.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRegulations = filteredAndSortedRegulations.slice(startIndex, startIndex + pageSize);

  const handleRegulationClick = (regulation: Regulation) => {
    if (onRegulationClick) {
      onRegulationClick(regulation);
    }
  };

  if (loading) {
    return (
      <div className="regulation-list-loading">
        <LoadingSpinner size="large" message="Loading regulations..." />
      </div>
    );
  }

  return (
    <div className="regulation-list-view">
      {/* Filters */}
      {onFiltersChange && (
        <RegulationFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          regulationSources={regulationSources}
          totalCount={totalItems}
        />
      )}

      {/* Toolbar */}
      <div className="regulation-toolbar">
        <div className="toolbar-left">
          <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={`${sortOption.key}-${sortOption.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                setSortOption({ key, label: '', direction: direction as 'asc' | 'desc' });
              }}
              className="sort-select"
            >
              {SORT_OPTIONS.map(option => (
                <option key={`${option.key}-${option.direction}`} value={`${option.key}-${option.direction}`}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="toolbar-right">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
            >
              📋 Cards
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              📊 Table
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="regulation-results">
        {paginatedRegulations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No regulations found</h3>
            <p>Try adjusting your filters or search terms</p>
            {Object.keys(filters).length > 0 && onFiltersChange && (
              <button 
                className="clear-filters-btn"
                onClick={() => onFiltersChange({})}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className={`regulations-container ${viewMode}`}>
            {paginatedRegulations.map(regulation => (
              <RegulationCard
                key={regulation.id}
                regulation={regulation}
                onClick={handleRegulationClick}
                compact={viewMode === 'table'}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={(newPageSize) => {
            // Reset to page 1 when changing page size
            pagination.onPageChange(1);
            // Note: pageSize change would need to be handled by parent component
          }}
        />
      )}

      <style>{`
        .regulation-list-view {
          max-width: 1200px;
          margin: 0 auto;
        }

        .regulation-list-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
        }

        .regulation-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .sort-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sort-controls label {
          font-size: 0.875rem;
          color: #4a5568;
          font-weight: 500;
        }

        .sort-select {
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: white;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .view-toggle {
          display: flex;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          overflow: hidden;
        }

        .view-btn {
          padding: 0.5rem 1rem;
          border: none;
          background: white;
          cursor: pointer;
          font-size: 0.875rem;
          border-right: 1px solid #e2e8f0;
        }

        .view-btn:last-child {
          border-right: none;
        }

        .view-btn:hover {
          background: #f7fafc;
        }

        .view-btn.active {
          background: #3182ce;
          color: white;
        }

        .regulation-results {
          margin-bottom: 2rem;
        }

        .regulations-container.card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .regulations-container.table {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          color: #1a202c;
          margin: 0 0 0.5rem 0;
        }

        .empty-state p {
          color: #718096;
          margin: 0 0 1.5rem 0;
        }

        .clear-filters-btn {
          background: #3182ce;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-weight: 500;
        }

        .clear-filters-btn:hover {
          background: #2c5282;
        }

        @media (max-width: 768px) {
          .regulation-toolbar {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .toolbar-left,
          .toolbar-right {
            justify-content: center;
          }

          .sort-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }

          .view-toggle {
            width: 100%;
          }

          .view-btn {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default RegulationListView;