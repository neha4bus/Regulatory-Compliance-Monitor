/**
 * Main Dashboard Application Component
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useDashboardState } from '../hooks/dashboard';
import { DashboardProps, DashboardView, NavigationItem } from '../types/dashboard';
import { RegulationListView } from '../views/RegulationListView';
import { RegulationDetailView } from '../views/RegulationDetailView';
import { ActionListView } from '../views/ActionListView';
import { HomeView } from '../views/HomeView';
import { HistoryView } from '../views/HistoryView';
import { AdminView } from '../views/AdminView';
import { useDashboardStats } from '../hooks/dashboard';

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: '🏠',
    path: '/',
  },
  {
    id: 'regulations',
    label: 'Regulations',
    icon: '📋',
    path: '/regulations',
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: '✅',
    path: '/actions',
  },
  {
    id: 'history',
    label: 'History',
    icon: '📈',
    path: '/history',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: '⚙️',
    path: '/admin',
  },
];

export const DashboardApp: React.FC<DashboardProps> = ({
  className = '',
  theme = 'light',
  initialView = 'home',
}) => {
  const [currentView, setCurrentView] = useState<DashboardView>(initialView);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { state, actions } = useDashboardState();
  const { stats, loading: statsLoading } = useDashboardStats();

  useEffect(() => {
    // Initialize dashboard data
    actions.loadRegulations();
    actions.loadActions();
  }, [actions]);

  const handleViewChange = (view: DashboardView) => {
    setCurrentView(view);
    // Clear selected regulation when changing views (except to detail view)
    if (view !== 'home' && state.selectedRegulation) {
      actions.selectRegulation(null);
    }
    // In a real app, this would update the URL
    console.log(`[Dashboard] Navigating to view: ${view}`);
  };

  const renderCurrentView = () => {
    // Show detail view if a regulation is selected
    if (state.selectedRegulation) {
      return (
        <RegulationDetailView
          regulation={state.selectedRegulation}
          loading={state.loading}
          onBack={() => actions.selectRegulation(null)}
          onActionCreate={(action) => {
            console.log('[Dashboard] Creating action:', action);
            // In a real app, this would create the action
          }}
          onActionUpdate={(actionId, updates) => {
            console.log('[Dashboard] Updating action:', actionId, updates);
            // In a real app, this would update the action
          }}
          onStatusChange={(status) => {
            console.log('[Dashboard] Changing regulation status:', status);
            // In a real app, this would update the regulation status
          }}
          onAssigneeChange={(assignee) => {
            console.log('[Dashboard] Changing assignee:', assignee);
            // In a real app, this would update the regulation assignee
          }}
        />
      );
    }

    switch (currentView) {
      case 'home':
        return (
          <HomeView
            actions={state.actions}
            onRegulationClick={(regulation) => {
              actions.selectRegulation(regulation);
              console.log('[Dashboard] Selected regulation:', regulation.title);
            }}
            onViewAllRegulations={() => handleViewChange('regulations')}
            onViewAllActions={() => handleViewChange('actions')}
          />
        );
      
      case 'regulations':
        return (
          <RegulationListView
            regulations={state.regulations}
            loading={state.loading}
            filters={state.filters}
            onRegulationClick={(regulation) => {
              actions.selectRegulation(regulation);
              console.log('[Dashboard] Selected regulation:', regulation.title);
            }}
            onFiltersChange={actions.updateFilters}
            pagination={{
              page: currentPage,
              pageSize: pageSize,
              total: state.regulations.length,
              onPageChange: (page) => {
                setCurrentPage(page);
                console.log('[Dashboard] Page changed to:', page);
              },
            }}
          />
        );
      
      case 'actions':
        return (
          <ActionListView
            actions={state.actions}
            loading={state.loading}
            onActionClick={(action) => {
              console.log('[Dashboard] Selected action:', action.title);
            }}
            onStatusChange={(actionId, status) => {
              actions.updateActionStatus(actionId, status);
            }}
          />
        );
      
      case 'history':
        return (
          <HistoryView
            regulations={state.regulations}
            loading={state.loading}
          />
        );
      
      case 'admin':
        return (
          <AdminView
            stats={stats}
          />
        );
      
      default:
        return <div>View not found</div>;
    }
  };

  // Update navigation badges
  const navigationWithBadges = NAVIGATION_ITEMS.map(item => ({
    ...item,
    active: item.id === currentView,
    badge: item.id === 'actions' 
      ? state.actions.filter(a => a.status === 'pending').length 
      : undefined,
  }));

  return (
    <ErrorBoundary>
      <div className={`dashboard-app ${theme} ${className}`}>
        <DashboardLayout
          navigation={navigationWithBadges}
          currentView={currentView}
          onViewChange={handleViewChange}
          loading={state.loading}
          stats={stats}
          loading={state.loading || statsLoading}
        >
          {renderCurrentView()}
        </DashboardLayout>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardApp;