/**
 * Real-time Updates System
 * Provides live updates to the dashboard and other components
 */

import { EventEmitter } from 'events';
import { Regulation } from '../types';

export interface UpdateEvent {
  type: 'regulation_added' | 'regulation_updated' | 'high_priority_alert' | 'system_status';
  timestamp: Date;
  data: any;
}

export interface DashboardUpdate {
  regulations: Regulation[];
  highPriorityCount: number;
  totalActionItems: number;
  systemStatus: {
    redis: boolean;
    qodo: boolean;
    overall: boolean;
  };
}

export class RealTimeUpdateManager extends EventEmitter {
  private connectedClients: Set<any> = new Set();
  private updateQueue: UpdateEvent[] = [];
  private isProcessing: boolean = false;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for different types of updates
   */
  private setupEventHandlers(): void {
    // Handle regulation processing events
    this.on('regulation_processed', (regulation: Regulation) => {
      this.queueUpdate({
        type: 'regulation_added',
        timestamp: new Date(),
        data: regulation
      });
    });

    // Handle high priority alerts
    this.on('high_priority_alert', (regulation: Regulation) => {
      this.queueUpdate({
        type: 'high_priority_alert',
        timestamp: new Date(),
        data: {
          regulation,
          message: `High priority regulation detected: ${regulation.title}`,
          riskScore: regulation.riskScore,
          priority: regulation.priority
        }
      });
    });

    // Handle system status updates
    this.on('system_status_change', (status: any) => {
      this.queueUpdate({
        type: 'system_status',
        timestamp: new Date(),
        data: status
      });
    });
  }

  /**
   * Queue an update for processing
   */
  private queueUpdate(update: UpdateEvent): void {
    this.updateQueue.push(update);
    this.processQueue();
  }

  /**
   * Process queued updates
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.updateQueue.length > 0) {
        const update = this.updateQueue.shift();
        if (update) {
          await this.broadcastUpdate(update);
        }
      }
    } catch (error) {
      console.error('[RealTime] Error processing update queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Broadcast update to all connected clients
   */
  private async broadcastUpdate(update: UpdateEvent): Promise<void> {
    console.log(`[RealTime] Broadcasting ${update.type} to ${this.connectedClients.size} clients`);

    // In a real implementation, this would send updates via WebSocket, SSE, or polling
    // For demo purposes, we'll emit events that can be caught by the dashboard
    this.emit('dashboard_update', update);

    // Simulate network delay for realistic demo
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Register a client for real-time updates
   */
  registerClient(clientId: string): void {
    console.log(`[RealTime] Client ${clientId} connected`);
    this.connectedClients.add(clientId);
    
    // Send initial status to new client
    this.emit('client_connected', clientId);
  }

  /**
   * Unregister a client
   */
  unregisterClient(clientId: string): void {
    console.log(`[RealTime] Client ${clientId} disconnected`);
    this.connectedClients.delete(clientId);
  }

  /**
   * Get current dashboard state for new clients
   */
  async getCurrentDashboardState(regulations: Regulation[]): Promise<DashboardUpdate> {
    const highPriorityRegulations = regulations.filter(reg => 
      reg.priority === 'high' || reg.priority === 'critical'
    );

    const totalActionItems = regulations.reduce((total, reg) => {
      return total + (reg.complianceChecklist?.length || 0);
    }, 0);

    return {
      regulations: regulations.slice(0, 20), // Latest 20 regulations
      highPriorityCount: highPriorityRegulations.length,
      totalActionItems,
      systemStatus: {
        redis: true, // This would be checked dynamically
        qodo: true,
        overall: true
      }
    };
  }

  /**
   * Simulate real-time updates for demo purposes
   */
  startDemoUpdates(regulations: Regulation[]): void {
    console.log('[RealTime] Starting demo update simulation...');

    let currentIndex = 0;
    const updateInterval = setInterval(() => {
      if (currentIndex >= regulations.length) {
        clearInterval(updateInterval);
        console.log('[RealTime] Demo updates completed');
        return;
      }

      const regulation = regulations[currentIndex];
      
      // Simulate processing delay
      setTimeout(() => {
        this.emit('regulation_processed', regulation);
        
        // Check if it's high priority
        if (regulation.priority === 'high' || regulation.priority === 'critical') {
          setTimeout(() => {
            this.emit('high_priority_alert', regulation);
          }, 500);
        }
      }, 1000);

      currentIndex++;
    }, 3000); // New regulation every 3 seconds
  }

  /**
   * Create a dashboard update notification
   */
  createDashboardNotification(regulation: Regulation): any {
    return {
      id: `notification_${regulation.id}`,
      title: 'New Regulation Processed',
      message: `${regulation.title} has been analyzed and is ready for review`,
      type: regulation.priority === 'high' || regulation.priority === 'critical' ? 'alert' : 'info',
      timestamp: new Date(),
      regulation: {
        id: regulation.id,
        title: regulation.title,
        riskScore: regulation.riskScore,
        priority: regulation.priority,
        source: regulation.source
      },
      actions: [
        {
          label: 'View Details',
          action: 'view_regulation',
          regulationId: regulation.id
        },
        {
          label: 'Mark Reviewed',
          action: 'mark_reviewed',
          regulationId: regulation.id
        }
      ]
    };
  }

  /**
   * Get update statistics
   */
  getUpdateStats(): any {
    return {
      connectedClients: this.connectedClients.size,
      queuedUpdates: this.updateQueue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Clear all queued updates
   */
  clearQueue(): void {
    this.updateQueue = [];
    console.log('[RealTime] Update queue cleared');
  }

  /**
   * Shutdown the update manager
   */
  shutdown(): void {
    this.clearQueue();
    this.connectedClients.clear();
    this.removeAllListeners();
    console.log('[RealTime] Update manager shutdown complete');
  }
}