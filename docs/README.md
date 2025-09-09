# Documentation

## 📚 Table of Contents

- [Getting Started](getting-started.md)
- [Senso MCP Setup](senso-mcp-setup.md)
- [Testing Guide](testing.md)
- [API Reference](api-reference.md)
- [Deployment Guide](deployment.md)

## 🎯 Quick Links

### For Developers
- [Component Architecture](architecture.md)
- [Testing Strategies](testing.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

### For Users
- [Installation Guide](getting-started.md)
- [Configuration Options](configuration.md)
- [Troubleshooting](troubleshooting.md)

### For DevOps
- [Deployment Guide](deployment.md)
- [Monitoring Setup](monitoring.md)
- [Security Configuration](security.md)

## 🚀 Key Features Documentation

### Action Management System
The action management system provides comprehensive tracking of compliance tasks with advanced filtering, assignment management, and real-time statistics.

### Senso MCP Workflow Orchestration
Professional workflow management using Model Context Protocol for scalable, event-driven processing of regulatory documents.

### AI-Powered Analysis
Integration with Qodo AI for intelligent regulatory text analysis, risk scoring, and compliance checklist generation.

### Real-time Notifications
Slack integration with rich formatting, priority-based routing, and automated deadline reminders.

## 📊 System Architecture

The AI Regulatory Compliance Monitor follows a microservices architecture with clear separation of concerns:

1. **Data Collection Layer** (Apify)
2. **Storage Layer** (Redis)
3. **Orchestration Layer** (Senso MCP)
4. **Analysis Layer** (Qodo AI)
5. **Presentation Layer** (Lovable Dashboard)
6. **Notification Layer** (Slack)

Each layer is independently testable and scalable, ensuring robust operation in production environments.