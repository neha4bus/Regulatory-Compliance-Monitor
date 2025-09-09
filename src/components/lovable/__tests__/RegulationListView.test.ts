/**
 * Integration tests for RegulationListView component
 */

/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RegulationListView } from '../views/RegulationListView';
import { Regulation } from '../../../types';
import { DashboardFilters } from '../types/dashboard';

// Mock regulations data
const mockRegulations: Regulation[] = [
  {
    id: 'reg-001',
    title: 'New Emission Monitoring Requirements',
    date: new Date('2025-01-01'),
    url: 'https://example.com/reg-001',
    fullText: 'Detailed regulation text...',
    source: 'EPA',
    scrapedAt: new Date(),
    hash: 'hash-001',
    summary: 'New requirements for emission monitoring.',
    riskScore: 8.5,
    priority: 'high',
    status: 'analyzed',
  },
  {
    id: 'reg-002',
    title: 'Updated Safety Protocols',
    date: new Date('2024-12-15'),
    url: 'https://example.com/reg-002',
    fullText: 'Safety protocol details...',
    source: 'PHMSA',
    scrapedAt: new Date(),
    hash: 'hash-002',
    summary: 'Enhanced safety requirements.',
    riskScore: 6.2,
    priority: 'medium',
    status: 'reviewed',
  },
  {
    id: 'reg-003',
    title: 'Environmental Impact Assessment Guidelines',
    date: new Date('2024-11-20'),
    url: 'https://example.com/reg-003',
    fullText: 'Environmental guidelines...',
    source: 'DOE',
    scrapedAt: new Date(),
    hash: 'hash-003',
    summary: 'New environmental assessment requirements.',
    riskScore: 4.1,
    priority: 'low',
    status: 'new',
  },
];

describe('RegulationListView', () => {
  const defaultProps = {
    regulations: mockRegulations,
    loading: false,
    onRegulationClick: jest.fn(),
    onFiltersChange: jest.fn(),
    filters: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders regulation list correctly', () => {
      render(<RegulationListView {...defaultProps} />);
      
      expect(screen.getByText('New Emission Monitoring Requirements')).toBeInTheDocument();
      expect(screen.getByText('Updated Safety Protocols')).toBeInTheDocument();
      expect(screen.getByText('Environmental Impact Assessment Guidelines')).toBeInTheDocument();
    });

    it('displays loading state', () => {
      render(<RegulationListView {...defaultProps} loading={true} />);
      
      expect(screen.getByText('Loading regulations...')).toBeInTheDocument();
    });

    it('displays empty state when no regulations', () => {
      render(<RegulationListView {...defaultProps} regulations={[]} />);
      
      expect(screen.getByText('No regulations found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or search terms')).toBeInTheDocument();
    });
  });

  describe('Filtering Functionality', () => {
    it('displays filter controls when onFiltersChange is provided', () => {
      render(<RegulationListView {...defaultProps} />);
      
      expect(screen.getByText('🔽 Filters')).toBeInTheDocument();
    });

    it('expands and collapses filter panel', async () => {
      render(<RegulationListView {...defaultProps} />);
      
      const filterToggle = screen.getByText('🔽 Filters');
      fireEvent.click(filterToggle);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search regulations...')).toBeInTheDocument();
        expect(screen.getByText('Priority')).toBeInTheDocument();
        expect(screen.getByText('Source')).toBeInTheDocument();
      });
    });

    it('calls onFiltersChange when search input changes', async () => {
      render(<RegulationListView {...defaultProps} />);
      
      // Expand filters
      fireEvent.click(screen.getByText('🔽 Filters'));
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search regulations...');
        fireEvent.change(searchInput, { target: { value: 'emission' } });
        
        expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
          searchQuery: 'emission',
        });
      });
    });

    it('calls onFiltersChange when priority filter changes', async () => {
      render(<RegulationListView {...defaultProps} />);
      
      // Expand filters
      fireEvent.click(screen.getByText('🔽 Filters'));
      
      await waitFor(() => {
        const highPriorityCheckbox = screen.getByRole('checkbox', { name: /high/i });
        fireEvent.click(highPriorityCheckbox);
        
        expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
          priority: ['high'],
        });
      });
    });

    it('shows active filter count', () => {
      const filtersWithActive: DashboardFilters = {
        priority: ['high'],
        source: ['EPA'],
      };
      
      render(<RegulationListView {...defaultProps} filters={filtersWithActive} />);
      
      expect(screen.getByText('2 filters active')).toBeInTheDocument();
    });

    it('clears all filters when clear button is clicked', async () => {
      const filtersWithActive: DashboardFilters = {
        priority: ['high'],
        source: ['EPA'],
      };
      
      render(<RegulationListView {...defaultProps} filters={filtersWithActive} />);
      
      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('Sorting Functionality', () => {
    it('displays sort controls', () => {
      render(<RegulationListView {...defaultProps} />);
      
      expect(screen.getByText('Sort by:')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Date (Newest)')).toBeInTheDocument();
    });

    it('changes sort option', () => {
      render(<RegulationListView {...defaultProps} />);
      
      const sortSelect = screen.getByDisplayValue('Date (Newest)');
      fireEvent.change(sortSelect, { target: { value: 'riskScore-desc' } });
      
      expect(sortSelect).toHaveValue('riskScore-desc');
    });
  });

  describe('View Mode Toggle', () => {
    it('displays view mode toggle buttons', () => {
      render(<RegulationListView {...defaultProps} />);
      
      expect(screen.getByText('📋 Cards')).toBeInTheDocument();
      expect(screen.getByText('📊 Table')).toBeInTheDocument();
    });

    it('switches between card and table view', () => {
      render(<RegulationListView {...defaultProps} />);
      
      const tableViewButton = screen.getByText('📊 Table');
      fireEvent.click(tableViewButton);
      
      expect(tableViewButton).toHaveClass('active');
    });
  });

  describe('Pagination', () => {
    const paginationProps = {
      ...defaultProps,
      pagination: {
        page: 1,
        pageSize: 2,
        total: 3,
        onPageChange: jest.fn(),
      },
    };

    it('displays pagination when provided', () => {
      render(<RegulationListView {...paginationProps} />);
      
      expect(screen.getByText('Showing 1-2 of 3 regulations')).toBeInTheDocument();
    });

    it('calls onPageChange when page button is clicked', () => {
      render(<RegulationListView {...paginationProps} />);
      
      const nextButton = screen.getByText('Next →');
      fireEvent.click(nextButton);
      
      expect(paginationProps.pagination.onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Regulation Interaction', () => {
    it('calls onRegulationClick when regulation card is clicked', () => {
      render(<RegulationListView {...defaultProps} />);
      
      const regulationCard = screen.getByText('New Emission Monitoring Requirements');
      fireEvent.click(regulationCard);
      
      expect(defaultProps.onRegulationClick).toHaveBeenCalledWith(mockRegulations[0]);
    });
  });

  describe('Responsive Design', () => {
    it('renders correctly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<RegulationListView {...defaultProps} />);
      
      // Should still render all main elements
      expect(screen.getByText('New Emission Monitoring Requirements')).toBeInTheDocument();
      expect(screen.getByText('Sort by:')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles empty regulations array gracefully', () => {
      render(<RegulationListView {...defaultProps} regulations={[]} />);
      
      expect(screen.getByText('No regulations found')).toBeInTheDocument();
    });

    it('handles missing regulation properties gracefully', () => {
      const incompleteRegulation: Regulation = {
        id: 'reg-incomplete',
        title: 'Incomplete Regulation',
        date: new Date(),
        url: 'https://example.com',
        fullText: 'Text',
        source: 'Unknown',
        scrapedAt: new Date(),
        hash: 'hash',
        status: 'new',
        // Missing optional properties
      };

      render(<RegulationListView {...defaultProps} regulations={[incompleteRegulation]} />);
      
      expect(screen.getByText('Incomplete Regulation')).toBeInTheDocument();
    });
  });
});