# AI Software Architect MCP Server

This is a Model Context Protocol (MCP) server that provides the AI Software Architect framework as tools for Claude Code, Cursor, and other MCP-compatible AI assistants.

## Installation

### Option 1: Using Claude Code

First install the package:
```bash
npm install -g ai-software-architect
```

Then add it to Claude Code:
```bash
claude mcp add ai-software-architect mcp
```

### Option 2: Install via npm

```bash
npm install -g ai-software-architect
```

### Option 3: Install from source

```bash
git clone https://github.com/codenamev/ai-software-architect.git
cd ai-software-architect/mcp
npm install
```

## Configuration

### Claude Code Configuration

Add this to your Claude Code configuration file (`~/.claude/config.json`):

**For npm global install:**
```json
{
  "mcpServers": {
    "ai-software-architect": {
      "command": "mcp",
      "args": [],
      "env": {}
    }
  }
}
```

**For source install:**
```json
{
  "mcpServers": {
    "ai-software-architect": {
      "command": "node",
      "args": ["/path/to/ai-software-architect/mcp/index.js"],
      "env": {}
    }
  }
}
```

### Cursor Configuration

Add this to your Cursor settings (`settings.json`):

**For npm global install:**
```json
{
  "mcp.servers": {
    "ai-software-architect": {
      "command": "mcp",
      "args": []
    }
  }
}
```

**For source install:**
```json
{
  "mcp.servers": {
    "ai-software-architect": {
      "command": "node",
      "args": ["/path/to/ai-software-architect/mcp/index.js"]
    }
  }
}
```

## Quick Start

### For Claude Code Users (Easiest)

1. **Install with Claude Code**:
   ```bash
   npm install -g ai-software-architect
   claude mcp add ai-software-architect mcp
   ```

2. **Test the installation**:
   Open Claude Code and try:
   ```
   Use the setup_architecture tool to set up the AI Software Architect framework in my current project.
   ```

3. **Start using the framework**:
   - Create ADRs: "Use create_adr to document our database choice"
   - Run reviews: "Use start_architecture_review for version 1.0.0"
   - Get specialist input: "Use specialist_review with Security Architect for our API"

### For Other AI Assistants

1. **Install the MCP server**:
   ```bash
   npm install -g ai-software-architect
   ```

2. **Configure your AI assistant** (see configuration sections above)

3. **Test and use** (same as steps 2-3 above)

## Available Tools

### `setup_architecture`
Sets up the AI Software Architect framework in your project with full customization and analysis.

**What it does:**
1. **Project Analysis** - Analyzes your codebase to detect languages, frameworks, and patterns
2. **Framework Installation** - Copies and installs the complete framework structure
3. **Customization** - Tailors templates, team members, and principles to your tech stack
4. **Integration Setup** - Configures CLAUDE.md integration for AI assistant collaboration
5. **Initial Analysis** - Conducts comprehensive architectural analysis from multiple perspectives
6. **Documentation** - Creates customized templates and architectural principles

**Parameters:**
- `projectPath` (string): Path to your project root directory

**Creates:**
- `.architecture/` - Complete framework structure with decisions, reviews, templates
- `.coding-assistants/` - AI assistant configuration directories
- `CLAUDE.md` - Enhanced with framework usage instructions (if not exists or appends to existing)
- Initial architectural analysis report based on your project's characteristics

### `create_adr`
Creates an Architectural Decision Record (ADR).

**Parameters:**
- `title` (string): Title of the ADR
- `context` (string): Context and background for the decision
- `decision` (string): The architectural decision being made
- `consequences` (string): Consequences of this decision
- `projectPath` (string): Path to your project root directory

### `start_architecture_review`
Starts a comprehensive architecture review process.

**Parameters:**
- `reviewTarget` (string): What to review (version number like '1.0.0' or feature name)
- `projectPath` (string): Path to your project root directory

### `specialist_review`
Gets a focused review from a specific architecture specialist.

**Parameters:**
- `specialist` (string): Name or type of specialist (e.g., 'Security Architect', 'Performance Specialist')
- `target` (string): What to review (code, design, component, etc.)
- `projectPath` (string): Path to your project root directory

### `list_architecture_members`
Lists all available architecture team members and their specialties.

**Parameters:**
- `projectPath` (string): Path to your project root directory

### `get_architecture_status`
Gets the current status of architecture documentation and decisions.

**Parameters:**
- `projectPath` (string): Path to your project root directory

## Usage Examples

Once configured, you can use these tools through your AI assistant:

### Setup
```
Use the setup_architecture tool to set up the framework in my current project.
```

### Create an ADR
```
Use the create_adr tool to document our decision to use PostgreSQL as our primary database.
```

### Start a Review
```
Use the start_architecture_review tool to review version 2.0.0 of our system.
```

### Get Specialist Input
```
Use the specialist_review tool to have the Security Architect review our authentication system.
```

### Check Status
```
Use the get_architecture_status tool to see the current state of our architecture documentation.
```

## Development

To modify or extend the server:

1. Edit `index.js` to add new tools or modify existing ones
2. Update the tool schemas in the `ListToolsRequestSchema` handler
3. Add corresponding implementation methods
4. Test with `npm start`

## Directory Structure

The MCP server creates and manages this structure in your project:

```
.architecture/
├── decisions/
│   ├── adrs/                # Architectural Decision Records
│   └── principles.md        # Architectural principles document
├── reviews/                 # Architecture review documents
├── recalibration/           # Recalibration plans and tracking
├── comparisons/             # Version-to-version comparisons
├── docs/                    # General architecture documentation
├── templates/               # Templates for various documents
└── members.yml              # Architecture review team members
```

## License

MIT