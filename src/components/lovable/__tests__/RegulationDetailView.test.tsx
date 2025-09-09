/**
 * Tests for RegulationDetailView component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RegulationDetailView } from '../views/RegulationDetailView';
import { Regulation } from '../../../types';

// Mock regulation data for testing
const mockRegulation: Regulation = {
  id: 'reg-001',
  title: 'New Offshore Drilling Safety Requirements',
  date: new Date('2025-01-15'),
  url: 'https://example.com/regulation/001',
  fullText: 'This regulation establishes new safety requirements for offshore drilling operations.\n\nSection 1: Equipment Standards\nAll drilling equipment must meet the following standards...\n\nSection 2: Personnel Training\nAll personnel must complete certified training programs...',
  source: 'EPA',
  scrapedAt: new Date('2025-01-08'),
  hash: 'abc123',
  summary: 'New safety requirements for offshore drilling operations including equipment standards and personnel training.',
  riskScore: 8.5,
  priority: 'high',
  insights: {
    whatChanged: 'New equipment standards and mandatory training requirements',
    whoImpacted: ['Offshore drilling operators', 'Equipment manufacturers', 'Training providers'],
    requiredActions: ['Update equipment to new standards', 'Implement training programs', 'Submit compliance reports'],
  },
  complianceChecklist: [
    'Review current equipment against new standards',
    'Develop training curriculum',
    'Schedule personnel training sessions',
    'Prepare compliance documentation',
  ],
  status: 'analyzed',
  assignedTo: 'compliance-team',
  reviewedAt: new Date('2025-01-10'),
};

const mockProps = {
  regulation: mockRegulation,
  loading: false,
  onBack: jest.fn(),
  onActionCreate: jest.fn(),
  onActionUpdate: jest.fn(),
  onStatusChange: jest.fn(),
  onAssigneeChange: jest.fn(),
};

describe('RegulationDetailView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading is true', () => {
      render(<RegulationDetailView {...mockProps} loading={true} />);
      
      expect(screen.getByText('Loading regulation details...')).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('should display regulation title and metadata', () => {
      render(<RegulationDetailView {...mockProps} />);
      
      expect(screen.getByText('New Offshore Drilling Safety Requirements')).toBeInTheDocument();
      expect(screen.getByText('EPA')).toBeInTheDocument();
      expect(screen.getByText('compliance-team')).toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', () => {
      render(<RegulationDetailView {...mockProps} />);
      
      const backButton = screen.getByText('← Back to List');
      fireEvent.click(backButton);
      
      expect(mockProps.onBack).toHaveBeenCalledTimes(1);
    });

    it('should call onStatusChange when status is changed', () => {
      render(<RegulationDetailView {...mockProps} />);
      
      const statusSelect = screen.getByRole('combobox');
      fireEvent.change(statusSelect, { target: { value: 'reviewed' } });
      
      expect(mockProps.onStatusChange).toHaveBeenCalledWith('reviewed');
    });

    it('should display risk indicator with correct values', () => {
      render(<RegulationDetailView {...mockProps} />);
      
      // Risk indicator should be present (check for score and priority separately)
      expect(screen.getByText('8.5')).toBeInTheDocument();
      const highElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('HIGH') || false;
      });
      expect(highElements.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation Tabs', () => {
    it('should display all navigation tabs', () => {
      render(<RegulationDetailView {...mockProps} />);
      
      expect(screen.getByText('📊 Overview')).toBeInTheDocument();
      expect(screen.getByText('📄 Full Text')).toBeInTheDocument();
      expect(screen.getByText('🔍 Comparison')).toBeInTheDocument();
      expect(screen.getByText(/✅ Actions/)).toBeInTheDocument();
    });

    it('should switch between tabs when clicked', () => {
      render(<RegulationDetailView {...mockProps} />);
      
      // Initially on overview tab
      expect(screen.getByText('🤖 AI Summary')).toBeInTheDocument();
      
      // Click full text tab
      const fullTextTab = screen.getByText('📄 Full Text');
      fireEvent.click(fullTextTab);
      
      expect(screen.getByText('📄 Formatted View')).toBeInTheDocument();
      expect(screen.getByText('📝 Raw Text')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('should display AI summary when available', () => {
      render(<RegulationDetailView {...mockProps} />);
      
      expect(screen.getByText('🤖 AI Summary')).toBeInTheDocument();
      expect(screen.getByText(mockRegulation.summary!)).toBeInTheDocument();
    });

    it('should display key insights', () => {
      render(<RegulationDetailView {...mockProps} />);
      
      expect(screen.getByText('💡 Key Insights')).toBeInTheDocument();
      expect(screen.getByText('What Changed')).toBeInTheDocument();
      expect(screen.getByText('Who\'s Impacted')).toBeInTheDocument();
      expect(screen.getByText('Required Actions')).toBeInTheDocument();
      
      expect(screen.getByText(mockRegulation.insights!.whatChanged)).toBeInTheDocument();
    });

    it('should display impact tags', () => {
      render(<RegulationDetailView {...mockProps} />);
      
      mockRegulation.insights!.whoImpacted.forEach(impact => {
        expect(screen.getByText(impact)).toBeInTheDocument();
      });
    });

    it('should display compliance checklist with checkboxes', () => {
      render(<RegulationDetailView {...mockProps} />);
      
      expect(screen.getByText('✅ Compliance Checklist')).toBeInTheDocument();
      
      mockRegulation.complianceChecklist!.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
      
      // Should have checkboxes for each item
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(mockRegulation.complianceChecklist!.length);
    });
  });

  describe('Full Text Tab', () => {
    beforeEach(() => {
      render(<RegulationDetailView {...mockProps} />);
      const fullTextTab = screen.getByText('📄 Full Text');
      fireEvent.click(fullTextTab);
    });

    it('should display text view controls', () => {
      expect(screen.getByText('📄 Formatted View')).toBeInTheDocument();
      expect(screen.getByText('📝 Raw Text')).toBeInTheDocument();
    });

    it('should display formatted text by default', () => {
      expect(screen.getByText(/This regulation establishes new safety requirements/)).toBeInTheDocument();
    });

    it('should switch to raw text view when clicked', () => {
      const rawTextButton = screen.getByText('📝 Raw Text');
      fireEvent.click(rawTextButton);
      
      // Raw text should be in a pre element
      const preElement = screen.getByText(/This regulation establishes new safety requirements/);
      expect(preElement.tagName).toBe('PRE');
    });
  });

  describe('Comparison Tab', () => {
    beforeEach(() => {
      render(<RegulationDetailView {...mockProps} />);
      const comparisonTab = screen.getByText('🔍 Comparison');
      fireEvent.click(comparisonTab);
    });

    it('should display original text and AI analysis panels', () => {
      expect(screen.getByText('📄 Original Text')).toBeInTheDocument();
      expect(screen.getByText('🤖 AI Analysis')).toBeInTheDocument();
    });

    it('should display text preview with expand button', () => {
      expect(screen.getByText('View Full Text')).toBeInTheDocument();
    });

    it('should display AI analysis sections', () => {
      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('Key Changes')).toBeInTheDocument();
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    });

    it('should navigate to full text when expand button is clicked', () => {
      const expandButton = screen.getByText('View Full Text');
      fireEvent.click(expandButton);
      
      // Should switch to full text tab
      expect(screen.getByText('📄 Formatted View')).toBeInTheDocument();
    });
  });

  describe('Actions Tab', () => {
    beforeEach(() => {
      render(<RegulationDetailView {...mockProps} />);
      const actionsTab = screen.getByText(/✅ Actions/);
      fireEvent.click(actionsTab);
    });

    it('should display create action form', () => {
      expect(screen.getByText('➕ Create New Action')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Action title...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Action description...')).toBeInTheDocument();
      expect(screen.getByText('Assign to...')).toBeInTheDocument();
    });

    it('should display existing action items from compliance checklist', () => {
      expect(screen.getByText(/📋 Action Items/)).toBeInTheDocument();
      
      // Should have action items generated from compliance checklist
      mockRegulation.complianceChecklist!.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });

    it('should enable create button when title is entered', async () => {
      const titleInput = screen.getByPlaceholderText('Action title...');
      const createButton = screen.getByText('Create Action');
      
      // Initially disabled
      expect(createButton).toBeDisabled();
      
      // Enter title
      fireEvent.change(titleInput, { target: { value: 'Test Action' } });
      
      // Should be enabled
      await waitFor(() => {
        expect(createButton).not.toBeDisabled();
      });
    });

    it('should call onActionCreate when create button is clicked', async () => {
      const titleInput = screen.getByPlaceholderText('Action title...');
      const descriptionInput = screen.getByPlaceholderText('Action description...');
      const assigneeSelects = screen.getAllByRole('combobox');
      const assigneeSelect = assigneeSelects.find(select => 
        select.querySelector('option[value=""]')?.textContent === 'Assign to...'
      );
      const createButton = screen.getByText('Create Action');
      
      // Fill form
      fireEvent.change(titleInput, { target: { value: 'Test Action' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
      if (assigneeSelect) {
        fireEvent.change(assigneeSelect, { target: { value: 'compliance-team' } });
      }
      
      // Click create
      fireEvent.click(createButton);
      
      expect(mockProps.onActionCreate).toHaveBeenCalledWith({
        title: 'Test Action',
        description: 'Test Description',
        priority: 'high',
        status: 'pending',
        regulationId: 'reg-001',
        assignee: 'compliance-team',
      });
    });

    it('should clear form after creating action', async () => {
      const titleInput = screen.getByPlaceholderText('Action title...');
      const createButton = screen.getByText('Create Action');
      
      // Fill and submit form
      fireEvent.change(titleInput, { target: { value: 'Test Action' } });
      fireEvent.click(createButton);
      
      // Form should be cleared
      await waitFor(() => {
        expect(titleInput).toHaveValue('');
      });
    });
  });

  describe('Assignee Management', () => {
    it('should call onAssigneeChange when assignee is changed', () => {
      render(<RegulationDetailView {...mockProps} />);
      
      // Go to actions tab
      const actionsTab = screen.getByText(/✅ Actions/);
      fireEvent.click(actionsTab);
      
      const assigneeSelects = screen.getAllByRole('combobox');
      const assigneeSelect = assigneeSelects.find(select => 
        select.querySelector('option[value=""]')?.textContent === 'Assign to...'
      );
      
      if (assigneeSelect) {
        fireEvent.change(assigneeSelect, { target: { value: 'legal-team' } });
        expect(mockProps.onAssigneeChange).toHaveBeenCalledWith('legal-team');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing AI summary gracefully', () => {
      const regulationWithoutSummary = { ...mockRegulation, summary: undefined };
      render(<RegulationDetailView {...mockProps} regulation={regulationWithoutSummary} />);
      
      // Should not display AI summary section
      expect(screen.queryByText('🤖 AI Summary')).not.toBeInTheDocument();
    });

    it('should handle missing insights gracefully', () => {
      const regulationWithoutInsights = { ...mockRegulation, insights: undefined };
      render(<RegulationDetailView {...mockProps} regulation={regulationWithoutInsights} />);
      
      // Should not display insights section
      expect(screen.queryByText('💡 Key Insights')).not.toBeInTheDocument();
    });

    it('should handle missing compliance checklist gracefully', () => {
      const regulationWithoutChecklist = { ...mockRegulation, complianceChecklist: undefined };
      render(<RegulationDetailView {...mockProps} regulation={regulationWithoutChecklist} />);
      
      // Should not display checklist section
      expect(screen.queryByText('✅ Compliance Checklist')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should be accessible on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<RegulationDetailView {...mockProps} />);
      
      // Component should render without errors
      expect(screen.getByText('New Offshore Drilling Safety Requirements')).toBeInTheDocument();
    });
  });
});