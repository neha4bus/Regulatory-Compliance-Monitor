/**
 * Unit tests for RegulationCard component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RegulationCard } from '../components/RegulationCard';
import { Regulation } from '../../types';

const mockRegulation: Regulation = {
  id: 'test-reg-1',
  title: 'Test Regulation Title',
  date: new Date('2025-01-01'),
  url: 'https://example.com/reg-1',
  fullText: 'This is a test regulation text.',
  source: 'EPA',
  scrapedAt: new Date(),
  hash: 'test-hash',
  summary: 'This is a test summary of the regulation.',
  riskScore: 7.5,
  priority: 'high',
  insights: {
    whatChanged: 'New emission standards',
    whoImpacted: ['Offshore operators', 'Drilling contractors'],
    requiredActions: ['Install equipment', 'Train personnel'],
  },
  complianceChecklist: ['Review procedures', 'Update documentation'],
  status: 'analyzed',
};

describe('RegulationCard', () => {
  it('renders regulation information correctly', () => {
    render(<RegulationCard regulation={mockRegulation} />);
    
    expect(screen.getByText('Test Regulation Title')).toBeInTheDocument();
    expect(screen.getByText('EPA')).toBeInTheDocument();
    expect(screen.getByText('analyzed')).toBeInTheDocument();
    expect(screen.getByText('This is a test summary of the regulation.')).toBeInTheDocument();
  });

  it('displays risk indicator', () => {
    render(<RegulationCard regulation={mockRegulation} />);
    
    // Risk score should be displayed
    expect(screen.getByText('7.5')).toBeInTheDocument();
  });

  it('shows insights when available', () => {
    render(<RegulationCard regulation={mockRegulation} />);
    
    expect(screen.getByText(/New emission standards/)).toBeInTheDocument();
    expect(screen.getByText(/Offshore operators, Drilling contractors/)).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const mockOnClick = jest.fn();
    render(<RegulationCard regulation={mockRegulation} onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByText('Test Regulation Title'));
    expect(mockOnClick).toHaveBeenCalledWith(mockRegulation);
  });

  it('calls onActionClick when action button is clicked', () => {
    const mockOnActionClick = jest.fn();
    render(
      <RegulationCard 
        regulation={mockRegulation} 
        onActionClick={mockOnActionClick}
        showActions={true}
      />
    );
    
    const viewButton = screen.getByText('📄 View Details');
    fireEvent.click(viewButton);
    
    expect(mockOnActionClick).toHaveBeenCalledWith(mockRegulation, 'view');
  });

  it('renders in compact mode', () => {
    render(<RegulationCard regulation={mockRegulation} compact={true} />);
    
    // Title should be truncated in compact mode
    expect(screen.getByText('Test Regulation Title')).toBeInTheDocument();
    
    // Summary should not be shown in compact mode
    expect(screen.queryByText('This is a test summary of the regulation.')).not.toBeInTheDocument();
  });

  it('hides actions when showActions is false', () => {
    render(<RegulationCard regulation={mockRegulation} showActions={false} />);
    
    expect(screen.queryByText('📄 View Details')).not.toBeInTheDocument();
    expect(screen.queryByText('🔍 Re-analyze')).not.toBeInTheDocument();
  });

  it('shows checklist button when checklist is available', () => {
    render(<RegulationCard regulation={mockRegulation} showActions={true} />);
    
    expect(screen.getByText('✅ Checklist (2)')).toBeInTheDocument();
  });

  it('handles regulation without optional fields', () => {
    const minimalRegulation: Regulation = {
      id: 'minimal-reg',
      title: 'Minimal Regulation',
      date: new Date('2025-01-01'),
      url: 'https://example.com/minimal',
      fullText: 'Minimal text',
      source: 'DOE',
      scrapedAt: new Date(),
      hash: 'minimal-hash',
      status: 'new',
    };

    render(<RegulationCard regulation={minimalRegulation} />);
    
    expect(screen.getByText('Minimal Regulation')).toBeInTheDocument();
    expect(screen.getByText('DOE')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });
});