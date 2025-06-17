import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// Create logs directory
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Winston logger configuration with structured logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        hostname: os.hostname(),
        pid: process.pid,
        ...meta
      });
    })
  ),
  defaultMeta: {
    service: 'mcp-ssh',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Console output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Daily rotating file for general logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'mcp-ssh-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      createSymlink: true,
      symlinkName: 'mcp-ssh-current.log'
    }),
    
    // Daily rotating file for audit logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '90d', // Keep audit logs longer
      createSymlink: true,
      symlinkName: 'audit-current.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          // Only log audit events to this file
          return info.audit ? info : false;
        })(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            hostname: os.hostname(),
            pid: process.pid,
            ...meta
          });
        })
      )
    }),
    
    // Error-only log file
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      createSymlink: true,
      symlinkName: 'error-current.log'
    })
  ]
});

// Audit logging interface
export interface AuditEvent {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  sessionId?: string;
  connectionId?: string;
  sourceIp?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
  details?: Record<string, any>;
}

// Audit logger wrapper
class AuditLogger {
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  logEvent(event: AuditEvent): void {
    this.logger.info('SSH Audit Event', {
      audit: true,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      userId: event.userId,
      sessionId: event.sessionId,
      connectionId: event.connectionId,
      sourceIp: event.sourceIp,
      userAgent: event.userAgent,
      success: event.success,
      error: event.error,
      details: event.details,
      category: 'audit'
    });
  }

  // Connection events
  connectionCreated(connectionId: string, host: string, username: string, success: boolean, error?: string): void {
    this.logEvent({
      action: 'connection_created',
      resource: 'ssh_connection',
      resourceId: connectionId,
      userId: username,
      connectionId,
      success,
      error,
      details: { host, username }
    });
  }

  connectionDeleted(connectionId: string, host: string, username: string, success: boolean, error?: string): void {
    this.logEvent({
      action: 'connection_deleted',
      resource: 'ssh_connection',
      resourceId: connectionId,
      userId: username,
      connectionId,
      success,
      error,
      details: { host, username }
    });
  }

  sshConnected(connectionId: string, host: string, username: string, success: boolean, error?: string): void {
    this.logEvent({
      action: 'ssh_connected',
      resource: 'ssh_session',
      resourceId: connectionId,
      userId: username,
      connectionId,
      success,
      error,
      details: { host, username }
    });
  }

  sshDisconnected(connectionId: string, host: string, username: string, success: boolean, error?: string): void {
    this.logEvent({
      action: 'ssh_disconnected',
      resource: 'ssh_session',
      resourceId: connectionId,
      userId: username,
      connectionId,
      success,
      error,
      details: { host, username }
    });
  }

  // Command execution events
  commandExecuted(connectionId: string, command: string, cwd: string | undefined, success: boolean, duration?: number, error?: string): void {
    this.logEvent({
      action: 'command_executed',
      resource: 'ssh_command',
      resourceId: connectionId,
      connectionId,
      success,
      error,
      details: { 
        command: this.sanitizeCommand(command), 
        cwd,
        duration_ms: duration
      }
    });
  }

  backgroundTaskStarted(connectionId: string, command: string, interval: number, success: boolean, error?: string): void {
    this.logEvent({
      action: 'background_task_started',
      resource: 'background_task',
      resourceId: connectionId,
      connectionId,
      success,
      error,
      details: { 
        command: this.sanitizeCommand(command), 
        interval_ms: interval
      }
    });
  }

  backgroundTaskStopped(connectionId: string, success: boolean, error?: string): void {
    this.logEvent({
      action: 'background_task_stopped',
      resource: 'background_task',
      resourceId: connectionId,
      connectionId,
      success,
      error
    });
  }

  // File transfer events
  fileUploadStarted(connectionId: string, localPath: string, remotePath: string, fileSize: number, success: boolean, error?: string): void {
    this.logEvent({
      action: 'file_upload_started',
      resource: 'file_transfer',
      connectionId,
      success,
      error,
      details: { 
        localFile: path.basename(localPath),
        remotePath,
        fileSize
      }
    });
  }

  fileUploadCompleted(connectionId: string, localPath: string, remotePath: string, fileSize: number, duration: number, success: boolean, error?: string): void {
    this.logEvent({
      action: 'file_upload_completed',
      resource: 'file_transfer',
      connectionId,
      success,
      error,
      details: { 
        localFile: path.basename(localPath),
        remotePath,
        fileSize,
        duration_ms: duration
      }
    });
  }

  fileDownloadStarted(connectionId: string, remotePath: string, localPath: string, fileSize: number, success: boolean, error?: string): void {
    this.logEvent({
      action: 'file_download_started',
      resource: 'file_transfer',
      connectionId,
      success,
      error,
      details: { 
        remotePath,
        localFile: path.basename(localPath),
        fileSize
      }
    });
  }

  fileDownloadCompleted(connectionId: string, remotePath: string, localPath: string, fileSize: number, duration: number, success: boolean, error?: string): void {
    this.logEvent({
      action: 'file_download_completed',
      resource: 'file_transfer',
      connectionId,
      success,
      error,
      details: { 
        remotePath,
        localFile: path.basename(localPath),
        fileSize,
        duration_ms: duration
      }
    });
  }

  // tmux session events
  tmuxSessionCreated(connectionId: string, sessionName: string, success: boolean, error?: string): void {
    this.logEvent({
      action: 'tmux_session_created',
      resource: 'tmux_session',
      resourceId: sessionName,
      connectionId,
      success,
      error,
      details: { sessionName }
    });
  }

  tmuxSessionKilled(connectionId: string, sessionName: string, success: boolean, error?: string): void {
    this.logEvent({
      action: 'tmux_session_killed',
      resource: 'tmux_session',
      resourceId: sessionName,
      connectionId,
      success,
      error,
      details: { sessionName }
    });
  }

  tmuxCommandSent(connectionId: string, sessionName: string, command: string, success: boolean, error?: string): void {
    this.logEvent({
      action: 'tmux_command_sent',
      resource: 'tmux_session',
      resourceId: sessionName,
      connectionId,
      success,
      error,
      details: { 
        sessionName,
        command: this.sanitizeCommand(command)
      }
    });
  }

  // Terminal session events
  terminalSessionCreated(connectionId: string, sessionId: string, success: boolean, error?: string): void {
    this.logEvent({
      action: 'terminal_session_created',
      resource: 'terminal_session',
      resourceId: sessionId,
      connectionId,
      success,
      error,
      details: { sessionId }
    });
  }

  terminalSessionClosed(connectionId: string, sessionId: string, success: boolean, error?: string): void {
    this.logEvent({
      action: 'terminal_session_closed',
      resource: 'terminal_session',
      resourceId: sessionId,
      connectionId,
      success,
      error,
      details: { sessionId }
    });
  }

  terminalDataSent(connectionId: string, sessionId: string, dataLength: number, success: boolean, error?: string): void {
    this.logEvent({
      action: 'terminal_data_sent',
      resource: 'terminal_session',
      resourceId: sessionId,
      connectionId,
      success,
      error,
      details: { sessionId, dataLength }
    });
  }

  // Tunnel events
  tunnelCreated(connectionId: string, tunnelId: string, localPort: number, remoteHost: string, remotePort: number, success: boolean, error?: string): void {
    this.logEvent({
      action: 'tunnel_created',
      resource: 'ssh_tunnel',
      resourceId: tunnelId,
      connectionId,
      success,
      error,
      details: { tunnelId, localPort, remoteHost, remotePort }
    });
  }

  tunnelClosed(connectionId: string, tunnelId: string, success: boolean, error?: string): void {
    this.logEvent({
      action: 'tunnel_closed',
      resource: 'ssh_tunnel',
      resourceId: tunnelId,
      connectionId,
      success,
      error,
      details: { tunnelId }
    });
  }

  // Utility methods
  private sanitizeCommand(command: string): string {
    // Remove potentially sensitive information from commands
    return command
      .replace(/password\s*=\s*[^\s]+/gi, 'password=***')
      .replace(/passwd\s+[^\s]+/gi, 'passwd ***')
      .replace(/--password[=\s][^\s]+/gi, '--password=***')
      .replace(/echo\s+['"'][^'"]*['"]/gi, 'echo ***')
      .trim();
  }
}

export const auditLogger = new AuditLogger(logger);
export default logger;