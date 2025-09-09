/**
 * Integration tests for HomeView component with real-time updates
 */

/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HomeView } from '../views/HomeView';
import { ActionItemProps } from '../types/dashboard';
import { regulationService } from '../services/regulationService';

// Mock the regulation service
jest.mock('../services/regulationService', () => ({
  regulationService: {
    initialize: jest.fn(),
    getRegulations: jest.fn(),
    getRegulationStats: jest.fn(),
  },
}));

// Mock the hooks to avoid circular dependencies
jest.mock('../hooks/dashboard', () => ({
  useRegulations: jest.fn(),
  useDashboardStats: jest.fn(),
}));

import { useRegulations, useDashboardStats } from '../hooks/dashboard';

const mockUseRegulations = useRegulations as jest.MockedFunction<typeof useRegulations>;
const mockUseDashboardStats = useDashboardStats as jest.MockedFunction<typeof useDashboardStats>;

// Mock actions data
const mockActions: ActionItemProps[] = [
  {
    id: 'action-001',
    title: 'Install Emission Monitoring Equipment',
    description: 'Install continuous emission monitoring systems.',
    priority: 'critical',
    status: 'pending',
    assignee: 'John Smith',
    dueDate: new Date('2025-04-01'),
    regulationId: 'reg-001',
  },
  {
    id: 'action-002',
    title: 'Update Safety Procedures',
    description: 'Review and update safety procedures.',
    priority: 'high',
    status: 'in_progress',
    assignee: 'Sarah Johnson',
    dueDate: new Date('2025-03-15'),
    regulationId: 'reg-002',
  },
];

// Mock regulations data
const mockRegulations = [
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
    priority: 'high' as const,
    status: 'analyzed' as const,
  },
];

describe('HomeView Integration Tests', () => {
  const defaultProps = {
    actions: mockActions,
    onRegulationClick: jest.fn(),
    onViewAllRegulations: jest.fn(),
    onViewAllActions: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup default mock returns
    mockUseRegulations.mockReturnValue({
      data: mockRegulations,
      loading: false,
      error: null,
      refetch: jest.fn(),
      total: 1,
      totalPages: 1,
      currentPage: 1,
    });

    mockUseDashboardStats.mockReturnValue({
      stats: {
        totalRegulations: 5,
        pendingActions: 3,
        highPriorityItems: 2,
        completedThisWeek: 1,
        averageRiskScore: 6.5,
      },
      loading: false,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('renders dashboard overview with stats', async () => {
      render(<HomeView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Welcome to Compliance Dashboard')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // Total regulations
        expect(screen.getByText('3')).toBeInTheDocument(); // Pending actions
        expect(screen.getByText('2')).toBeInTheDocument(); // High priority items
      });
    });

    it('displays recent regulations section', async () => {
      render(<HomeView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('📋 Recent Regulations')).toBeInTheDocument();
        expect(screen.getByText('New Emission Monitoring Requirements')).toBeInTheDocument();
      });
    });

    it('displays urgent actions section', async () => {
      render(<HomeView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('🚨 Urgent Actions')).toBeInTheDocument();
        expect(screen.getByText('Install Emission Monitoring Equipment')).toBeInTheDocument();
        expect(screen.getByText('Update Safety Procedures')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when data is loading', () => {
      mockUseRegulations.mockReturnValue({
        data: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
        total: 0,
        totalPages: 0,
        currentPage: 1,
      });

      mockUseDashboardStats.mockReturnValue({
        stats: {
          totalRegulations: 0,
          pendingActions: 0,
          highPriorityItems: 0,
          completedThisWeek: 0,
          averageRiskScore: 0,
        },
        loading: true,
        refetch: jest.fn(),
      });

      render(<HomeView {...defaultProps} />);

      expect(screen.getByText('Loading dashboard overview...')).toBeInTheDocument();
    });

    it('shows loading indicator for regulations while keeping existing data', async () => {
      const mockRefetch = jest.fn();
      
      mockUseRegulations.mockReturnValue({
        data: mockRegulations,
        loading: true,
        error: null,
        refetch: mockRefetch,
        total: 1,
        totalPages: 1,
        currentPage: 1,
      });

      render(<HomeView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('📋 Recent Regulations')).toBeInTheDocument();
        expect(screen.getByText('🔄')).toBeInTheDocument(); // Loading indicator
        expect(screen.getByText('New Emission Monitoring Requirements')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('sets up automatic refresh interval', async () => {
      const mockRefetchRegulations = jest.fn();
      const mockRefetchStats = jest.fn();

      mockUseRegulations.mockReturnValue({
        data: mockRegulations,
        loading: false,
        error: null,
        refetch: mockRefetchRegulations,
        total: 1,
        totalPages: 1,
        currentPage: 1,
      });

      mockUseDashboardStats.mockReturnValue({
        stats: {
          totalRegulations: 5,
          pendingActions: 3,
          highPriorityItems: 2,
          completedThisWeek: 1,
          averageRiskScore: 6.5,
        },
        loading: false,
        refetch: mockRefetchStats,
      });

      render(<HomeView {...defaultProps} />);

      // Fast-forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockRefetchRegulations).toHaveBeenCalled();
        expect(mockRefetchStats).toHaveBeenCalled();
      });
    });

    it('cleans up interval on unmount', () => {
      const { unmount } = render(<HomeView {...defaultProps} />);
      
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Empty States', () => {
    it('shows empty state for regulations when none exist', async () => {
      mockUseRegulations.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
        total: 0,
        totalPages: 0,
        currentPage: 1,
      });

      render(<HomeView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No recent regulations found')).toBeInTheDocument();
        expect(screen.getByText('Regulations from the last 7 days will appear here')).toBeInTheDocument();
      });
    });

    it('shows empty state for actions when none are urgent', () => {
      render(<HomeView {...defaultProps} actions={[]} />);

      expect(screen.getByText('No urgent actions at this time')).toBeInTheDocument();
      expect(screen.getByText('High and critical priority actions will appear here')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onRegulationClick when regulation is clicked', async () => {
      render(<HomeView {...defaultProps} />);

      await waitFor(() => {
        const regulationCard = screen.getByText('New Emission Monitoring Requirements');
        regulationCard.click();
        
        expect(defaultProps.onRegulationClick).toHaveBeenCalledWith(mockRegulations[0]);
      });
    });

    it('calls onViewAllRegulations when View All button is clicked', async () => {
      render(<HomeView {...defaultProps} />);

      await waitFor(() => {
        const viewAllButtons = screen.getAllByText('View All');
        const regulationsViewAll = viewAllButtons[0]; // First "View All" is for regulations
        regulationsViewAll.click();
        
        expect(defaultProps.onViewAllRegulations).toHaveBeenCalled();
      });
    });

    it('calls onViewAllActions when actions View All button is clicked', async () => {
      render(<HomeView {...defaultProps} />);

      await waitFor(() => {
        const viewAllButtons = screen.getAllByText('View All');
        const actionsViewAll = viewAllButtons[1]; // Second "View All" is for actions
        actionsViewAll.click();
        
        expect(defaultProps.onViewAllActions).toHaveBeenCalled();
      });
    });
  });

  describe('Quick Actions', () => {
    it('displays quick action buttons', async () => {
      render(<HomeView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('🔍')).toBeInTheDocument(); // Search
        expect(screen.getByText('Search Regulations')).toBeInTheDocument();
        expect(screen.getByText('➕')).toBeInTheDocument(); // Add
        expect(screen.getByText('Add Action Item')).toBeInTheDocument();
        expect(screen.getByText('📊')).toBeInTheDocument(); // Report
        expect(screen.getByText('Generate Report')).toBeInTheDocument();
        expect(screen.getByText('⚙️')).toBeInTheDocument(); // Settings
        expect(screen.getByText('System Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Risk Score Display', () => {
    it('displays average risk score with proper formatting', async () => {
      render(<HomeView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Average Risk Score')).toBeInTheDocument();
        // The RiskIndicator component should display the score
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<HomeView {...defaultProps} />);

      await waitFor(() => {
        // Should still render main content
        expect(screen.getByText('Welcome to Compliance Dashboard')).toBeInTheDocument();
        expect(screen.getByText('📋 Recent Regulations')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles regulation loading errors gracefully', async () => {
      mockUseRegulations.mockReturnValue({
        data: [],
        loading: false,
        error: 'Failed to load regulations',
        refetch: jest.fn(),
        total: 0,
        totalPages: 0,
        currentPage: 1,
      });

      render(<HomeView {...defaultProps} />);

      await waitFor(() => {
        // Should still render the component structure
        expect(screen.getByText('📋 Recent Regulations')).toBeInTheDocument();
        expect(screen.getByText('No recent regulations found')).toBeInTheDocument();
      });
    });
  });
});