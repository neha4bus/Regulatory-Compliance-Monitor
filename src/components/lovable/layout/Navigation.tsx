/**
 * Dashboard Navigation Component
 */

import React from 'react';
import { NavigationItem, DashboardView } from '../types/dashboard';

interface NavigationProps {
  items: NavigationItem[];
  currentView: DashboardView;
  onViewChange?: (view: DashboardView) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  items,
  currentView,
  onViewChange,
}) => {
  const handleItemClick = (item: NavigationItem) => {
    if (onViewChange) {
      onViewChange(item.id as DashboardView);
    }
  };

  return (
    <nav className="dashboard-navigation">
      <div className="nav-section">
        <div className="nav-section-title">Main</div>
        <ul className="nav-list">
          {items.map((item) => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-link ${item.active || item.id === currentView ? 'active' : ''}`}
                onClick={() => handleItemClick(item)}
                type="button"
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Stats Section */}
      <div className="nav-section">
        <div className="nav-section-title">Quick Stats</div>
        <div className="nav-stats">
          <div className="nav-stat">
            <div className="nav-stat-icon">📊</div>
            <div className="nav-stat-content">
              <div className="nav-stat-label">System Status</div>
              <div className="nav-stat-value online">Online</div>
            </div>
          </div>
          
          <div className="nav-stat">
            <div className="nav-stat-icon">🔄</div>
            <div className="nav-stat-content">
              <div className="nav-stat-label">Last Update</div>
              <div className="nav-stat-value">2 min ago</div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Styles */}
      <style>{`
        .dashboard-navigation {
          padding: 0 1rem;
        }

        .nav-section {
          margin-bottom: 2rem;
        }

        .nav-section-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
          padding: 0 0.75rem;
        }

        .nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .nav-item {
          margin-bottom: 0.25rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 0.75rem;
          border: none;
          background: none;
          color: #4a5568;
          text-decoration: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .nav-link:hover {
          background-color: #f7fafc;
          color: #2d3748;
        }

        .nav-link.active {
          background-color: #ebf8ff;
          color: #3182ce;
          font-weight: 600;
        }

        .nav-icon {
          margin-right: 0.75rem;
          font-size: 1.125rem;
        }

        .nav-label {
          flex: 1;
          text-align: left;
        }

        .nav-badge {
          background-color: #e53e3e;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 1rem;
          min-width: 1.25rem;
          text-align: center;
        }

        .nav-stats {
          padding: 0 0.75rem;
        }

        .nav-stat {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }

        .nav-stat-icon {
          font-size: 1.25rem;
          margin-right: 0.75rem;
        }

        .nav-stat-content {
          flex: 1;
        }

        .nav-stat-label {
          font-size: 0.75rem;
          color: #718096;
          margin-bottom: 0.125rem;
        }

        .nav-stat-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3748;
        }

        .nav-stat-value.online {
          color: #38a169;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .dashboard-navigation {
            display: flex;
            gap: 2rem;
            padding: 0.5rem 1rem;
            overflow-x: auto;
          }

          .nav-section {
            margin-bottom: 0;
            min-width: max-content;
          }

          .nav-list {
            display: flex;
            gap: 0.5rem;
          }

          .nav-item {
            margin-bottom: 0;
          }

          .nav-link {
            padding: 0.5rem 1rem;
            white-space: nowrap;
          }

          .nav-stats {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navigation;