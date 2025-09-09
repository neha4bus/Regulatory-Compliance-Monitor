// Senso MCP workflow orchestration
export * from './mcp-integration';

import { SensoMCPIntegration, SensoMCPConfig } from './mcp-integration';

export class SensoService {
  private mcpIntegration: SensoMCPIntegration;

  constructor(config: SensoMCPConfig = {}) {
    this.mcpIntegration = new SensoMCPIntegration(config);
  }

  /**
   * Get MCP integration instance
   */
  getMCPIntegration(): SensoMCPIntegration {
    return this.mcpIntegration;
  }

  /**
   * Test service connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; version?: string }> {
    return await this.mcpIntegration.testConnection();
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<any> {
    return await this.mcpIntegration.getWorkflowStats();
  }
}