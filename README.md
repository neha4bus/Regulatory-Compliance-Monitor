# AI Regulatory Compliance Monitor

🚀 **AI-powered regulatory compliance monitoring system for Oil & Gas industry**

A comprehensive solution that automatically monitors regulatory changes, analyzes their impact using AI, and provides actionable insights through an integrated dashboard with real-time notifications.

## 🎯 Overview

The AI Regulatory Compliance Monitor helps oil and gas companies stay ahead of regulatory changes by:

- **Automated Data Collection**: Scrapes regulatory sources using Apify
- **AI-Powered Analysis**: Uses Qodo AI to analyze regulatory text and assess impact
- **Smart Prioritization**: Automatically calculates risk scores and priority levels
- **Action Management**: Creates and tracks compliance action items
- **Real-time Notifications**: Sends Slack alerts for high-priority regulations
- **Workflow Orchestration**: Uses Senso MCP for automated end-to-end processing

## 🏗️ Architecture

```mermaid
graph TB
    A[Apify Scrapers] --> B[Redis Cache]
    B --> C[Senso MCP Orchestrator]
    C --> D[Qodo AI Analysis]
    D --> E[Action Management]
    E --> F[Lovable Dashboard]
    C --> G[Slack Notifications]
    
    subgraph "Data Flow"
        H[Regulatory Sources] --> A
        A --> I[Raw Data]
        I --> B
        B --> J[Processed Data]
    end
    
    subgraph "AI Processing"
        D --> K[Risk Scoring]
        D --> L[Priority Assignment]
        D --> M[Compliance Checklist]
    end
```

## ✨ Key Features

### 🤖 AI-Powered Analysis
- **Risk Scoring**: Automatic 1-10 risk assessment
- **Priority Classification**: Critical, High, Medium, Low
- **Impact Analysis**: Who's affected and what actions are required
- **Compliance Checklists**: Auto-generated action items

### 📊 Action Management Dashboard
- **Status Tracking**: Pending, In Progress, Completed, Blocked
- **Assignment Management**: Assign tasks to team members
- **Due Date Monitoring**: Track deadlines and overdue items
- **Advanced Filtering**: Filter by status, priority, assignee, category
- **Statistics Dashboard**: Real-time metrics and analytics

### 📱 Real-time Notifications
- **Slack Integration**: Rich formatted messages with action buttons
- **Priority-based Routing**: Different channels for different priorities
- **Deadline Reminders**: Automated compliance deadline alerts
- **System Health Monitoring**: Proactive system status notifications

### 🔄 Workflow Orchestration
- **Senso MCP Integration**: Professional workflow management
- **Event-driven Processing**: Automatic triggers for new regulations
- **Error Handling**: Built-in retry logic and failure recovery
- **Audit Trail**: Complete workflow execution history

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker (for Redis)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/regulatory-compliance-monitor.git
cd regulatory-compliance-monitor
```

2. **Install dependencies**
```bash
npm install
```

3. **Start Redis**
```bash
docker-compose up -d redis
```

4. **Run the system**
```bash
# Start API server
npm run api

# Run demo scenario
npm run demo

# Run quick demo
npm run demo:quick
```

### Environment Configuration

Create a `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Qodo AI Configuration (optional)
QODO_API_KEY=your_qodo_api_key
QODO_API_URL=https://api.qodo.ai

# Slack Configuration (optional)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_DEFAULT_CHANNEL=#regulatory-updates
SLACK_ALERT_CHANNEL=#compliance-alerts

# Dashboard Configuration
DASHBOARD_URL=http://localhost:3000
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Test Individual Components
```bash
# Test action management
npm test -- src/components/redis/__tests__/action-storage.test.ts

# Test Senso MCP integration
npm test -- src/components/senso/__tests__/mcp-integration.test.ts

# Test integration components
npm test -- src/integration/__tests__/integration-simple.test.ts
```

### Test Workflow Tools
```bash
# Test data validation
node src/tools/data-validator.js '{"id":"test-001","title":"Test Regulation","date":"2025-01-08","url":"https://test.gov/reg","fullText":"Test regulation content","source":"EPA","scrapedAt":"2025-01-08T10:00:00Z"}'

# Test AI analysis (mock mode)
node src/tools/qodo-analyzer.js '{"id":"epa-001","title":"Emergency Safety Regulation","fullText":"EMERGENCY: Immediate compliance required","source":"EPA","date":"2025-01-08","scrapedAt":"2025-01-08T10:00:00Z"}'

# Test Slack notifications (mock mode)
node src/tools/slack-notifier.js regulation '{"id":"test-001","title":"Test Regulation","priority":"high","source":"EPA"}'
```

### Simple System Test
```bash
node simple-test.js
```

## 📋 API Endpoints

The system provides a REST API for dashboard integration:

- `GET /health` - System health check
- `GET /api/regulations` - Get all regulations
- `GET /api/regulations/:id` - Get specific regulation
- `GET /api/regulations/priority/high` - Get high priority regulations
- `GET /api/dashboard` - Get dashboard data
- `POST /api/demo/run` - Run demo scenario
- `POST /api/realtime/start` - Start real-time updates

## 🔧 Senso MCP Workflow Configuration

The system uses Senso MCP for workflow orchestration. Configure in `.kiro/settings/mcp.json`:

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
        "workflow_status"
      ]
    }
  }
}
```

### Available Workflows

1. **regulatory_processing** - Main regulation processing pipeline
2. **emergency_regulation_handler** - Fast-track for critical regulations
3. **compliance_reminder** - Scheduled deadline reminders
4. **system_health_check** - Automated system monitoring

## 📊 Demo Scenarios

### Hackathon Demo
Includes 5 realistic regulatory scenarios:
- EPA Offshore Drilling Emission Standards (Critical)
- DOE Pipeline Safety Inspection Requirements (High)
- Texas RRC Gas Flaring Restrictions (High)
- BOEM Renewable Energy Transition Requirements (Medium)
- OSHA Enhanced Workplace Safety Standards (Medium)

```bash
npm run demo
```

### Quick Demo
Simplified 2-regulation scenario for quick testing:

```bash
npm run demo:quick
```

## 🏢 Project Structure

```
├── src/
│   ├── components/          # Core system components
│   │   ├── redis/          # Data storage and caching
│   │   ├── qodo/           # AI analysis integration
│   │   ├── senso/          # MCP workflow orchestration
│   │   ├── lovable/        # Dashboard UI components
│   │   ├── slack/          # Notification system
│   │   └── apify/          # Data collection (mock)
│   ├── integration/        # End-to-end integration
│   ├── tools/              # Senso MCP workflow tools
│   ├── types/              # TypeScript type definitions
│   └── api/                # REST API server
├── .senso/                 # Senso MCP configuration
├── docs/                   # Documentation
└── __tests__/              # Test files
```

## 🔍 Key Components

### Action Management System
- **ActionItemStorage**: Redis-based CRUD operations
- **ActionItemCard**: Individual action item display
- **ActionItemFilter**: Advanced filtering capabilities
- **ActionListView**: Main dashboard with statistics

### Slack Notification System
- **SlackClient**: Full Slack API integration
- **SlackNotificationManager**: Queue-based notification system
- **Rich Formatting**: Block-based messages with interactive elements

### Senso MCP Integration
- **SensoMCPIntegration**: Workflow execution and management
- **Workflow Tools**: Data validation, AI analysis, notifications
- **Mock Mode**: Demo functionality without external dependencies

## 📈 Performance & Scalability

- **Redis Caching**: Fast data access and duplicate detection
- **Queue-based Processing**: Asynchronous workflow execution
- **Error Recovery**: Automatic retry with exponential backoff
- **Real-time Updates**: WebSocket-based dashboard updates
- **Horizontal Scaling**: MCP-based microservice architecture

## 🛡️ Security & Compliance

- **Data Validation**: Schema-based input validation
- **API Authentication**: Token-based API access
- **Audit Trail**: Complete workflow execution logging
- **Error Handling**: Graceful degradation and error recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Qodo AI** for intelligent regulatory analysis
- **Slack** for real-time notification capabilities
- **Senso MCP** for workflow orchestration
- **Apify** for data collection infrastructure
- **Redis** for high-performance caching

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the [documentation](docs/)
- Review the [testing guide](docs/testing.md)

---

**Built with ❤️ for the Oil & Gas compliance community**