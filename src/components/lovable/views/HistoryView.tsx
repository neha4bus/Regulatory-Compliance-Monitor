/**
 * History View - Display regulation history and timeline
 */

import React, { useState } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Regulation } from '../../types';
import { formatDate, getTimeAgo } from '../utils/formatting';

interface HistoryViewProps {
  regulations: Regulation[];
  loading: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  regulations,
  loading,
}) => {
  const [timeRange, setTimeRange] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  const getFilteredRegulations = () => {
    const now = new Date();
    let cutoffDate: Date | null = null;

    switch (timeRange) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return regulations;
    }

    return regulations.filter(reg => new Date(reg.date) >= cutoffDate!);
  };

  const getSortedRegulations = () => {
    return getFilteredRegulations().sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const getTimelineGroups = () => {
    const sortedRegs = getSortedRegulations();
    const groups: { [key: string]: Regulation[] } = {};

    sortedRegs.forEach(reg => {
      const date = new Date(reg.date);
      const monthYear = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(reg);
    });

    return groups;
  };

  const getActivityStats = () => {
    const filtered = getFilteredRegulations();
    return {
      total: filtered.length,
      analyzed: filtered.filter(r => r.status === 'analyzed').length,
      highRisk: filtered.filter(r => (r.riskScore || 0) >= 7).length,
      sources: new Set(filtered.map(r => r.source)).size,
    };
  };

  const sortedRegulations = getSortedRegulations();
  const timelineGroups = getTimelineGroups();
  const stats = getActivityStats();

  if (loading) {
    return (
      <div className="history-loading">
        <LoadingSpinner size="large" message="Loading regulation history..." />
      </div>
    );
  }

  return (
    <div className="history-view">
      {/* Header */}
      <div className="history-header">
        <div className="header-content">
          <h1 className="history-title">📈 Regulation History</h1>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Regulations</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.analyzed}</span>
              <span className="stat-label">Analyzed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.highRisk}</span>
              <span className="stat-label">High Risk</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.sources}</span>
              <span className="stat-label">Sources</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="history-controls">
        <div className="controls-left">
          <div className="control-group">
            <label className="control-label">Time Range</label>
            <select
              className="control-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">View Mode</label>
            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setViewMode('timeline')}
              >
                📅 Timeline
              </button>
              <button
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                📋 List
              </button>
            </div>
          </div>
        </div>

        <div className="controls-right">
          <button className="export-btn">
            📊 Export History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="history-content">
        {sortedRegulations.length > 0 ? (
          viewMode === 'timeline' ? (
            <div className="timeline-view">
              {Object.entries(timelineGroups).map(([monthYear, regs]) => (
                <div key={monthYear} className="timeline-group">
                  <div className="timeline-header">
                    <h3 className="timeline-month">{monthYear}</h3>
                    <span className="timeline-count">({regs.length} regulations)</span>
                  </div>
                  
                  <div className="timeline-items">
                    {regs.map(regulation => (
                      <div key={regulation.id} className="timeline-item">
                        <div className="timeline-marker">
                          <div className={`timeline-dot ${regulation.priority || 'low'}`}></div>
                        </div>
                        
                        <div className="timeline-content">
                          <div className="timeline-card">
                            <div className="card-header">
                              <h4 className="card-title">{regulation.title}</h4>
                              <div className="card-meta">
                                <span className="card-source">{regulation.source}</span>
                                <span className="card-date">{formatDate(regulation.date)}</span>
                                <span className={`card-status ${regulation.status}`}>
                                  {regulation.status}
                                </span>
                              </div>
                            </div>
                            
                            {regulation.summary && (
                              <p className="card-summary">
                                {regulation.summary.length > 150 
                                  ? regulation.summary.substring(0, 150) + '...'
                                  : regulation.summary}
                              </p>
                            )}
                            
                            <div className="card-footer">
                              {regulation.riskScore && (
                                <span className={`risk-badge ${regulation.priority || 'low'}`}>
                                  Risk: {regulation.riskScore.toFixed(1)}
                                </span>
                              )}
                              <span className="time-ago">
                                {getTimeAgo(regulation.date)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="list-view">
              <div className="list-table">
                <div className="table-header">
                  <div className="header-cell">Title</div>
                  <div className="header-cell">Source</div>
                  <div className="header-cell">Date</div>
                  <div className="header-cell">Risk</div>
                  <div className="header-cell">Status</div>
                </div>
                
                <div className="table-body">
                  {sortedRegulations.map(regulation => (
                    <div key={regulation.id} className="table-row">
                      <div className="table-cell title-cell">
                        <div className="cell-title">{regulation.title}</div>
                        {regulation.summary && (
                          <div className="cell-subtitle">
                            {regulation.summary.substring(0, 100)}...
                          </div>
                        )}
                      </div>
                      <div className="table-cell">{regulation.source}</div>
                      <div className="table-cell">{formatDate(regulation.date)}</div>
                      <div className="table-cell">
                        {regulation.riskScore && (
                          <span className={`risk-badge ${regulation.priority || 'low'}`}>
                            {regulation.riskScore.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="table-cell">
                        <span className={`status-badge ${regulation.status}`}>
                          {regulation.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📈</div>
            <h3 className="empty-title">No history found</h3>
            <p className="empty-message">
              {timeRange !== 'all' 
                ? 'No regulations found in the selected time range.'
                : 'No regulation history available yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Inline Styles */}
      <style>{`
        .history-view {
          max-width: 1200px;
          margin: 0 auto;
        }

        .history-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
        }

        .history-header {
          margin-bottom: 2rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .history-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
        }

        .header-stats {
          display: flex;
          gap: 2rem;
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

        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .history-controls {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: end;
        }

        .controls-left {
          display: flex;
          gap: 2rem;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #4a5568;
        }

        .control-select {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          background: white;
        }

        .view-toggle {
          display: flex;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .toggle-btn {
          padding: 0.75rem 1rem;
          background: white;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .toggle-btn.active {
          background: #3182ce;
          color: white;
        }

        .export-btn {
          padding: 0.75rem 1.5rem;
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .export-btn:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .history-content {
          margin-bottom: 2rem;
        }

        .timeline-view {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .timeline-group {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .timeline-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .timeline-month {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0;
        }

        .timeline-count {
          font-size: 0.875rem;
          color: #718096;
          background: #f7fafc;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
        }

        .timeline-items {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .timeline-item {
          display: flex;
          gap: 1rem;
        }

        .timeline-marker {
          flex-shrink: 0;
          padding-top: 0.5rem;
        }

        .timeline-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #cbd5e0;
        }

        .timeline-dot.low { background: #38a169; }
        .timeline-dot.medium { background: #ed8936; }
        .timeline-dot.high { background: #e53e3e; }
        .timeline-dot.critical { background: #9f1239; }

        .timeline-content {
          flex: 1;
        }

        .timeline-card {
          background: #f7fafc;
          border-radius: 0.5rem;
          padding: 1rem;
          border: 1px solid #e2e8f0;
        }

        .card-header {
          margin-bottom: 0.75rem;
        }

        .card-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 0.5rem 0;
        }

        .card-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #718096;
        }

        .card-source {
          font-weight: 500;
        }

        .card-status {
          text-transform: capitalize;
          font-weight: 500;
        }

        .card-status.analyzed { color: #38a169; }
        .card-status.reviewed { color: #805ad5; }
        .card-status.new { color: #3182ce; }

        .card-summary {
          color: #4a5568;
          line-height: 1.5;
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .risk-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }

        .risk-badge.low { background: #38a169; }
        .risk-badge.medium { background: #ed8936; }
        .risk-badge.high { background: #e53e3e; }
        .risk-badge.critical { background: #9f1239; }

        .time-ago {
          font-size: 0.75rem;
          color: #718096;
        }

        .list-view {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .list-table {
          width: 100%;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 0.5fr 0.5fr;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: #f7fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .header-cell {
          font-size: 0.875rem;
          font-weight: 600;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .table-body {
          display: flex;
          flex-direction: column;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 0.5fr 0.5fr;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          transition: background 0.2s;
        }

        .table-row:hover {
          background: #f7fafc;
        }

        .table-cell {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
          color: #4a5568;
        }

        .title-cell {
          flex-direction: column;
          align-items: flex-start;
        }

        .cell-title {
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 0.25rem;
        }

        .cell-subtitle {
          font-size: 0.75rem;
          color: #718096;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-badge.analyzed {
          background: #c6f6d5;
          color: #22543d;
        }

        .status-badge.reviewed {
          background: #e9d8fd;
          color: #553c9a;
        }

        .status-badge.new {
          background: #bee3f8;
          color: #2a4365;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 0.5rem 0;
        }

        .empty-message {
          color: #718096;
          margin: 0;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .header-stats {
            gap: 1rem;
          }

          .history-controls {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .controls-left {
            gap: 1rem;
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

          .timeline-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .timeline-marker {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default HistoryView;