/**
 * Admin View - System administration and monitoring
 */

import React, { useState } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { DashboardStats } from '../types/dashboard';
import { formatNumber, formatPercentage } from '../utils/formatting';

interface AdminViewProps {
  stats: DashboardStats;
}

export const AdminView: React.FC<AdminViewProps> = ({ stats }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'system' | 'users' | 'settings'>('overview');
  const [systemStatus, setSystemStatus] = useState({
    api: 'online',
    database: 'online',
    qodo: 'online',
    redis: 'online',
    slack: 'online',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#38a169';
      case 'warning': return '#ed8936';
      case 'offline': return '#e53e3e';
      default: return '#718096';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'warning': return '🟡';
      case 'offline': return '🔴';
      default: return '⚪';
    }
  };

  const renderOverviewTab = () => (
    <div className="admin-overview">
      {/* System Health */}
      <div className="admin-section">
        <h3 className="section-title">🏥 System Health</h3>
        <div className="health-grid">
          {Object.entries(systemStatus).map(([service, status]) => (
            <div key={service} className="health-card">
              <div className="health-header">
                <span className="health-icon">{getStatusIcon(status)}</span>
                <span className="health-service">{service.toUpperCase()}</span>
              </div>
              <div className="health-status" style={{ color: getStatusColor(status) }}>
                {status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="admin-section">
        <h3 className="section-title">📊 Key Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">📋</div>
            <div className="metric-content">
              <div className="metric-value">{formatNumber(stats.totalRegulations)}</div>
              <div className="metric-label">Total Regulations</div>
              <div className="metric-trend">+12% this month</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⏰</div>
            <div className="metric-content">
              <div className="metric-value">{formatNumber(stats.pendingActions)}</div>
              <div className="metric-label">Pending Actions</div>
              <div className="metric-trend">-8% this week</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🚨</div>
            <div className="metric-content">
              <div className="metric-value">{formatNumber(stats.highPriorityItems)}</div>
              <div className="metric-label">High Priority Items</div>
              <div className="metric-trend">+3 new today</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <div className="metric-value">{formatPercentage(stats.completedThisWeek, stats.pendingActions + stats.completedThisWeek)}</div>
              <div className="metric-label">Completion Rate</div>
              <div className="metric-trend">+15% vs last week</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="admin-section">
        <h3 className="section-title">📈 Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">🔍</div>
            <div className="activity-content">
              <div className="activity-title">New regulation analyzed</div>
              <div className="activity-description">EPA emission standards for offshore operations</div>
              <div className="activity-time">2 minutes ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">✅</div>
            <div className="activity-content">
              <div className="activity-title">Action item completed</div>
              <div className="activity-description">Pipeline safety training completed by John Smith</div>
              <div className="activity-time">15 minutes ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">🚨</div>
            <div className="activity-content">
              <div className="activity-title">High priority alert</div>
              <div className="activity-description">Critical compliance deadline approaching</div>
              <div className="activity-time">1 hour ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">📊</div>
            <div className="activity-content">
              <div className="activity-title">Weekly report generated</div>
              <div className="activity-description">Compliance summary sent to stakeholders</div>
              <div className="activity-time">3 hours ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="admin-system">
      {/* System Information */}
      <div className="admin-section">
        <h3 className="section-title">💻 System Information</h3>
        <div className="system-info">
          <div className="info-row">
            <span className="info-label">Version:</span>
            <span className="info-value">v1.0.0</span>
          </div>
          <div className="info-row">
            <span className="info-label">Environment:</span>
            <span className="info-value">Production</span>
          </div>
          <div className="info-row">
            <span className="info-label">Uptime:</span>
            <span className="info-value">7 days, 14 hours</span>
          </div>
          <div className="info-row">
            <span className="info-label">Last Deployment:</span>
            <span className="info-value">2025-01-08 10:30 AM</span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="admin-section">
        <h3 className="section-title">⚡ Performance Metrics</h3>
        <div className="performance-grid">
          <div className="performance-card">
            <div className="performance-title">Response Time</div>
            <div className="performance-value">245ms</div>
            <div className="performance-status good">Good</div>
          </div>

          <div className="performance-card">
            <div className="performance-title">Memory Usage</div>
            <div className="performance-value">68%</div>
            <div className="performance-status warning">Warning</div>
          </div>

          <div className="performance-card">
            <div className="performance-title">CPU Usage</div>
            <div className="performance-value">34%</div>
            <div className="performance-status good">Good</div>
          </div>

          <div className="performance-card">
            <div className="performance-title">Disk Usage</div>
            <div className="performance-value">45%</div>
            <div className="performance-status good">Good</div>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="admin-section">
        <h3 className="section-title">📝 System Logs</h3>
        <div className="logs-container">
          <div className="log-entry info">
            <span className="log-time">2025-01-08 14:32:15</span>
            <span className="log-level">INFO</span>
            <span className="log-message">Regulation analysis completed successfully</span>
          </div>
          <div className="log-entry warning">
            <span className="log-time">2025-01-08 14:30:42</span>
            <span className="log-level">WARN</span>
            <span className="log-message">High memory usage detected</span>
          </div>
          <div className="log-entry info">
            <span className="log-time">2025-01-08 14:28:33</span>
            <span className="log-level">INFO</span>
            <span className="log-message">New regulation scraped from EPA</span>
          </div>
          <div className="log-entry error">
            <span className="log-time">2025-01-08 14:25:18</span>
            <span className="log-level">ERROR</span>
            <span className="log-message">Failed to send Slack notification</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="admin-users">
      <div className="admin-section">
        <h3 className="section-title">👥 User Management</h3>
        <div className="users-table">
          <div className="table-header">
            <div className="header-cell">Name</div>
            <div className="header-cell">Role</div>
            <div className="header-cell">Last Active</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Actions</div>
          </div>
          
          <div className="table-body">
            <div className="table-row">
              <div className="table-cell">
                <div className="user-info">
                  <div className="user-avatar">👤</div>
                  <div className="user-details">
                    <div className="user-name">John Smith</div>
                    <div className="user-email">john.smith@company.com</div>
                  </div>
                </div>
              </div>
              <div className="table-cell">Admin</div>
              <div className="table-cell">2 hours ago</div>
              <div className="table-cell">
                <span className="status-badge active">Active</span>
              </div>
              <div className="table-cell">
                <button className="action-btn">Edit</button>
              </div>
            </div>

            <div className="table-row">
              <div className="table-cell">
                <div className="user-info">
                  <div className="user-avatar">👤</div>
                  <div className="user-details">
                    <div className="user-name">Sarah Johnson</div>
                    <div className="user-email">sarah.johnson@company.com</div>
                  </div>
                </div>
              </div>
              <div className="table-cell">Manager</div>
              <div className="table-cell">1 day ago</div>
              <div className="table-cell">
                <span className="status-badge active">Active</span>
              </div>
              <div className="table-cell">
                <button className="action-btn">Edit</button>
              </div>
            </div>

            <div className="table-row">
              <div className="table-cell">
                <div className="user-info">
                  <div className="user-avatar">👤</div>
                  <div className="user-details">
                    <div className="user-name">Mike Davis</div>
                    <div className="user-email">mike.davis@company.com</div>
                  </div>
                </div>
              </div>
              <div className="table-cell">User</div>
              <div className="table-cell">3 days ago</div>
              <div className="table-cell">
                <span className="status-badge inactive">Inactive</span>
              </div>
              <div className="table-cell">
                <button className="action-btn">Edit</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="admin-settings">
      <div className="admin-section">
        <h3 className="section-title">⚙️ System Settings</h3>
        <div className="settings-form">
          <div className="setting-group">
            <label className="setting-label">Notification Frequency</label>
            <select className="setting-select">
              <option>Immediate</option>
              <option>Hourly</option>
              <option>Daily</option>
              <option>Weekly</option>
            </select>
          </div>

          <div className="setting-group">
            <label className="setting-label">Risk Score Threshold</label>
            <input type="number" className="setting-input" defaultValue="7.0" min="0" max="10" step="0.1" />
          </div>

          <div className="setting-group">
            <label className="setting-label">Auto-Analysis</label>
            <div className="setting-toggle">
              <input type="checkbox" id="auto-analysis" defaultChecked />
              <label htmlFor="auto-analysis" className="toggle-label">Enable automatic analysis of new regulations</label>
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label">Data Retention (days)</label>
            <input type="number" className="setting-input" defaultValue="365" min="30" max="3650" />
          </div>

          <div className="setting-actions">
            <button className="setting-btn primary">Save Changes</button>
            <button className="setting-btn secondary">Reset to Defaults</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-view">
      {/* Header */}
      <div className="admin-header">
        <h1 className="admin-title">⚙️ System Administration</h1>
        <div className="admin-actions">
          <button className="admin-btn secondary">📊 Generate Report</button>
          <button className="admin-btn primary">🔄 Refresh Data</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          💻 System
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'system' && renderSystemTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Inline Styles */}
      <style>{`
        .admin-view {
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .admin-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
        }

        .admin-actions {
          display: flex;
          gap: 1rem;
        }

        .admin-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .admin-btn.primary {
          background: #3182ce;
          color: white;
        }

        .admin-btn.primary:hover {
          background: #2c5282;
        }

        .admin-btn.secondary {
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }

        .admin-btn.secondary:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .admin-tabs {
          display: flex;
          background: white;
          border-radius: 0.75rem;
          padding: 0.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .tab-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          color: #4a5568;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: #3182ce;
          color: white;
        }

        .tab-btn:hover:not(.active) {
          background: #f7fafc;
        }

        .admin-content {
          background: white;
          border-radius: 0.75rem;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .admin-section {
          margin-bottom: 3rem;
        }

        .admin-section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 1.5rem 0;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .health-card {
          background: #f7fafc;
          border-radius: 0.5rem;
          padding: 1rem;
          border: 1px solid #e2e8f0;
        }

        .health-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .health-icon {
          font-size: 1.25rem;
        }

        .health-service {
          font-weight: 600;
          color: #1a202c;
        }

        .health-status {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .metric-card {
          background: #f7fafc;
          border-radius: 0.75rem;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .metric-icon {
          font-size: 2rem;
        }

        .metric-content {
          flex: 1;
        }

        .metric-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a202c;
          line-height: 1;
        }

        .metric-label {
          font-size: 0.875rem;
          color: #718096;
          margin: 0.25rem 0;
        }

        .metric-trend {
          font-size: 0.75rem;
          color: #38a169;
          font-weight: 500;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }

        .activity-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
        }

        .activity-title {
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 0.25rem;
        }

        .activity-description {
          color: #4a5568;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .activity-time {
          color: #718096;
          font-size: 0.75rem;
        }

        .system-info {
          background: #f7fafc;
          border-radius: 0.5rem;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-weight: 500;
          color: #4a5568;
        }

        .info-value {
          color: #1a202c;
          font-weight: 600;
        }

        .performance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .performance-card {
          background: #f7fafc;
          border-radius: 0.5rem;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          text-align: center;
        }

        .performance-title {
          font-size: 0.875rem;
          color: #718096;
          margin-bottom: 0.5rem;
        }

        .performance-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }

        .performance-status {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        .performance-status.good {
          background: #c6f6d5;
          color: #22543d;
        }

        .performance-status.warning {
          background: #fbd38d;
          color: #744210;
        }

        .logs-container {
          background: #1a202c;
          border-radius: 0.5rem;
          padding: 1rem;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.875rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .log-entry {
          display: flex;
          gap: 1rem;
          padding: 0.25rem 0;
          color: #e2e8f0;
        }

        .log-time {
          color: #718096;
          flex-shrink: 0;
        }

        .log-level {
          flex-shrink: 0;
          width: 60px;
          font-weight: 600;
        }

        .log-entry.info .log-level {
          color: #63b3ed;
        }

        .log-entry.warning .log-level {
          color: #fbd38d;
        }

        .log-entry.error .log-level {
          color: #fc8181;
        }

        .users-table {
          background: #f7fafc;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          background: #edf2f7;
          border-bottom: 1px solid #e2e8f0;
        }

        .header-cell {
          font-weight: 600;
          color: #4a5568;
          font-size: 0.875rem;
        }

        .table-body {
          display: flex;
          flex-direction: column;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-cell {
          font-size: 0.875rem;
          color: #4a5568;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: #e2e8f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .user-name {
          font-weight: 600;
          color: #1a202c;
        }

        .user-email {
          font-size: 0.75rem;
          color: #718096;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.active {
          background: #c6f6d5;
          color: #22543d;
        }

        .status-badge.inactive {
          background: #fed7d7;
          color: #742a2a;
        }

        .action-btn {
          padding: 0.375rem 0.75rem;
          background: #3182ce;
          color: white;
          border: none;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #2c5282;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 600px;
        }

        .setting-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .setting-label {
          font-weight: 500;
          color: #4a5568;
          font-size: 0.875rem;
        }

        .setting-select,
        .setting-input {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          background: white;
        }

        .setting-select:focus,
        .setting-input:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .setting-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toggle-label {
          font-size: 0.875rem;
          color: #4a5568;
          cursor: pointer;
        }

        .setting-actions {
          display: flex;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .setting-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .setting-btn.primary {
          background: #3182ce;
          color: white;
        }

        .setting-btn.primary:hover {
          background: #2c5282;
        }

        .setting-btn.secondary {
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }

        .setting-btn.secondary:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .admin-tabs {
            flex-direction: column;
            padding: 0;
          }

          .tab-btn {
            border-radius: 0;
            border-bottom: 1px solid #e2e8f0;
          }

          .tab-btn:last-child {
            border-bottom: none;
          }

          .health-grid,
          .metrics-grid,
          .performance-grid {
            grid-template-columns: 1fr;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .header-cell {
            display: none;
          }

          .table-cell {
            padding: 0.25rem 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminView;