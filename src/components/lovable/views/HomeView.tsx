/**
 * Home View - Dashboard overview with key metrics and recent items
 */

import React, { useState, useEffect } from 'react';
import { RegulationCard } from '../components/RegulationCard';
import { ActionItem } from '../components/ActionItem';
import { RiskIndicator } from '../components/RiskIndicator';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { DashboardStats, ActionItemProps, DashboardFilters } from '../types/dashboard';
import { Regulation } from '../../../types';
import { formatNumber } from '../utils/formatting';
import { useRegulations, useDashboardStats } from '../hooks/dashboard';

interface HomeViewProps {
  actions: ActionItemProps[];
  onRegulationClick?: (regulation: Regulation) => void;
  onViewAllRegulations?: () => void;
  onViewAllActions?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  actions,
  onRegulationClick,
  onViewAllRegulations,
  onViewAllActions,
}) => {
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Load recent regulations (last 7 days)
  const recentFilters: DashboardFilters = {
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: new Date(),
    },
  };
  
  const { 
    data: recentRegulations, 
    loading: regulationsLoading, 
    refetch: refetchRegulations 
  } = useRegulations(recentFilters, { limit: 5, sortBy: 'date', sortDirection: 'desc' });
  
  const { stats, loading: statsLoading, refetch: refetchStats } = useDashboardStats();

  // Set up real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetchRegulations();
      refetchStats();
    }, 30000); // Refresh every 30 seconds

    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [refetchRegulations, refetchStats]);

  const loading = regulationsLoading || statsLoading;

  if (loading && recentRegulations.length === 0) {
    return (
      <div className="home-loading">
        <LoadingSpinner size="large" message="Loading dashboard overview..." />
      </div>
    );
  }

  const urgentActions = actions
    .filter(action => action.priority === 'critical' || action.priority === 'high')
    .slice(0, 3);

  const handleRegulationClick = (regulation: Regulation) => {
    if (onRegulationClick) {
      onRegulationClick(regulation);
    }
  };

  return (
    <div className="home-view">
      {/* Welcome Header */}
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome to Compliance Dashboard</h1>
        <p className="welcome-subtitle">
          Monitor regulatory changes and manage compliance actions for your oil & gas operations
        </p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <div className="metric-value">{formatNumber(stats.totalRegulations)}</div>
            <div className="metric-label">Total Regulations</div>
          </div>
        </div>

        <div className="metric-card urgent">
          <div className="metric-icon">⏰</div>
          <div className="metric-content">
            <div className="metric-value">{formatNumber(stats.pendingActions)}</div>
            <div className="metric-label">Pending Actions</div>
          </div>
        </div>

        <div className="metric-card critical">
          <div className="metric-icon">🚨</div>
          <div className="metric-content">
            <div className="metric-value">{formatNumber(stats.highPriorityItems)}</div>
            <div className="metric-label">High Priority</div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-value">{formatNumber(stats.completedThisWeek)}</div>
            <div className="metric-label">Completed This Week</div>
          </div>
        </div>

        <div className="metric-card risk">
          <div className="metric-content-risk">
            <RiskIndicator
              score={stats.averageRiskScore}
              priority={stats.averageRiskScore >= 7 ? 'high' : stats.averageRiskScore >= 4 ? 'medium' : 'low'}
              size="large"
              showLabel={true}
              animated={true}
            />
            <div className="metric-label">Average Risk Score</div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Recent Regulations */}
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">
              📋 Recent Regulations
              {regulationsLoading && <span className="loading-indicator">🔄</span>}
            </h2>
            <button 
              className="section-action"
              onClick={onViewAllRegulations}
            >
              View All
            </button>
          </div>
          
          <div className="regulations-list">
            {recentRegulations.length > 0 ? (
              recentRegulations.map(regulation => (
                <RegulationCard
                  key={regulation.id}
                  regulation={regulation}
                  onClick={handleRegulationClick}
                  compact={true}
                  showActions={false}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <p>No recent regulations found</p>
                <small>Regulations from the last 7 days will appear here</small>
              </div>
            )}
          </div>
        </div>

        {/* Urgent Actions */}
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">🚨 Urgent Actions</h2>
            <button 
              className="section-action"
              onClick={onViewAllActions}
            >
              View All
            </button>
          </div>
          
          <div className="actions-list">
            {urgentActions.length > 0 ? (
              urgentActions.map(action => (
                <ActionItem
                  key={action.id}
                  {...action}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <p>No urgent actions at this time</p>
                <small>High and critical priority actions will appear here</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="quick-actions-title">Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-btn">
            <span className="quick-action-icon">🔍</span>
            <span className="quick-action-label">Search Regulations</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">➕</span>
            <span className="quick-action-label">Add Action Item</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">📊</span>
            <span className="quick-action-label">Generate Report</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">⚙️</span>
            <span className="quick-action-label">System Settings</span>
          </button>
        </div>
      </div>

      {/* Inline Styles */}
      <style>{`
        .home-view {
          max-width: 1200px;
          margin: 0 auto;
        }

        .home-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
        }

        .welcome-section {
          margin-bottom: 2rem;
          text-align: center;
        }

        .welcome-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 0.5rem 0;
        }

        .welcome-subtitle {
          font-size: 1.125rem;
          color: #718096;
          margin: 0;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .metric-card {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .metric-card.urgent {
          border-left: 4px solid #ed8936;
        }

        .metric-card.critical {
          border-left: 4px solid #e53e3e;
        }

        .metric-card.success {
          border-left: 4px solid #38a169;
        }

        .metric-card.risk {
          justify-content: center;
          flex-direction: column;
          text-align: center;
        }

        .metric-icon {
          font-size: 2rem;
        }

        .metric-content {
          flex: 1;
        }

        .metric-content-risk {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
          line-height: 1;
        }

        .metric-label {
          font-size: 0.875rem;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.25rem;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .content-section {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .loading-indicator {
          animation: spin 1s linear infinite;
          font-size: 1rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .section-action {
          background: none;
          border: none;
          color: #3182ce;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .section-action:hover {
          color: #2c5282;
          text-decoration: underline;
        }

        .regulations-list,
        .actions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #718096;
        }

        .empty-state small {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #a0aec0;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .quick-actions {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .quick-actions-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 1.5rem 0;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-action-btn:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
          transform: translateY(-1px);
        }

        .quick-action-icon {
          font-size: 1.25rem;
        }

        .quick-action-label {
          font-weight: 500;
          color: #4a5568;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .welcome-title {
            font-size: 1.5rem;
          }

          .welcome-subtitle {
            font-size: 1rem;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .content-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .quick-actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default HomeView;