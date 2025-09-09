/**
 * Regulation Detail View - Comprehensive regulation display with AI insights
 */

import React, { useState, useEffect } from 'react';
import { Regulation } from '../../../types';
import { RiskIndicator } from '../components/RiskIndicator';
import { ActionItem } from '../components/ActionItem';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ActionItemProps } from '../types/dashboard';
import { formatDate, formatRiskScore } from '../utils/formatting';

interface RegulationDetailViewProps {
  regulation: Regulation;
  loading?: boolean;
  onBack?: () => void;
  onActionCreate?: (action: Partial<ActionItemProps>) => void;
  onActionUpdate?: (actionId: string, updates: Partial<ActionItemProps>) => void;
  onStatusChange?: (status: Regulation['status']) => void;
  onAssigneeChange?: (assignee: string) => void;
}

type ViewMode = 'overview' | 'full-text' | 'comparison' | 'actions';

export const RegulationDetailView: React.FC<RegulationDetailViewProps> = ({
  regulation,
  loading = false,
  onBack,
  onActionCreate,
  onActionUpdate,
  onStatusChange,
  onAssigneeChange,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [showFullText, setShowFullText] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItemProps[]>([]);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionDescription, setNewActionDescription] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState(regulation.assignedTo || '');

  // Generate action items from compliance checklist
  useEffect(() => {
    if (regulation.complianceChecklist) {
      const generatedActions: ActionItemProps[] = regulation.complianceChecklist.map((item, index) => ({
        id: `${regulation.id}-action-${index}`,
        title: item,
        description: `Action item generated from compliance checklist for regulation: ${regulation.title}`,
        priority: regulation.priority || 'medium',
        status: 'pending',
        regulationId: regulation.id,
      }));
      setActionItems(generatedActions);
    }
  }, [regulation]);

  const handleStatusChange = (newStatus: Regulation['status']) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  const handleAssigneeChange = (assignee: string) => {
    setSelectedAssignee(assignee);
    if (onAssigneeChange) {
      onAssigneeChange(assignee);
    }
  };

  const handleCreateAction = () => {
    if (newActionTitle.trim() && onActionCreate) {
      const newAction: Partial<ActionItemProps> = {
        title: newActionTitle,
        description: newActionDescription,
        priority: regulation.priority || 'medium',
        status: 'pending',
        regulationId: regulation.id,
        assignee: selectedAssignee || undefined,
      };
      onActionCreate(newAction);
      setNewActionTitle('');
      setNewActionDescription('');
    }
  };

  const handleActionStatusChange = (actionId: string, status: ActionItemProps['status']) => {
    setActionItems(prev => 
      prev.map(action => 
        action.id === actionId ? { ...action, status } : action
      )
    );
    if (onActionUpdate) {
      onActionUpdate(actionId, { status });
    }
  };

  if (loading) {
    return (
      <div className="regulation-detail-loading">
        <LoadingSpinner size="large" message="Loading regulation details..." />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#3182ce';
      case 'analyzed': return '#38a169';
      case 'reviewed': return '#805ad5';
      case 'archived': return '#718096';
      default: return '#4a5568';
    }
  };

  const renderOverview = () => (
    <div className="overview-content">
      {/* AI Summary Section */}
      {regulation.summary && (
        <div className="summary-section">
          <h3 className="section-title">🤖 AI Summary</h3>
          <div className="summary-content">
            <p className="summary-text">{regulation.summary}</p>
          </div>
        </div>
      )}

      {/* AI Insights Section */}
      {regulation.insights && (
        <div className="insights-section">
          <h3 className="section-title">💡 Key Insights</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <h4 className="insight-title">What Changed</h4>
              <p className="insight-content">{regulation.insights.whatChanged}</p>
            </div>
            
            {regulation.insights.whoImpacted && regulation.insights.whoImpacted.length > 0 && (
              <div className="insight-card">
                <h4 className="insight-title">Who's Impacted</h4>
                <div className="impact-tags">
                  {regulation.insights.whoImpacted.map((impact, index) => (
                    <span key={index} className="impact-tag">{impact}</span>
                  ))}
                </div>
              </div>
            )}
            
            {regulation.insights.requiredActions && regulation.insights.requiredActions.length > 0 && (
              <div className="insight-card full-width">
                <h4 className="insight-title">Required Actions</h4>
                <ul className="actions-list">
                  {regulation.insights.requiredActions.map((action, index) => (
                    <li key={index} className="action-item">{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance Checklist */}
      {regulation.complianceChecklist && regulation.complianceChecklist.length > 0 && (
        <div className="checklist-section">
          <h3 className="section-title">✅ Compliance Checklist</h3>
          <div className="checklist-content">
            {regulation.complianceChecklist.map((item, index) => (
              <div key={index} className="checklist-item">
                <input type="checkbox" id={`checklist-${index}`} />
                <label htmlFor={`checklist-${index}`}>{item}</label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFullText = () => (
    <div className="full-text-content">
      <div className="text-controls">
        <button 
          className={`text-view-btn ${!showFullText ? 'active' : ''}`}
          onClick={() => setShowFullText(false)}
        >
          📄 Formatted View
        </button>
        <button 
          className={`text-view-btn ${showFullText ? 'active' : ''}`}
          onClick={() => setShowFullText(true)}
        >
          📝 Raw Text
        </button>
      </div>
      
      <div className={`regulation-text ${showFullText ? 'raw' : 'formatted'}`}>
        {showFullText ? (
          <pre className="raw-text">{regulation.fullText}</pre>
        ) : (
          <div className="formatted-text">
            {regulation.fullText.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-paragraph">{paragraph}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="comparison-content">
      <div className="comparison-grid">
        <div className="comparison-panel">
          <h3 className="panel-title">📄 Original Text</h3>
          <div className="original-text">
            <div className="text-preview">
              {regulation.fullText.substring(0, 500)}...
              <button 
                className="expand-btn"
                onClick={() => setViewMode('full-text')}
              >
                View Full Text
              </button>
            </div>
          </div>
        </div>
        
        <div className="comparison-panel">
          <h3 className="panel-title">🤖 AI Analysis</h3>
          <div className="ai-analysis">
            {regulation.summary && (
              <div className="analysis-item">
                <h4>Summary</h4>
                <p>{regulation.summary}</p>
              </div>
            )}
            
            {regulation.insights && (
              <div className="analysis-item">
                <h4>Key Changes</h4>
                <p>{regulation.insights.whatChanged}</p>
              </div>
            )}
            
            <div className="analysis-item">
              <h4>Risk Assessment</h4>
              <div className="risk-display">
                <RiskIndicator
                  score={regulation.riskScore || 0}
                  priority={regulation.priority || 'low'}
                  size="medium"
                  showLabel={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActions = () => (
    <div className="actions-content">
      {/* Create New Action */}
      <div className="create-action-section">
        <h3 className="section-title">➕ Create New Action</h3>
        <div className="create-action-form">
          <input
            type="text"
            placeholder="Action title..."
            value={newActionTitle}
            onChange={(e) => setNewActionTitle(e.target.value)}
            className="action-input"
          />
          <textarea
            placeholder="Action description..."
            value={newActionDescription}
            onChange={(e) => setNewActionDescription(e.target.value)}
            className="action-textarea"
            rows={3}
          />
          <div className="form-row">
            <select
              value={selectedAssignee}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className="assignee-select"
            >
              <option value="">Assign to...</option>
              <option value="compliance-team">Compliance Team</option>
              <option value="legal-team">Legal Team</option>
              <option value="operations-team">Operations Team</option>
              <option value="management">Management</option>
            </select>
            <button
              onClick={handleCreateAction}
              disabled={!newActionTitle.trim()}
              className="create-action-btn"
            >
              Create Action
            </button>
          </div>
        </div>
      </div>

      {/* Existing Actions */}
      <div className="existing-actions-section">
        <h3 className="section-title">📋 Action Items ({actionItems.length})</h3>
        <div className="actions-list">
          {actionItems.length > 0 ? (
            actionItems.map(action => (
              <ActionItem
                key={action.id}
                {...action}
                onStatusChange={(actionId, status) => handleActionStatusChange(actionId, status)}
              />
            ))
          ) : (
            <div className="empty-actions">
              <div className="empty-icon">📝</div>
              <p>No action items yet</p>
              <small>Create actions above or they'll be generated from the compliance checklist</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="regulation-detail-view">
      {/* Header */}
      <div className="detail-header">
        <div className="header-top">
          <button className="back-btn" onClick={onBack}>
            ← Back to List
          </button>
          <div className="header-actions">
            <select
              value={regulation.status}
              onChange={(e) => handleStatusChange(e.target.value as Regulation['status'])}
              className="status-select"
              style={{ color: getStatusColor(regulation.status) }}
            >
              <option value="new">New</option>
              <option value="analyzed">Analyzed</option>
              <option value="reviewed">Reviewed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        
        <div className="header-content">
          <div className="title-section">
            <h1 className="regulation-title">{regulation.title}</h1>
            <div className="regulation-meta">
              <span className="meta-item">
                <strong>Source:</strong> {regulation.source}
              </span>
              <span className="meta-item">
                <strong>Date:</strong> {formatDate(regulation.date)}
              </span>
              <span className="meta-item">
                <strong>Scraped:</strong> {formatDate(regulation.scrapedAt)}
              </span>
              {regulation.assignedTo && (
                <span className="meta-item">
                  <strong>Assigned to:</strong> {regulation.assignedTo}
                </span>
              )}
            </div>
          </div>
          
          <div className="risk-section">
            <RiskIndicator
              score={regulation.riskScore || 0}
              priority={regulation.priority || 'low'}
              size="large"
              showLabel={true}
              animated={true}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="view-tabs">
        <button
          className={`tab-btn ${viewMode === 'overview' ? 'active' : ''}`}
          onClick={() => setViewMode('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-btn ${viewMode === 'full-text' ? 'active' : ''}`}
          onClick={() => setViewMode('full-text')}
        >
          📄 Full Text
        </button>
        <button
          className={`tab-btn ${viewMode === 'comparison' ? 'active' : ''}`}
          onClick={() => setViewMode('comparison')}
        >
          🔍 Comparison
        </button>
        <button
          className={`tab-btn ${viewMode === 'actions' ? 'active' : ''}`}
          onClick={() => setViewMode('actions')}
        >
          ✅ Actions ({actionItems.length})
        </button>
      </div>

      {/* Content */}
      <div className="detail-content">
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'full-text' && renderFullText()}
        {viewMode === 'comparison' && renderComparison()}
        {viewMode === 'actions' && renderActions()}
      </div>

      {/* Inline Styles */}
      <style>{`
        .regulation-detail-view {
          max-width: 1200px;
          margin: 0 auto;
        }

        .regulation-detail-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
        }

        .detail-header {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .back-btn {
          background: none;
          border: none;
          color: #3182ce;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.875rem;
          padding: 0.5rem 0;
        }

        .back-btn:hover {
          color: #2c5282;
          text-decoration: underline;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .status-select {
          padding: 0.5rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-weight: 600;
          text-transform: capitalize;
          background: white;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
        }

        .title-section {
          flex: 1;
        }

        .regulation-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 1rem 0;
          line-height: 1.3;
        }

        .regulation-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          font-size: 0.875rem;
          color: #718096;
        }

        .meta-item strong {
          color: #4a5568;
        }

        .risk-section {
          flex-shrink: 0;
        }

        .view-tabs {
          display: flex;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.5rem;
          margin-bottom: 1.5rem;
          gap: 0.25rem;
        }

        .tab-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: 0.5rem;
          font-weight: 500;
          color: #718096;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: #f7fafc;
          color: #4a5568;
        }

        .tab-btn.active {
          background: #3182ce;
          color: white;
        }

        .detail-content {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 2rem;
        }

        /* Overview Styles */
        .overview-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .summary-section {
          padding: 1.5rem;
          background: #f7fafc;
          border-radius: 0.75rem;
          border-left: 4px solid #3182ce;
        }

        .summary-text {
          font-size: 1.125rem;
          line-height: 1.7;
          color: #2d3748;
          margin: 0;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .insight-card {
          background: #f7fafc;
          border-radius: 0.75rem;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .insight-card.full-width {
          grid-column: 1 / -1;
        }

        .insight-title {
          font-size: 1rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 0.75rem 0;
        }

        .insight-content {
          color: #4a5568;
          line-height: 1.6;
          margin: 0;
        }

        .impact-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .impact-tag {
          background: #bee3f8;
          color: #2b6cb0;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .actions-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .action-item {
          padding: 0.75rem 0;
          border-bottom: 1px solid #e2e8f0;
          color: #4a5568;
          line-height: 1.5;
        }

        .action-item:last-child {
          border-bottom: none;
        }

        .checklist-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .checklist-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f7fafc;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }

        .checklist-item input[type="checkbox"] {
          margin: 0;
          transform: scale(1.2);
        }

        .checklist-item label {
          flex: 1;
          color: #4a5568;
          line-height: 1.5;
          cursor: pointer;
        }

        /* Full Text Styles */
        .text-controls {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .text-view-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .text-view-btn:hover {
          background: #f7fafc;
        }

        .text-view-btn.active {
          background: #3182ce;
          color: white;
          border-color: #3182ce;
        }

        .regulation-text {
          max-height: 600px;
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .raw-text {
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          color: #2d3748;
          white-space: pre-wrap;
          margin: 0;
        }

        .formatted-text {
          font-size: 1rem;
          line-height: 1.7;
          color: #2d3748;
        }

        .text-paragraph {
          margin: 0 0 1rem 0;
        }

        .text-paragraph:last-child {
          margin-bottom: 0;
        }

        /* Comparison Styles */
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .comparison-panel {
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .panel-title {
          background: #f7fafc;
          padding: 1rem 1.5rem;
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #2d3748;
          border-bottom: 1px solid #e2e8f0;
        }

        .original-text,
        .ai-analysis {
          padding: 1.5rem;
          height: 400px;
          overflow-y: auto;
        }

        .text-preview {
          color: #4a5568;
          line-height: 1.6;
        }

        .expand-btn {
          display: block;
          margin-top: 1rem;
          background: none;
          border: none;
          color: #3182ce;
          cursor: pointer;
          font-weight: 500;
        }

        .expand-btn:hover {
          text-decoration: underline;
        }

        .analysis-item {
          margin-bottom: 1.5rem;
        }

        .analysis-item:last-child {
          margin-bottom: 0;
        }

        .analysis-item h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 0.5rem 0;
        }

        .analysis-item p {
          color: #4a5568;
          line-height: 1.6;
          margin: 0;
        }

        .risk-display {
          display: flex;
          justify-content: flex-start;
          margin-top: 0.5rem;
        }

        /* Actions Styles */
        .actions-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .create-action-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: #f7fafc;
          padding: 1.5rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
        }

        .action-input,
        .action-textarea {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 1rem;
          background: white;
        }

        .action-input:focus,
        .action-textarea:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .form-row {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .assignee-select {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          background: white;
        }

        .create-action-btn {
          background: #3182ce;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
        }

        .create-action-btn:hover:not(:disabled) {
          background: #2c5282;
        }

        .create-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-actions {
          text-align: center;
          padding: 3rem;
          color: #718096;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-actions p {
          margin: 0 0 0.5rem 0;
        }

        .empty-actions small {
          font-size: 0.875rem;
          color: #a0aec0;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
          }

          .regulation-meta {
            flex-direction: column;
            gap: 0.5rem;
          }

          .view-tabs {
            flex-direction: column;
          }

          .insights-grid {
            grid-template-columns: 1fr;
          }

          .comparison-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default RegulationDetailView;