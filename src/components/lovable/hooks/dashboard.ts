/**
 * Custom React hooks for dashboard state management
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  DashboardState, 
  DashboardFilters, 
  DashboardHookResult,
  ActionItemProps 
} from '../types/dashboard';
import { Regulation } from '../../../types';
import { regulationService, RegulationServiceOptions } from '../services/regulationService';

// Mock actions data (actions will be implemented in a separate task)
const MOCK_ACTIONS: ActionItemProps[] = [
  {
    id: 'action-001',
    title: 'Install Emission Monitoring Equipment',
    description: 'Install continuous emission monitoring systems on all offshore platforms within 90 days.',
    priority: 'critical',
    status: 'pending',
    assignee: 'John Smith',
    dueDate: new Date('2025-04-01'),
    regulationId: 'reg-001',
  },
  {
    id: 'action-002',
    title: 'Update Pipeline Safety Procedures',
    description: 'Review and update all pipeline safety procedures according to new PHMSA requirements.',
    priority: 'high',
    status: 'in_progress',
    assignee: 'Sarah Johnson',
    dueDate: new Date('2025-03-15'),
    regulationId: 'reg-002',
  },
  {
    id: 'action-003',
    title: 'Conduct Staff Training',
    description: 'Train all relevant personnel on new emission monitoring procedures.',
    priority: 'medium',
    status: 'pending',
    assignee: 'Mike Davis',
    dueDate: new Date('2025-03-30'),
    regulationId: 'reg-001',
  },
];

/**
 * Main dashboard state hook
 */
export const useDashboardState = () => {
  const [state, setState] = useState<DashboardState>({
    regulations: [],
    actions: [],
    loading: false,
    error: null,
    currentView: 'home',
    filters: {},
    selectedRegulation: null,
  });

  const loadRegulations = useCallback(async (filters?: DashboardFilters, options?: RegulationServiceOptions) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await regulationService.initialize();
      const result = await regulationService.getRegulations(filters, options);
      
      setState(prev => ({
        ...prev,
        regulations: result.regulations,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load regulations',
        loading: false,
      }));
    }
  }, []);

  const loadActions = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate API call for actions (will be replaced with real service later)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setState(prev => ({
        ...prev,
        actions: MOCK_ACTIONS,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load actions',
        loading: false,
      }));
    }
  }, []);

  const updateFilters = useCallback((filters: DashboardFilters) => {
    setState(prev => ({ ...prev, filters }));
    // Reload regulations with new filters
    loadRegulations(filters);
  }, [loadRegulations]);

  const selectRegulation = useCallback((regulation: Regulation | null) => {
    setState(prev => ({ ...prev, selectedRegulation: regulation }));
  }, []);

  const updateActionStatus = useCallback((actionId: string, status: ActionItemProps['status']) => {
    setState(prev => ({
      ...prev,
      actions: prev.actions.map(action =>
        action.id === actionId ? { ...action, status } : action
      ),
    }));
  }, []);

  const setCurrentView = useCallback((view: DashboardState['currentView']) => {
    setState(prev => ({ ...prev, currentView: view }));
  }, []);

  const actions = {
    loadRegulations,
    loadActions,
    updateFilters,
    selectRegulation,
    updateActionStatus,
    setCurrentView,
  };

  return { state, actions };
};

/**
 * Hook for regulations data with pagination support
 */
export const useRegulations = (
  filters?: DashboardFilters, 
  options?: RegulationServiceOptions
): DashboardHookResult<Regulation[]> & { 
  total: number; 
  totalPages: number; 
  currentPage: number;
} => {
  const [data, setData] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await regulationService.initialize();
      const result = await regulationService.getRegulations(filters, options);
      
      setData(result.regulations);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setCurrentPage(result.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch regulations');
      setData([]);
      setTotal(0);
      setTotalPages(0);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, [filters, options]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch, total, totalPages, currentPage };
};

/**
 * Hook for actions data
 */
export const useActions = (filters?: { status?: string; priority?: string }): DashboardHookResult<ActionItemProps[]> => {
  const [data, setData] = useState<ActionItemProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let filteredData = MOCK_ACTIONS;
      
      if (filters) {
        if (filters.status) {
          filteredData = filteredData.filter(action => action.status === filters.status);
        }
        
        if (filters.priority) {
          filteredData = filteredData.filter(action => action.priority === filters.priority);
        }
      }
      
      setData(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch actions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
};

/**
 * Hook for dashboard statistics
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalRegulations: 0,
    pendingActions: 0,
    highPriorityItems: 0,
    completedThisWeek: 0,
    averageRiskScore: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    
    try {
      await regulationService.initialize();
      const regulationStats = await regulationService.getRegulationStats();
      
      // Get action stats from mock data (will be replaced with real service later)
      const pendingActions = MOCK_ACTIONS.filter(a => a.status === 'pending').length;
      const highPriorityItems = MOCK_ACTIONS.filter(a => 
        a.priority === 'high' || a.priority === 'critical'
      ).length;
      const completedThisWeek = MOCK_ACTIONS.filter(a => a.status === 'completed').length;
      
      setStats({
        totalRegulations: regulationStats.total,
        pendingActions,
        highPriorityItems,
        completedThisWeek,
        averageRiskScore: regulationStats.averageRiskScore,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Fallback to default values
      setStats({
        totalRegulations: 0,
        pendingActions: 0,
        highPriorityItems: 0,
        completedThisWeek: 0,
        averageRiskScore: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, refetch: loadStats };
};