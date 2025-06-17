# Audit Logging Documentation

This document describes the comprehensive audit logging system implemented in the mcp-ssh project.

## Overview

The audit logging system provides detailed tracking of all SSH operations, security events, and user activities. It uses Winston as the structured logging framework with daily rotating log files for optimal performance and storage management.

## Log Files Structure

All logs are stored in the `logs/` directory:

```
logs/
├── mcp-ssh-current.log -> mcp-ssh-2024-06-16.log    # General application logs
├── audit-current.log -> audit-2024-06-16.log        # Audit logs (90 day retention)
├── error-current.log -> error-2024-06-16.log        # Error logs (30 day retention)
├── mcp-ssh-2024-06-16.log                           # Daily general logs (14 day retention)
├── audit-2024-06-16.log                             # Daily audit logs
└── error-2024-06-16.log                             # Daily error logs
```

## Audit Event Categories

### 1. Connection Management Events
- **connection_created**: New SSH connection configuration saved
- **connection_deleted**: SSH connection configuration removed
- **ssh_connected**: Successful SSH connection established
- **ssh_disconnected**: SSH connection terminated

### 2. Command Execution Events
- **command_executed**: SSH command execution (with sanitized command text)
- **background_task_started**: Background task initiated
- **background_task_stopped**: Background task terminated

### 3. File Transfer Events
- **file_upload_started**: File upload initiated
- **file_upload_completed**: File upload finished (success/failure)
- **file_download_started**: File download initiated
- **file_download_completed**: File download finished (success/failure)

### 4. tmux Session Events
- **tmux_session_created**: tmux session created
- **tmux_session_killed**: tmux session terminated
- **tmux_command_sent**: Command sent to tmux session

### 5. Terminal Session Events
- **terminal_session_created**: Interactive terminal session created
- **terminal_session_closed**: Interactive terminal session closed
- **terminal_data_sent**: Data sent to terminal session

### 6. Tunnel Events
- **tunnel_created**: SSH tunnel/port forward created
- **tunnel_closed**: SSH tunnel closed

## Audit Log Format

Each audit log entry contains the following fields:

```json
{
  "timestamp": "2024-06-16T23:15:30.123Z",
  "level": "info",
  "message": "SSH Audit Event",
  "hostname": "workstation",
  "pid": 12345,
  "service": "mcp-ssh",
  "version": "1.0.0",
  "audit": true,
  "action": "command_executed",
  "resource": "ssh_command",
  "resourceId": "conn_abc123",
  "userId": "admin",
  "sessionId": "sess_xyz789",
  "connectionId": "conn_abc123",
  "sourceIp": "192.168.1.100",
  "success": true,
  "details": {
    "command": "ls -la /home/***",
    "cwd": "/home/user",
    "duration_ms": 1250
  },
  "category": "audit"
}
```

### Key Fields Explanation

- **action**: The specific operation performed
- **resource**: Type of resource (ssh_connection, ssh_command, file_transfer, etc.)
- **resourceId**: Unique identifier for the resource
- **userId**: SSH username
- **connectionId**: Internal connection identifier
- **success**: Boolean indicating operation success
- **details**: Operation-specific metadata
- **category**: Always "audit" for audit events

## Security Features

### Command Sanitization
Sensitive information is automatically removed from logged commands:
- Password parameters are masked as `***`
- Echo statements with quotes are sanitized
- Other sensitive patterns are filtered

Example:
```
Original: echo "mypassword123" | sudo -S apt update
Logged:   echo *** | sudo -S apt update
```

### Data Retention
- **Audit logs**: 90 days retention
- **General logs**: 14 days retention  
- **Error logs**: 30 days retention

### File Rotation
- **Maximum file size**: 20MB per file
- **Daily rotation**: New files created daily
- **Symlinks**: Current logs symlinked for easy access

## Configuration

### Environment Variables

```bash
# Logging level (error, warn, info, debug)
LOG_LEVEL=info

# Enable debug mode for development
DEBUG=false
```

### Programmatic Usage

```typescript
import logger, { auditLogger } from './logger.js';

// Regular application logging
logger.info('Application started', { component: 'main' });
logger.error('Connection failed', { host: '192.168.1.100', error: 'timeout' });

// Audit logging
auditLogger.connectionCreated('conn_123', '192.168.1.100', 'admin', true);
auditLogger.commandExecuted('conn_123', 'ls -la', '/home', true, 1500);
```

## Monitoring and Analysis

### Real-time Monitoring
```bash
# Watch current audit log
tail -f logs/audit-current.log

# Watch all logs
tail -f logs/*.log

# Filter specific events
grep "command_executed" logs/audit-current.log
```

### Log Analysis Tools

#### 1. Search by Action Type
```bash
jq 'select(.action=="command_executed")' logs/audit-2024-06-16.log
```

#### 2. Failed Operations
```bash
jq 'select(.success==false)' logs/audit-2024-06-16.log
```

#### 3. Specific Connection Activity
```bash
jq 'select(.connectionId=="conn_abc123")' logs/audit-2024-06-16.log
```

#### 4. User Activity Summary
```bash
jq -r '.userId' logs/audit-2024-06-16.log | sort | uniq -c | sort -nr
```

### Integration with Log Management

The structured JSON format is compatible with:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk**
- **Fluentd/Fluent Bit**
- **Prometheus + Grafana**
- **CloudWatch Logs**

Example Logstash configuration:
```ruby
input {
  file {
    path => "/path/to/logs/audit-*.log"
    codec => "json"
    tags => ["mcp-ssh", "audit"]
  }
}

filter {
  if [audit] {
    mutate {
      add_tag => "audit_event"
    }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "mcp-ssh-audit-%{+YYYY.MM.dd}"
  }
}
```

## Compliance and Security

### Audit Trail Requirements
This logging system provides:
- **Non-repudiation**: All actions are timestamped and linked to connections
- **Integrity**: Structured logging prevents log tampering
- **Availability**: Multiple log levels and retention policies
- **Confidentiality**: Sensitive data is sanitized

### Security Best Practices
1. **Log Storage**: Store logs on separate, secure storage
2. **Access Control**: Restrict log file access to authorized personnel
3. **Monitoring**: Set up alerts for suspicious activities
4. **Backup**: Regular backup of audit logs for compliance
5. **Encryption**: Consider encrypting log files at rest

### Compliance Standards
The audit logging system supports requirements for:
- **SOX** (Sarbanes-Oxley Act)
- **HIPAA** (Health Insurance Portability and Accountability Act)
- **PCI DSS** (Payment Card Industry Data Security Standard)
- **GDPR** (General Data Protection Regulation) - for access logging

## Troubleshooting

### Common Issues

#### 1. Permission Denied on Log Directory
```bash
# Fix permissions
chmod 755 logs/
chown $USER:$USER logs/
```

#### 2. Disk Space Issues
```bash
# Check log sizes
du -sh logs/*

# Manual cleanup of old logs
find logs/ -name "*.log" -mtime +90 -delete
```

#### 3. Missing Log Entries
- Check LOG_LEVEL environment variable
- Verify application has write permissions to logs directory
- Check for application crashes in error logs

#### 4. Performance Impact
- Monitor disk I/O if logging is intensive
- Consider adjusting log levels in production
- Use log sampling for high-volume environments

## Development and Testing

### Running with Debug Logging
```bash
LOG_LEVEL=debug npm start
```

### Testing Audit Events
```bash
# Test connection audit
grep "connection_created" logs/audit-current.log

# Test command audit  
grep "command_executed" logs/audit-current.log

# Validate JSON format
jq . logs/audit-current.log > /dev/null && echo "Valid JSON"
```

This audit logging system provides comprehensive visibility into all SSH operations while maintaining security and performance best practices.