/**
 * Regulation Service - Handles data retrieval and management for the dashboard
 */

import { Regulation } from '../../../types';
import { DashboardFilters } from '../types/dashboard';
import { RegulationStorage } from '../../redis/storage';
import { RedisConnection } from '../../redis/config';

export interface RegulationServiceOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'riskScore' | 'title' | 'source';
  sortDirection?: 'asc' | 'desc';
}

export interface RegulationSearchResult {
  regulations: Regulation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class RegulationService {
  private storage: RegulationStorage;
  private redis: RedisConnection;

  constructor() {
    this.redis = new RedisConnection({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
    this.storage = new RegulationStorage(this.redis);
  }

  /**
   * Initialize the service and connect to Redis
   */
  async initialize(): Promise<void> {
    await this.redis.connect();
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }

  /**
   * Get regulations with filtering, sorting, and pagination
   */
  async getRegulations(
    filters: DashboardFilters = {},
    options: RegulationServiceOptions = {}
  ): Promise<RegulationSearchResult> {
    try {
      const {
        limit = 25,
        offset = 0,
        sortBy = 'date',
        sortDirection = 'desc'
      } = options;

      // Get all regulations from Redis
      let regulations = await this.storage.getAllRegulations();

      // Apply filters
      regulations = this.applyFilters(regulations, filters);

      // Apply sorting
      regulations = this.applySorting(regulations, sortBy, sortDirection);

      // Calculate pagination
      const total = regulations.length;
      const totalPages = Math.ceil(total / limit);
      const page = Math.floor(offset / limit) + 1;

      // Apply pagination
      const paginatedRegulations = regulations.slice(offset, offset + limit);

      return {
        regulations: paginatedRegulations,
        total,
        page,
        pageSize: limit,
        totalPages,
      };
    } catch (error) {
      console.error('Error fetching regulations:', error);
      throw new Error('Failed to fetch regulations');
    }
  }

  /**
   * Get a single regulation by ID
   */
  async getRegulation(id: string): Promise<Regulation | null> {
    try {
      return await this.storage.getRegulation(id);
    } catch (error) {
      console.error('Error fetching regulation:', error);
      return null;
    }
  }

  /**
   * Search regulations by text query
   */
  async searchRegulations(
    query: string,
    options: RegulationServiceOptions = {}
  ): Promise<RegulationSearchResult> {
    const filters: DashboardFilters = {
      searchQuery: query,
    };

    return this.getRegulations(filters, options);
  }

  /**
   * Get regulations by priority
   */
  async getRegulationsByPriority(
    priority: 'low' | 'medium' | 'high' | 'critical',
    options: RegulationServiceOptions = {}
  ): Promise<RegulationSearchResult> {
    const filters: DashboardFilters = {
      priority: [priority],
    };

    return this.getRegulations(filters, options);
  }

  /**
   * Get regulations by source
   */
  async getRegulationsBySource(
    source: string,
    options: RegulationServiceOptions = {}
  ): Promise<RegulationSearchResult> {
    const filters: DashboardFilters = {
      source: [source],
    };

    return this.getRegulations(filters, options);
  }

  /**
   * Get recent regulations (last 30 days)
   */
  async getRecentRegulations(
    options: RegulationServiceOptions = {}
  ): Promise<RegulationSearchResult> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filters: DashboardFilters = {
      dateRange: {
        start: thirtyDaysAgo,
        end: new Date(),
      },
    };

    return this.getRegulations(filters, options);
  }

  /**
   * Get high-priority regulations
   */
  async getHighPriorityRegulations(
    options: RegulationServiceOptions = {}
  ): Promise<RegulationSearchResult> {
    const filters: DashboardFilters = {
      priority: ['high', 'critical'],
    };

    return this.getRegulations(filters, options);
  }

  /**
   * Get regulation statistics
   */
  async getRegulationStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    bySource: Record<string, number>;
    averageRiskScore: number;
    recentCount: number;
  }> {
    try {
      const regulations = await this.storage.getAllRegulations();

      const stats = {
        total: regulations.length,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
        averageRiskScore: 0,
        recentCount: 0,
      };

      let totalRiskScore = 0;
      let riskScoreCount = 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      regulations.forEach(regulation => {
        // Count by status
        stats.byStatus[regulation.status] = (stats.byStatus[regulation.status] || 0) + 1;

        // Count by priority
        const priority = regulation.priority || 'low';
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

        // Count by source
        stats.bySource[regulation.source] = (stats.bySource[regulation.source] || 0) + 1;

        // Calculate average risk score
        if (regulation.riskScore !== undefined) {
          totalRiskScore += regulation.riskScore;
          riskScoreCount++;
        }

        // Count recent regulations
        if (regulation.date >= thirtyDaysAgo) {
          stats.recentCount++;
        }
      });

      stats.averageRiskScore = riskScoreCount > 0 ? totalRiskScore / riskScoreCount : 0;

      return stats;
    } catch (error) {
      console.error('Error fetching regulation stats:', error);
      throw new Error('Failed to fetch regulation statistics');
    }
  }

  /**
   * Get available filter options
   */
  async getFilterOptions(): Promise<{
    sources: string[];
    priorities: string[];
    statuses: string[];
  }> {
    try {
      const regulations = await this.storage.getAllRegulations();

      const sources = new Set<string>();
      const priorities = new Set<string>();
      const statuses = new Set<string>();

      regulations.forEach(regulation => {
        sources.add(regulation.source);
        priorities.add(regulation.priority || 'low');
        statuses.add(regulation.status);
      });

      return {
        sources: Array.from(sources).sort(),
        priorities: Array.from(priorities).sort(),
        statuses: Array.from(statuses).sort(),
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        sources: [],
        priorities: [],
        statuses: [],
      };
    }
  }

  /**
   * Apply filters to regulations array
   */
  private applyFilters(regulations: Regulation[], filters: DashboardFilters): Regulation[] {
    let filtered = [...regulations];

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(reg =>
        reg.title?.toLowerCase().includes(query) ||
        reg.summary?.toLowerCase().includes(query) ||
        reg.source.toLowerCase().includes(query) ||
        reg.fullText.toLowerCase().includes(query)
      );
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(reg => 
        filters.priority!.includes(reg.priority || 'low')
      );
    }

    // Source filter
    if (filters.source && filters.source.length > 0) {
      filtered = filtered.filter(reg => 
        filters.source!.includes(reg.source)
      );
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(reg => 
        filters.status!.includes(reg.status)
      );
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(reg => {
        const regDate = new Date(reg.date);
        return regDate >= filters.dateRange!.start && regDate <= filters.dateRange!.end;
      });
    }

    return filtered;
  }

  /**
   * Apply sorting to regulations array
   */
  private applySorting(
    regulations: Regulation[],
    sortBy: string,
    sortDirection: 'asc' | 'desc'
  ): Regulation[] {
    return regulations.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'riskScore':
          aValue = a.riskScore || 0;
          bValue = b.riskScore || 0;
          break;
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'source':
          aValue = a.source.toLowerCase();
          bValue = b.source.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }

  /**
   * Update regulation status
   */
  async updateRegulationStatus(
    id: string,
    status: Regulation['status']
  ): Promise<Regulation | null> {
    try {
      return await this.storage.updateRegulation(id, { status });
    } catch (error) {
      console.error('Error updating regulation status:', error);
      return null;
    }
  }

  /**
   * Assign regulation to user
   */
  async assignRegulation(
    id: string,
    assignedTo: string
  ): Promise<Regulation | null> {
    try {
      return await this.storage.updateRegulation(id, { assignedTo });
    } catch (error) {
      console.error('Error assigning regulation:', error);
      return null;
    }
  }

  /**
   * Mark regulation as reviewed
   */
  async markAsReviewed(id: string): Promise<Regulation | null> {
    try {
      return await this.storage.updateRegulation(id, {
        status: 'reviewed',
        reviewedAt: new Date(),
      });
    } catch (error) {
      console.error('Error marking regulation as reviewed:', error);
      return null;
    }
  }
}

// Singleton instance for use across the application
export const regulationService = new RegulationService();