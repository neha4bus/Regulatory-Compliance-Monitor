/**
 * Main Dashboard Layout Component with Navigation
 */

import React from 'react';
import { Navigation } from './Navigation';
import { DashboardLayoutProps } from '../types/dashboard';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navigation = [],
  currentView = 'home',
  onViewChange,
  stats,
  loading = false,
}) => {
  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">
              🛡️ AI Regulatory Compliance Monitor
            </h1>
            <div className="header-subtitle">
              Oil & Gas Industry Compliance Dashboard
            </div>
          </div>
          
          <div className="header-right">
            {stats && (
              <div className="header-stats">
                <div className="stat-item">
                  <span className="stat-value">{stats.totalRegulations}</span>
                  <span className="stat-label">Regulations</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.pendingActions}</span>
                  <span className="stat-label">Pending</span>
                </div>
                <div className="stat-item critical">
                  <span className="stat-value">{stats.highPriorityItems}</span>
                  <span className="stat-label">High Priority</span>
                </div>
              </div>
            )}
            
            <div className="header-actions">
              <button className="btn btn-outline">
                🔄 Refresh
              </button>
              <button className="btn btn-primary">
                ➕ New Action
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Sidebar Navigation */}
        <aside className="dashboard-sidebar">
          <Navigation
            items={navigation}
            currentView={currentView}
            onViewChange={onViewChange}
          />
        </aside>

        {/* Content Area */}
        <main className="dashboard-content">
          {loading ? (
            <div className="loading-container">
              <LoadingSpinner size="large" message="Loading dashboard data..." />
            </div>
          ) : (
            <div className="content-wrapper">
              {children}
            </div>
          )}
        </main>
      </div>

      {/* Inline Styles for Demo */}
      <style>{`
        .dashboard-layout {
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 1rem 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
        }

        .header-subtitle {
          font-size: 0.875rem;
          color: #718096;
          margin-top: 0.25rem;
        }

        .header-stats {
          display: flex;
          gap: 2rem;
          margin-right: 2rem;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #2d3748;
        }

        .stat-item.critical .stat-value {
          color: #e53e3e;
        }

        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-outline {
          background: white;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }

        .btn-outline:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
        }

        .btn-primary {
          background: #3182ce;
          color: white;
        }

        .btn-primary:hover {
          background: #2c5282;
        }

        .dashboard-main {
          display: flex;
          max-width: 1400px;
          margin: 0 auto;
          min-height: calc(100vh - 80px);
        }

        .dashboard-sidebar {
          width: 250px;
          background: white;
          border-right: 1px solid #e2e8f0;
          padding: 1.5rem 0;
        }

        .dashboard-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
        }

        .content-wrapper {
          max-width: 100%;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .header-stats {
            margin-right: 0;
            gap: 1rem;
          }

          .dashboard-main {
            flex-direction: column;
          }

          .dashboard-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
            padding: 1rem;
          }

          .dashboard-content {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .dashboard-header {
            padding: 1rem;
          }

          .dashboard-title {
            font-size: 1.25rem;
          }

          .header-stats {
            flex-wrap: wrap;
            gap: 0.75rem;
          }

          .header-actions {
            flex-direction: column;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;