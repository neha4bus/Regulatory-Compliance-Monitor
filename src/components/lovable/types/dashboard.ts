/**
 * TypeScript interfaces for Lovable Dashboard
 */

import { Regulation, WorkflowState } from '../../../types';

export interface DashboardProps {
  className?: string;
  theme?: 'light' | 'dark';
  initialView?: DashboardView;
}

export type DashboardView = 
  | 'home' 
  | 'regulations' 
  | 'actions' 
  | 'history' 
  | 'admin';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  active?: boolean;
}

export interface RegulationCardProps {
  regulation: Regulation;
  onClick?: (regulation: Regulation) => void;
  onActionClick?: (regulation: Regulation, action: string) => void;
  compact?: boolean;
  showActions?: boolean;
}

export interface ActionItemProps {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignee?: string;
  dueDate?: Date;
  regulationId?: string;
  onClick?: (actionId: string) => void;
  onStatusChange?: (actionId: string, status: ActionItemProps['status']) => void;
}

export interface RiskIndicatorProps {
  score: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animated?: boolean;
}

export interface DashboardState {
  regulations: Regulation[];
  actions: ActionItemProps[];
  loading: boolean;
  error: string | null;
  currentView: DashboardView;
  filters: DashboardFilters;
  selectedRegulation: Regulation | null;
}

export interface DashboardFilters {
  priority?: ('low' | 'medium' | 'high' | 'critical')[];
  status?: string[];
  source?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface DashboardStats {
  totalRegulations: number;
  pendingActions: number;
  highPriorityItems: number;
  completedThisWeek: number;
  averageRiskScore: number;
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  navigation?: NavigationItem[];
  currentView?: DashboardView;
  onViewChange?: (view: DashboardView) => void;
  stats?: DashboardStats;
  loading?: boolean;
}

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    light: string;
    dark: string;
  };
  breakpoints: ResponsiveBreakpoints;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface DashboardHookResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface RegulationListProps {
  regulations: Regulation[];
  loading?: boolean;
  onRegulationClick?: (regulation: Regulation) => void;
  filters?: DashboardFilters;
  onFiltersChange?: (filters: DashboardFilters) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export interface ActionListProps {
  actions: ActionItemProps[];
  loading?: boolean;
  onActionClick?: (action: ActionItemProps) => void;
  onStatusChange?: (actionId: string, status: ActionItemProps['status']) => void;
  groupBy?: 'priority' | 'status' | 'assignee' | 'dueDate';
}