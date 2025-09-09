/**
 * Simple API Server for Dashboard Integration
 * Provides REST endpoints for the Lovable dashboard to consume data
 */

import express from 'express';
import cors from 'cors';
import { IntegrationService } from '../integration';
import { Regulation } from '../types';

export class APIServer {
  private app: express.Application;
  private integrationService: IntegrationService;
  private server: any;

  constructor(port: number = 3001) {
    this.app = express();
    this.integrationService = new IntegrationService({
      demoMode: true,
      enableRealTimeUpdates: true
    });

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[API] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const status = await this.integrationService.getSystemStatus();
        res.json({
          status: 'healthy',
          timestamp: new Date(),
          services: status
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get all regulations
    this.app.get('/api/regulations', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 20;
        const dashboardData = await this.integrationService.getDashboardData();
        
        res.json({
          regulations: dashboardData.regulations.slice(0, limit),
          totalCount: dashboardData.regulations.length,
          highPriorityCount: dashboardData.highPriorityCount,
          totalActionItems: dashboardData.totalActionItems
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to fetch regulations'
        });
      }
    });

    // Get regulation by ID
    this.app.get('/api/regulations/:id', async (req, res) => {
      try {
        const regulation = await this.integrationService.getRegulation(req.params.id);
        
        if (!regulation) {
          return res.status(404).json({ error: 'Regulation not found' });
        }

        res.json(regulation);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to fetch regulation'
        });
      }
    });

    // Get high priority regulations
    this.app.get('/api/regulations/priority/high', async (req, res) => {
      try {
        const dashboardData = await this.integrationService.getDashboardData();
        const highPriorityRegs = dashboardData.regulations.filter((reg: Regulation) => 
          reg.priority === 'high' || reg.priority === 'critical'
        );

        res.json({
          regulations: highPriorityRegs,
          count: highPriorityRegs.length
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to fetch high priority regulations'
        });
      }
    });

    // Run demo scenario
    this.app.post('/api/demo/run', async (req, res) => {
      try {
        const scenarioType = req.body.scenario || 'hackathon';
        
        console.log(`[API] Running ${scenarioType} demo scenario...`);
        await this.integrationService.runDemoScenario(scenarioType);
        
        res.json({
          message: `${scenarioType} demo scenario completed successfully`,
          timestamp: new Date()
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Demo scenario failed'
        });
      }
    });

    // Start real-time updates
    this.app.post('/api/realtime/start', async (req, res) => {
      try {
        await this.integrationService.startRealTimeDemo();
        
        res.json({
          message: 'Real-time updates started',
          timestamp: new Date()
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to start real-time updates'
        });
      }
    });

    // Dashboard data endpoint
    this.app.get('/api/dashboard', async (req, res) => {
      try {
        const dashboardData = await this.integrationService.getDashboardData();
        res.json(dashboardData);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to fetch dashboard data'
        });
      }
    });

    // Error handling middleware
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('[API] Unhandled error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
      });
    });
  }

  /**
   * Start the API server
   */
  async start(port: number = 3001): Promise<void> {
    try {
      // Initialize integration service
      await this.integrationService.initialize();
      console.log('[API] ✅ Integration service initialized');

      // Start Express server
      this.server = this.app.listen(port, () => {
        console.log(`[API] 🚀 Server running on http://localhost:${port}`);
        console.log('[API] 📊 Dashboard API endpoints available:');
        console.log('[API]   GET  /health - System health check');
        console.log('[API]   GET  /api/regulations - All regulations');
        console.log('[API]   GET  /api/regulations/:id - Specific regulation');
        console.log('[API]   GET  /api/regulations/priority/high - High priority regulations');
        console.log('[API]   GET  /api/dashboard - Dashboard data');
        console.log('[API]   POST /api/demo/run - Run demo scenario');
        console.log('[API]   POST /api/realtime/start - Start real-time updates');
      });
    } catch (error) {
      console.error('[API] ❌ Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Stop the API server
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      console.log('[API] 🛑 Server stopped');
    }

    await this.integrationService.shutdown();
    console.log('[API] ✅ Integration service shutdown complete');
  }
}

/**
 * Create and start API server if run directly
 */
if (require.main === module) {
  const server = new APIServer();
  
  server.start(3001).catch(error => {
    console.error('Failed to start API server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[API] Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
}

export default APIServer;