/**
 * Lovable Dashboard Foundation - Main export
 */

export { DashboardApp } from './app/DashboardApp';
export { DashboardLayout } from './layout/DashboardLayout';
export { Navigation } from './layout/Navigation';
export { RegulationCard } from './components/RegulationCard';
export { ActionItem } from './components/ActionItem';
export { ActionItemCard } from './components/ActionItemCard';
export { ActionItemFilter } from './components/ActionItemFilter';
export { RiskIndicator } from './components/RiskIndicator';
export { LoadingSpinner } from './components/LoadingSpinner';
export { ErrorBoundary } from './components/ErrorBoundary';

// Views
export { RegulationDetailView } from './views/RegulationDetailView';
export { RegulationListView } from './views/RegulationListView';
export { ActionListView } from './views/ActionListView';
export { HomeView } from './views/HomeView';
export { HistoryView } from './views/HistoryView';
export { AdminView } from './views/AdminView';

// Types and interfaces
export * from './types/dashboard';

// Utilities
export { formatDate, formatRiskScore, getPriorityColor } from './utils/formatting';
export { useRegulations, useActions, useDashboardState } from './hooks/dashboard';

// Main dashboard service
import { DashboardApp } from './app/DashboardApp';

export class LovableDashboard {
  private app: typeof DashboardApp;

  constructor() {
    this.app = DashboardApp;
  }

  /**
   * Initialize the dashboard application
   */
  initialize(containerId: string = 'dashboard-root'): void {
    console.log('[Lovable Dashboard] Initializing dashboard application');
    
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id '${containerId}' not found`);
    }

    // In a real implementation, this would render the React app
    // For now, we'll create a placeholder
    container.innerHTML = `
      <div class="dashboard-placeholder">
        <h1>AI Regulatory Compliance Monitor</h1>
        <p>Dashboard initializing...</p>
      </div>
    `;
  }

  /**
   * Get dashboard component for React rendering
   */
  getApp(): typeof DashboardApp {
    return this.app;
  }
}