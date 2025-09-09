/**
 * Unit tests for RiskIndicator component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RiskIndicator } from '../components/RiskIndicator';

describe('RiskIndicator', () => {
  it('renders risk score correctly', () => {
    render(<RiskIndicator score={7.5} priority="high" />);
    
    expect(screen.getByText('7.5')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('displays correct priority icon', () => {
    const { rerender } = render(<RiskIndicator score={3.0} priority="low" />);
    expect(screen.getByText('🟢')).toBeInTheDocument();

    rerender(<RiskIndicator score={5.0} priority="medium" />);
    expect(screen.getByText('🟡')).toBeInTheDocument();

    rerender(<RiskIndicator score={8.0} priority="high" />);
    expect(screen.getByText('🟠')).toBeInTheDocument();

    rerender(<RiskIndicator score={9.5} priority="critical" />);
    expect(screen.getByText('🔴')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<RiskIndicator score={7.5} priority="high" showLabel={false} />);
    
    expect(screen.getByText('7.5')).toBeInTheDocument();
    expect(screen.queryByText('HIGH')).not.toBeInTheDocument();
    expect(screen.queryByText('Risk Score')).not.toBeInTheDocument();
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<RiskIndicator score={7.5} priority="high" size="small" />);
    
    // Small size should render
    expect(screen.getByText('7.5')).toBeInTheDocument();

    rerender(<RiskIndicator score={7.5} priority="high" size="large" />);
    
    // Large size should render
    expect(screen.getByText('7.5')).toBeInTheDocument();
  });

  it('handles zero score', () => {
    render(<RiskIndicator score={0} priority="low" />);
    
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  it('handles maximum score', () => {
    render(<RiskIndicator score={10} priority="critical" />);
    
    expect(screen.getByText('10.0')).toBeInTheDocument();
  });

  it('shows risk score label when showLabel is true', () => {
    render(<RiskIndicator score={7.5} priority="high" showLabel={true} />);
    
    expect(screen.getByText('Risk Score')).toBeInTheDocument();
  });
});