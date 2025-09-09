/**
 * Unit tests for LoadingSpinner component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without message', () => {
    render(<LoadingSpinner />);
    
    // Should render the spinner element
    const spinner = document.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with message', () => {
    render(<LoadingSpinner message="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    
    let spinner = document.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();

    rerender(<LoadingSpinner size="large" />);
    
    spinner = document.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('applies custom color', () => {
    render(<LoadingSpinner color="#ff0000" />);
    
    const spinnerRing = document.querySelector('.spinner-ring');
    expect(spinnerRing).toBeInTheDocument();
  });

  it('renders with all props', () => {
    render(
      <LoadingSpinner 
        size="large" 
        color="#3182ce" 
        message="Processing your request..." 
      />
    );
    
    expect(screen.getByText('Processing your request...')).toBeInTheDocument();
    
    const spinner = document.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });
});