# SSH MCP Tool - Complete English Documentation

[![ISC License](https://img.shields.io/badge/License-ISC-718096?style=flat-square)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![SSH](https://img.shields.io/badge/SSH-MCP-0078d7?style=flat-square)](https://github.com/shuakami/mcp-ssh)

## Table of Contents
- [What is this?](#what-is-this)
- [Features](#features)
- [Architecture](#architecture)
- [Security Considerations](#security-considerations)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## What is this?

This is an SSH tool based on MCP (Model Context Protocol) that allows AI models to access and manage SSH connections through a standardized interface. It enables AI assistants to perform various SSH operations without requiring users to manually input complex commands or switch to a terminal.

**Key Benefits:**
- Natural language SSH command execution
- Persistent connection management with credential storage
- Advanced tmux session handling with blocking detection
- File transfer capabilities with progress monitoring
- Background task execution and monitoring
- Terminal tunneling support

## Features

### Connection Management
- **Create, Update, Delete**: Full CRUD operations for SSH connections
- **Credential Storage**: Secure password and key storage with keytar
- **Auto-reconnection**: Intelligent reconnection with configurable retry logic
- **Connection Pooling**: Efficient connection reuse and management

### Command Execution
- **Single Commands**: Direct command execution with real-time output
- **Compound Commands**: Smart handling of commands with `&&` and `;`
- **Background Tasks**: Long-running task execution with monitoring
- **Blocking Detection**: Automatic detection and handling of interactive programs

### tmux Integration
- **Session Management**: Create, list, attach, and kill tmux sessions
- **Smart Send-Keys**: Intelligent command sending with context awareness
- **Output Capture**: Real-time session output monitoring
- **Process Monitoring**: Advanced blocking and process state detection

### File Operations
- **Upload/Download**: Single and batch file transfers
- **Progress Monitoring**: Real-time transfer progress with events
- **Error Recovery**: Automatic retry and error handling
- **Large File Support**: Efficient handling of large file transfers

### Security Features
- **Multiple Authentication**: Password and key-based authentication
- **Timeout Controls**: Configurable connection and command timeouts
- **Process Isolation**: Secure process management and cleanup
- **Error Handling**: Comprehensive error recovery and logging

## Architecture

The tool consists of several key components:

### Core Components
1. **SSH Service** (`ssh-service.ts`): Core SSH connection management
2. **MCP Server** (`ssh.ts`): MCP protocol implementation and tool registration
3. **Process Manager** (`process-manager.ts`): Process lifecycle and lock management
4. **Bridge Script** (`bridging_ssh_mcp.py`): Python bridge for cross-platform compatibility

### Data Flow
```
AI Model → MCP Protocol → SSH MCP Server → SSH Service → Remote Server
                     ↓
            Terminal/File Transfer Events
```

### Connection Storage
- Uses LokiJS for lightweight connection persistence
- Secure credential storage via keytar (OS keychain integration)
- Automatic connection state management

## Security Considerations

### Authentication
- **Password Storage**: Encrypted storage in OS keychain
- **SSH Keys**: Support for private key authentication with passphrase
- **Multi-factor**: Compatible with SSH key + password combinations

### Process Security
- **Process Isolation**: Each connection runs in isolated context
- **Resource Limits**: Configurable timeouts and resource constraints
- **Clean Shutdown**: Proper cleanup of connections and processes

### Network Security
- **Tunnel Management**: Secure port forwarding capabilities
- **Connection Encryption**: All communications over standard SSH protocol
- **Host Verification**: SSH host key verification (configurable)

**Potential Security Concerns:**
- Credential storage depends on OS keychain security
- Bridge script requires Python subprocess execution
- Process lock files created in working directory
- No built-in connection logging/auditing

## Installation

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.11+** (for bridge script)
- **tmux** (on remote servers for session management)

### Install Dependencies
```bash
git clone https://github.com/shuakami/mcp-ssh.git
cd mcp-ssh
npm install
npm run build
```

### Build Project
```bash
npm run build
```

## Configuration

### Claude Code Configuration

Add to your `.claude.json` file:

```json
{
  "mcpServers": {
    "ssh-mcp": {
      "command": "python3",
      "args": ["/path/to/mcp-ssh/bridging_ssh_mcp.py"]
    }
  }
}
```

### Environment Variables
Create a `.env` file in the project root:
```bash
DEFAULT_SSH_PORT=22
CONNECTION_TIMEOUT=10000
RECONNECT_ATTEMPTS=3
```

### CursorRules Enhancement
For optimal collaboration, add this to your CursorRules:
```
When handling SSH tasks that need or might need user assistance, create a tmux session and directly tell the user what command they can use to connect to collaborate. You must perform tasks within tmux using send-keys commands. Wait patiently for commands to complete and don't run multiple tasks simultaneously.
```

## Usage Examples

### Basic Connection
```
Please create an SSH connection to my server at 192.168.1.100 with username admin
```

### Command Execution
```
Execute ls -la on the server and show me the output
```

### tmux Session Management
```
Create a new tmux session called "monitoring" and run htop
```

### File Operations
```
Upload the file /local/path/config.txt to /remote/path/ on the server
```

### Background Tasks
```
Start monitoring disk usage every 30 seconds in the background
```

## API Reference

### Connection Tools
- `connect`: Create new SSH connection
- `disconnect`: Close connection
- `listConnections`: Show all saved connections
- `getConnection`: Get connection details
- `deleteConnection`: Remove connection

### Command Tools
- `executeCommand`: Run single command
- `backgroundExecute`: Start background task
- `stopBackground`: Stop background task
- `getCurrentDirectory`: Get current working directory

### File Tools
- `uploadFile`: Upload single file
- `downloadFile`: Download single file
- `batchUploadFiles`: Upload multiple files
- `batchDownloadFiles`: Download multiple files
- `getFileTransferStatus`: Check transfer progress
- `listFileTransfers`: Show all transfers

### Session Tools
- `listActiveSessions`: Show active connections
- `listBackgroundTasks`: Show running background tasks
- `stopAllBackgroundTasks`: Stop all background tasks

### Terminal Tools
- `mcp_ssh_mcp_createTerminalSession`: Create interactive terminal
- `mcp_ssh_mcp_writeToTerminal`: Send data to terminal

### Tunnel Tools
- `createTunnel`: Create port forward tunnel
- `closeTunnel`: Close tunnel
- `listTunnels`: Show active tunnels

## Troubleshooting

### Common Issues

**Connection Failures**
- Check network connectivity and SSH service status
- Verify credentials and authentication method
- Check firewall and port accessibility

**tmux Session Issues**
- Ensure tmux is installed on remote server
- Check session naming conflicts
- Verify user permissions for tmux operations

**File Transfer Problems**
- Check file permissions and disk space
- Verify paths exist and are accessible
- Monitor transfer progress for large files

**Background Task Issues**
- Check for process conflicts and resource limits
- Monitor system resources on remote server
- Verify task cleanup on disconnection

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=1 python3 bridging_ssh_mcp.py
```

### Process Management
The tool uses lock files to prevent multiple instances. If you encounter lock file issues:
```bash
rm .mcp-ssh.lock
```

### Performance Optimization
- Use connection pooling for multiple operations
- Implement appropriate timeouts for long-running tasks
- Monitor memory usage for large file transfers
- Regular cleanup of completed transfers and sessions

## Advanced Features

### Custom Commands
The tool supports custom command aliases and shortcuts through the SSH service configuration.

### Event Handling
Real-time events for:
- Terminal data streams
- File transfer progress
- Connection status changes
- Background task updates

### Integration
- Compatible with Claude Code and Cursor editors
- Extensible MCP tool registration
- Custom event handlers and middleware support