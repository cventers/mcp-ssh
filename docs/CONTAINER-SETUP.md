# Container Setup for MCP-SSH

This guide shows how to run mcp-ssh as a Podman container using Quadlet on the mcp network.

## Prerequisites

- Podman installed and configured
- Systemd user services enabled
- MCP network created (`podman network create mcp`)

## Build Container Image

1. **Build the container image:**
```bash
cd /home/chase/Development/AI/mcp-ssh/repo
podman build -f docs/Containerfile -t localhost/mcp-ssh:latest .
```

2. **Test the container:**
```bash
podman run --rm localhost/mcp-ssh:latest python3 --version
```

## Setup Quadlet Service

1. **Create required directories:**
```bash
sudo mkdir -p /opt/mcp-ssh/{data,logs,config}
sudo chown 1001:1001 /opt/mcp-ssh/{data,logs,config}
```

2. **Copy the quadlet file:**
```bash
sudo cp docs/mcp-ssh.container /etc/containers/systemd/
```

3. **Reload systemd and start the service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mcp-ssh.service
```

## Configuration

### Environment Variables
Create `/opt/mcp-ssh/config/.env`:
```bash
# SSH Connection Defaults
DEFAULT_SSH_PORT=22
CONNECTION_TIMEOUT=10000
RECONNECT_ATTEMPTS=3

# Logging Configuration
LOG_LEVEL=info

# Data paths (container paths)
DATA_PATH=/app/data
```

### Network Integration
The container connects to the `mcp` network and can communicate with other MCP services:

- **YouTrack**: `youtrack.mcp`
- **Browser**: `browser.mcp`
- **MCP-SSH**: `mcp-ssh.mcp`

## Service Management

### Start/Stop/Restart
```bash
# Start the service
sudo systemctl start mcp-ssh.service

# Stop the service
sudo systemctl stop mcp-ssh.service

# Restart the service
sudo systemctl restart mcp-ssh.service

# Check status
sudo systemctl status mcp-ssh.service
```

### View Logs
```bash
# Service logs
sudo journalctl -u mcp-ssh.service -f

# Application logs
sudo tail -f /opt/mcp-ssh/logs/mcp-ssh-current.log

# Audit logs
sudo tail -f /opt/mcp-ssh/logs/audit-current.log
```

### Health Monitoring
```bash
# Check container health
podman healthcheck run mcp-ssh

# Container stats
podman stats mcp-ssh
```

## Data Persistence

Data is persisted in host directories:

- **Connection data**: `/opt/mcp-ssh/data/`
- **Log files**: `/opt/mcp-ssh/logs/`
- **Configuration**: `/opt/mcp-ssh/config/`

## Security Considerations

### Container Security
- Runs as non-root user (UID 1001)
- Read-only root filesystem
- No new privileges allowed
- Memory and CPU limits enforced

### Network Security
- Isolated to MCP network
- No external port exposure by default
- Communication only with other MCP services

### Data Security
- SELinux labels applied to volumes (`:Z`)
- Audit logging enabled by default
- Credentials stored in container keyring

## Troubleshooting

### Container Won't Start
```bash
# Check container logs
sudo journalctl -u mcp-ssh.service

# Check Podman events
podman events --filter container=mcp-ssh

# Inspect container
podman inspect mcp-ssh
```

### Network Issues
```bash
# Verify MCP network exists
podman network ls | grep mcp

# Check network connectivity
podman exec mcp-ssh ping -c 3 youtrack.mcp
```

### Permission Issues
```bash
# Fix data directory permissions
sudo chown -R 1001:1001 /opt/mcp-ssh/

# Check SELinux context
ls -laZ /opt/mcp-ssh/
```

### Resource Issues
```bash
# Check resource usage
podman stats mcp-ssh

# Adjust limits in /etc/containers/systemd/mcp-ssh.container
# Then reload: sudo systemctl daemon-reload && sudo systemctl restart mcp-ssh
```

## Integration with Claude Code

### Container Configuration
When running in a container, Claude Code should connect to the containerized service. Update your `.claude.json`:

```json
{
  "mcpServers": {
    "ssh-mcp": {
      "command": "podman",
      "args": [
        "exec", "-i", "mcp-ssh",
        "python3", "/app/bridging_ssh_mcp.py"
      ]
    }
  }
}
```

### Alternative: Direct Network Access
If Claude Code runs on the same host:

```json
{
  "mcpServers": {
    "ssh-mcp": {
      "command": "python3",
      "args": ["/opt/mcp-ssh/scripts/client-bridge.py"]
    }
  }
}
```

## Maintenance

### Updates
```bash
# Update container image
cd /home/chase/Development/AI/mcp-ssh/repo
git pull
podman build -f docs/Containerfile -t localhost/mcp-ssh:latest .

# Restart service with new image
sudo systemctl restart mcp-ssh.service
```

### Backup
```bash
# Backup data and configuration
sudo tar -czf mcp-ssh-backup-$(date +%Y%m%d).tar.gz \
  /opt/mcp-ssh/data \
  /opt/mcp-ssh/config \
  /etc/containers/systemd/mcp-ssh.container
```

### Log Rotation
Log rotation is handled automatically by Winston. Manual cleanup:
```bash
# Clean old logs (older than 90 days)
sudo find /opt/mcp-ssh/logs -name "*.log" -mtime +90 -delete
```