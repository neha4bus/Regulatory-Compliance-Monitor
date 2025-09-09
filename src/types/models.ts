/**
 * Core data models for AI Regulatory Compliance Monitor
 */

export interface Regulation {
  id: string;
  title: string;
  date: Date;
  url: string;
  fullText: string;
  source: string;
  scrapedAt: Date;
  hash: string;
  
  // AI Analysis Results
  summary?: string;
  riskScore?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  insights?: {
    whatChanged: string;
    whoImpacted: string[];
    requiredActions: string[];
  };
  complianceChecklist?: string[];
  
  // Tracking
  status: 'new' | 'analyzed' | 'reviewed' | 'archived';
  assignedTo?: string;
  reviewedAt?: Date;
}

export interface WorkflowState {
  regulationId: string;
  currentStep: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  errors?: string[];
  retryCount: number;
}

export interface ApifyScrapedData {
  id: string;
  title: string;
  date: string;
  url: string;
  fullText: string;
  source: string;
  scrapedAt: string;
}

export interface QodoAnalysisRequest {
  text: string;
  analysis_type: 'regulatory_compliance';
  industry: 'oil_and_gas';
  output_format: {
    summary: boolean;
    risk_score: boolean;
    action_items: boolean;
    affected_parties: boolean;
  };
}

export interface QodoAnalysisResponse {
  summary: string;
  risk_score: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  insights: {
    what_changed: string;
    who_impacted: string;
    required_actions: string[];
  };
  compliance_checklist: string[];
}

export interface ActionItem {
  id: string;
  regulationId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedTo?: string;
  assignedBy?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags: string[];
  category: 'compliance' | 'implementation' | 'review' | 'training' | 'reporting';
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
  attachments?: string[];
  dependencies?: string[]; // Other action item IDs
}

export interface ActionItemFilter {
  status?: ActionItem['status'][];
  priority?: ActionItem['priority'][];
  assignedTo?: string[];
  category?: ActionItem['category'][];
  regulationId?: string;
  dueDateRange?: {
    start?: Date;
    end?: Date;
  };
  tags?: string[];
}

export interface ActionItemStats {
  total: number;
  byStatus: Record<ActionItem['status'], number>;
  byPriority: Record<ActionItem['priority'], number>;
  byCategory: Record<ActionItem['category'], number>;
  overdue: number;
  dueSoon: number; // Due within 7 days
}