# Senso MCP Server Integration Setup

This document explains how to configure and use the Senso MCP server for workflow orchestration in the AI Regulatory Compliance Monitor.

## MCP Configuration

Add the following configuration to your `.kiro/settings/mcp.json` file:

```json
{
  "mcpServers": {
    "senso": {
      "command": "uvx",
      "args": ["senso-mcp-server@latest"],
      "env": {
        "SENSO_LOG_LEVEL": "INFO",
        "SENSO_WORKSPACE": ".",
        "SENSO_CONFIG_PATH": "./.senso/config.yaml"
      },
      "disabled": false,
      "autoApprove": [
        "workflow_create",
        "workflow_execute", 
        "workflow_status",
        "workflow_list",
        "workflow_delete",
        "trigger_create",
        "trigger_execute"
      ]
    }
  }
}
```

## Senso Workflow Configuration

Create a `.senso/config.yaml` file in your project root:

```yaml
# Senso Workflow Configuration for AI Regulatory Compliance Monitor

workflows:
  regulatory_processing:
    name: "Regulatory Processing Pipeline"
    description: "Complete pipeline for processing new regulatory documents"
    trigger:
      type: "event"
      event: "new_regulation_detected"
    
    steps:
      - name: "validate_data"
        description: "Validate incoming regulation data"
        tool: "data_validator"
        params:
          schema: "regulation_schema"
          required_fields: ["id", "title", "fullText", "source", "date"]
        on_error: "retry"
        retry:
          attempts: 2
          delay: 1000

      - name: "store_regulation"
        description: "Store regulation in Redis cache"
        tool: "redis_storage"
        params:
          operation: "save_regulation"
          check_duplicates: true
        depends_on: ["validate_data"]

      - name: "ai_analysis"
        description: "Analyze regulation with Qodo AI"
        tool: "qodo_analyzer"
        params:
          analysis_type: "regulatory_compliance"
          industry: "oil_and_gas"
          output_format:
            summary: true
            risk_score: true
            action_items: true
            affected_parties: true
        depends_on: ["store_regulation"]
        retry:
          attempts: 3
          delay: 2000
          backoff: "exponential"

      - name: "risk_assessment"
        description: "Calculate risk score and priority"
        tool: "risk_calculator"
        params:
          industry: "oil_and_gas"
          factors: ["compliance_deadline", "penalty_severity", "operational_impact"]
        depends_on: ["ai_analysis"]

      - name: "update_storage"
        description: "Update regulation with AI insights"
        tool: "redis_storage"
        params:
          operation: "update_regulation"
          include_analysis: true
        depends_on: ["risk_assessment"]

      - name: "high_priority_check"
        description: "Check if regulation requires immediate attention"
        tool: "priority_filter"
        params:
          threshold: "high"
        depends_on: ["risk_assessment"]

      - name: "slack_notification"
        description: "Send Slack alert for high priority regulations"
        tool: "slack_notifier"
        params:
          channel: "#compliance-alerts"
          template: "high_priority_regulation"
          include_actions: true
        condition: "priority >= 'high'"
        depends_on: ["high_priority_check"]

      - name: "dashboard_update"
        description: "Trigger dashboard refresh"
        tool: "dashboard_refresh"
        params:
          update_type: "new_regulation"
          broadcast: true
        depends_on: ["update_storage"]

  compliance_reminder:
    name: "Compliance Deadline Reminder"
    description: "Send reminders for upcoming compliance deadlines"
    trigger:
      type: "schedule"
      cron: "0 9 * * MON"  # Every Monday at 9 AM
    
    steps:
      - name: "check_deadlines"
        description: "Find regulations with upcoming deadlines"
        tool: "deadline_checker"
        params:
          days_ahead: 30
          statuses: ["new", "analyzed"]

      - name: "send_reminders"
        description: "Send reminder notifications"
        tool: "slack_notifier"
        params:
          channel: "#compliance-reminders"
          template: "deadline_reminder"
        condition: "deadlines.length > 0"
        depends_on: ["check_deadlines"]

tools:
  data_validator:
    description: "Validates regulation data structure"
    type: "function"
    implementation: "src/tools/data-validator.js"

  redis_storage:
    description: "Redis storage operations"
    type: "function" 
    implementation: "src/tools/redis-storage.js"

  qodo_analyzer:
    description: "Qodo AI analysis integration"
    type: "function"
    implementation: "src/tools/qodo-analyzer.js"

  risk_calculator:
    description: "Risk assessment calculator"
    type: "function"
    implementation: "src/tools/risk-calculator.js"

  priority_filter:
    description: "Priority filtering logic"
    type: "function"
    implementation: "src/tools/priority-filter.js"

  slack_notifier:
    description: "Slack notification sender"
    type: "function"
    implementation: "src/tools/slack-notifier.js"

  dashboard_refresh:
    description: "Dashboard update trigger"
    type: "function"
    implementation: "src/tools/dashboard-refresh.js"

  deadline_checker:
    description: "Compliance deadline checker"
    type: "function"
    implementation: "src/tools/deadline-checker.js"
```

## Usage Examples

### Triggering Workflows via MCP

```javascript
// Trigger the regulatory processing workflow
const result = await senso.workflow_execute({
  workflow_name: "regulatory_processing",
  input_data: {
    regulation: {
      id: "epa-2025-001",
      title: "New Offshore Drilling Standards",
      fullText: "...",
      source: "EPA",
      date: "2025-01-08"
    }
  }
});

// Check workflow status
const status = await senso.workflow_status({
  workflow_id: result.workflow_id
});

// List all available workflows
const workflows = await senso.workflow_list();
```

### Creating Custom Workflows

```javascript
// Create a new workflow for emergency regulations
await senso.workflow_create({
  name: "emergency_regulation_handler",
  description: "Fast-track processing for emergency regulations",
  trigger: {
    type: "event",
    event: "emergency_regulation_detected"
  },
  steps: [
    {
      name: "immediate_analysis",
      tool: "qodo_analyzer",
      params: { priority: "emergency" }
    },
    {
      name: "urgent_notification",
      tool: "slack_notifier", 
      params: { 
        channel: "#emergency-compliance",
        mention: "@channel"
      }
    }
  ]
});
```

## Integration with Existing Components

The Senso MCP server integrates seamlessly with the existing components:

1. **Redis Integration**: Workflows can read from and write to Redis using the `redis_storage` tool
2. **Qodo AI Integration**: The `qodo_analyzer` tool handles AI analysis requests
3. **Slack Integration**: The `slack_notifier` tool sends notifications
4. **Dashboard Integration**: The `dashboard_refresh` tool triggers UI updates

## Benefits of Using Senso MCP

1. **Declarative Workflows**: Define complex workflows in YAML without custom code
2. **Built-in Error Handling**: Automatic retry logic and error recovery
3. **State Management**: Workflow state is automatically tracked and persisted
4. **Event-Driven**: Trigger workflows based on events or schedules
5. **Tool Ecosystem**: Reusable tools that can be shared across workflows
6. **Monitoring**: Built-in workflow monitoring and logging
7. **MCP Integration**: Seamless integration with Kiro's MCP ecosystem

## Testing Workflows

```javascript
// Test a workflow with sample data
await senso.workflow_execute({
  workflow_name: "regulatory_processing",
  input_data: {
    regulation: {
      id: "test-001",
      title: "Test Regulation",
      fullText: "This is a test regulation for workflow validation.",
      source: "TEST",
      date: "2025-01-08"
    }
  },
  dry_run: true  // Don't actually execute, just validate
});
```

This setup provides a robust, scalable workflow orchestration system that leverages the power of MCP while maintaining the flexibility to customize workflows for specific regulatory compliance needs.