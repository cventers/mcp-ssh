# MCP-SSH Setup Instructions

## Quick Setup for Claude Code

### 1. Build the Project
```bash
cd /home/chase/Development/AI/mcp-ssh/repo
npm install
npm run build
```

### 2. Add to Claude Configuration
Add this to your `~/.claude.json`:

```json
{
  "mcpServers": {
    "ssh-mcp": {
      "command": "python3",
      "args": ["/home/chase/Development/AI/mcp-ssh/repo/bridging_ssh_mcp.py"]
    }
  }
}
```

### 3. Restart Claude Code
```bash
# Kill any existing Claude Code processes
pkill -f "claude-code\|Claude Code"

# Start Claude Code fresh
claude-code
```

### 4. Test the Installation
In Claude Code, try:
```
Please list all available SSH connections
```

## Environment Setup

### Prerequisites
- Node.js 18+ and npm ✓ (already installed)
- Python 3.11+ ✓ (already installed)
- tmux (for remote servers)

### Optional: Install tmux on Remote Servers
```bash
# Ubuntu/Debian
sudo apt-get install tmux

# CentOS/RHEL
sudo yum install tmux

# macOS
brew install tmux
```

## Advanced Configuration

### Environment Variables (optional)
Create `/home/chase/Development/AI/mcp-ssh/repo/.env`:
```bash
DEFAULT_SSH_PORT=22
CONNECTION_TIMEOUT=10000
RECONNECT_ATTEMPTS=3
```

### CursorRules Enhancement
Add to your `.cursorrules` for better SSH collaboration:
```
When handling SSH tasks that need user assistance, create a tmux session and tell the user the command to connect. Perform tasks within tmux using send-keys commands. Wait for commands to complete before running the next task.
```

## Troubleshooting

### Common Issues

**"Module not found" errors**
```bash
cd /home/chase/Development/AI/mcp-ssh/repo
npm install
npm run build
```

**Python bridge issues**
```bash
which python3
# Should show: /usr/bin/python3 or similar
python3 --version
# Should show: Python 3.11+ 
```

**Permission errors**
```bash
chmod +x /home/chase/Development/AI/mcp-ssh/repo/bridging_ssh_mcp.py
```

**Lock file conflicts**
```bash
rm /home/chase/Development/AI/mcp-ssh/repo/.mcp-ssh.lock
```

### Debug Mode
```bash
cd /home/chase/Development/AI/mcp-ssh/repo
DEBUG=1 python3 bridging_ssh_mcp.py
```

## Security Notes

- Credentials are stored securely in the OS keychain
- SSH connections use standard encryption
- No sensitive data is logged by default
- Process cleanup happens automatically on exit