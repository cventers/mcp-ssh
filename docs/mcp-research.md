# MCP Server Research - Motion and Todoist Implementation

## Motion MCP Server Research

### Implementation Details

**Repository**: `christopher-czaban/motion-mcp-server`
- **Author**: Christopher Czaban
- **License**: MIT
- **Language**: TypeScript
- **Created**: ~1 month ago
- **GitHub**: https://github.com/christopher-czaban/motion-mcp-server

### Key Features

- **Motion API Integration**: Provides MCP tools for various Motion API endpoints (projects, tasks, users, etc.)
- **Rate Limiting**: Automatic rate limiting to prevent exceeding Motion API quotas
- **Persistent State**: Uses local SQLite database for rate limiting across server restarts
- **Feedback System**: Provides feedback when API limits are reached

### Installation Requirements

1. **Clone Repository**: Clone from GitHub
2. **Dependencies**: Install necessary TypeScript/Node.js dependencies
3. **API Configuration**: Configure Motion API key
4. **Local Setup**: Run server locally for Claude Desktop integration

### Use Cases

- Automating task management through AI assistants
- Integrating project management capabilities into conversational interfaces
- Natural language interactions with task scheduling
- Enhancing productivity workflows

### Research Status

- ✅ Located official implementation by Christopher Czaban
- ⚠️ Need to verify Motion API key acquisition process
- ⚠️ Need to test rate limiting behavior
- ⚠️ Need to validate SQLite persistence functionality

### Next Steps

1. Clone repository and examine source code
2. Research Motion API documentation for key generation
3. Test installation process
4. Configure in global MCP settings
5. Test integration with Claude Desktop

---

## Todoist MCP Server Research

### Available Implementations

#### 1. Official Doist Implementation
**Repository**: `Doist/todoist-mcp`
- **Status**: Official implementation by Todoist team
- **Features**: Full Todoist API integration
- **GitHub**: https://github.com/Doist/todoist-mcp

#### 2. TaskMaster Implementation
**Repository**: `mingolladaniele/taskMaster-todoist-mcp`
- **Features**: Lightweight, natural language interaction focus
- **Target**: IDE integration (Cursor AI)
- **GitHub**: https://github.com/mingolladaniele/taskMaster-todoist-mcp

#### 3. Community Implementation
**Repository**: `abhiz123/todoist-mcp-server`
- **Features**: Claude integration focus
- **Focus**: Natural language task management
- **GitHub**: https://github.com/abhiz123/todoist-mcp-server

### Capabilities Overview

**Task Management**:
- Create tasks with content, descriptions, due dates, priorities, labels
- Create tasks with natural language (e.g., "Submit report by Friday 5pm #Work")
- Retrieve tasks (individual, filtered, or all tasks)
- Retrieve completed tasks by completion date or due date
- Task filtering using Todoist's filter syntax
- Rich task formatting with metadata

**Project and Organization**:
- Project management and navigation
- Label and tag management
- Priority and due date handling
- Natural language processing for operations

### Installation Requirements

**Common Requirements**:
- Todoist API token (from Settings > Integrations > Developer)
- Node.js/npm environment for most implementations
- Claude Desktop or compatible MCP client

**Token Setup**:
1. Go to Todoist > Settings > Integrations > Developer
2. Generate new API token
3. Store securely for MCP configuration

### Research Priority

**Primary Choice**: Official Doist implementation for reliability and full feature support
**Backup Options**: Community implementations for specific use cases

### Research Status

- ✅ Identified multiple mature implementations
- ✅ Located official Doist implementation
- ⚠️ Need to compare feature sets between implementations
- ⚠️ Need to test API token generation process
- ⚠️ Need to validate natural language task creation

### Next Steps

1. Test Todoist API token generation
2. Compare official vs community implementations
3. Install and configure preferred implementation
4. Test natural language task creation capabilities
5. Validate filtering and project management features

---

## Implementation Plan

### Phase 1: Motion MCP Server
1. **Research Motion API**:
   - Locate API documentation
   - Understand authentication requirements
   - Test API key generation

2. **Install Motion MCP Server**:
   - Clone christopher-czaban repository
   - Install dependencies
   - Configure API credentials
   - Test local server functionality

3. **Integration**:
   - Add to global MCP configuration
   - Test with Claude Desktop
   - Validate rate limiting behavior

### Phase 2: Todoist MCP Server
1. **Compare Implementations**:
   - Test official Doist implementation
   - Evaluate community alternatives
   - Choose optimal implementation

2. **Install Todoist MCP Server**:
   - Generate Todoist API token
   - Install chosen implementation
   - Configure authentication

3. **Integration and Testing**:
   - Add to global MCP configuration
   - Test natural language task creation
   - Validate filtering and project features

### Configuration Template

Following established MCP deployment methodology:

```json
{
  "mcpServers": {
    "motion": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/motion-mcp-server/dist/index.js"],
      "env": {
        "MOTION_API_KEY_FILE": "/home/chase/.config/motion-api-key",
        "MCP_DEBUG": "false"
      }
    },
    "todoist": {
      "type": "stdio", 
      "command": "node",
      "args": ["/path/to/todoist-mcp/dist/index.js"],
      "env": {
        "TODOIST_API_TOKEN_FILE": "/home/chase/.config/todoist-token",
        "MCP_DEBUG": "false"
      }
    }
  }
}
```

### Security Considerations

- Store API keys in separate files under `/home/chase/.config/`
- Use restricted file permissions (600) for token files
- Reference tokens via environment variables
- Regular audit of API permissions and usage