# AGENTS.md - AI Software Architect Framework

> **For [AI Assistant] Users**: This file contains cross-platform instructions for the AI Software Architect framework. For assistant-specific features, see the references at the end of this file.

## Project Overview

[PROJECT_NAME] uses the AI Software Architect framework to implement rigorous software architecture practices with AI assistant collaboration. The framework provides structured architecture documentation, multi-perspective reviews, and architectural decision tracking.

## Framework Setup

The AI Software Architect framework is installed in the `.architecture/` directory and provides:

- **Architecture Documentation**: Centralized repository of architectural decisions and reviews
- **Multi-Perspective Reviews**: Specialized reviewers from different architectural domains
- **Decision Records (ADRs)**: Structured documentation of architectural decisions
- **Recalibration Process**: Translating architectural reviews into implementation plans
- **Pragmatic Mode**: Optional YAGNI enforcement to prevent over-engineering

### Directory Structure

```
.architecture/
├── members.yml              # Architecture review team members
├── principles.md            # Core architectural principles
├── config.yml               # Framework configuration (including pragmatic mode)
├── decisions/               # Architectural Decision Records (ADRs)
│   └── adrs/               # Numbered ADR documents
├── reviews/                 # Architecture review documents
├── recalibration/          # Implementation planning documents
└── templates/              # Templates for ADRs, reviews, etc.
```

## Core Workflows

### Requesting Architecture Reviews

Architecture reviews provide multi-perspective analysis of architectural decisions. Use phrases like:

- "Start architecture review for version X.Y.Z"
- "Start architecture review for [feature name]"
- "Review architecture for [component description]"

The review process includes:
1. **Individual Review Phase**: Each architecture member reviews independently
2. **Collaborative Discussion Phase**: Members discuss findings and trade-offs
3. **Final Report Phase**: Consolidated recommendations and action items

Review documents are created in `.architecture/reviews/` using version numbers (e.g., `1-0-0.md`) or feature names (e.g., `feature-name.md`).

### Requesting Specialist Reviews

For focused architectural feedback from a specific specialist, use phrases like:

- "Ask [Specialist Role] to review [target]"
- "Get [Specialist]'s opinion on [topic]"
- "Have [Role] review these changes"

Example: "Ask Security Specialist to review authentication implementation"

Available specialists are defined in `.architecture/members.yml`. Common roles include:
- Systems Architect (overall system coherence)
- Domain Expert (business logic representation)
- Security Specialist (security implications)
- Performance Specialist (performance optimization)
- Maintainability Expert (code quality and technical debt)
- AI Engineer (AI/ML integration patterns)
- Pragmatic Enforcer (YAGNI and simplicity advocacy)

Specialist review documents are created in `.architecture/reviews/` with format: `[role]-[topic].md`.

### Creating Architectural Decision Records (ADRs)

ADRs document significant architectural decisions. To create an ADR:

1. Use phrases like: "Create ADR for [topic]" or "Document architectural decision for [topic]"
2. Provide context about the decision being made
3. Include alternatives considered
4. Document consequences (positive, negative, neutral)

ADRs are stored in `.architecture/decisions/adrs/` with sequential numbering: `ADR-001-topic.md`, `ADR-002-topic.md`, etc.

ADR template is available at `.architecture/templates/adr-template.md`.

### Enabling Pragmatic Mode

Pragmatic mode adds YAGNI enforcement to prevent over-engineering. Enable it with phrases like:

- "Enable pragmatic mode"
- "Turn on YAGNI enforcement"
- "Activate simplicity guard"
- "Challenge complexity"

Configuration is stored in `.architecture/config.yml`. Three intensity modes:
- **Strict**: Aggressive challenges, require strong justification, default to defer/simplify
- **Balanced**: Thoughtful challenges, accept justified complexity, seek middle ground
- **Lenient**: Raise concerns without blocking, suggest alternatives as options

When enabled, the Pragmatic Enforcer member participates in reviews and ADR creation, challenging:
- Unnecessary abstractions
- Premature optimization
- Speculative features
- Over-engineered solutions

Pragmatic analysis includes:
- **Necessity Assessment** (0-10): Current need, future need, cost of waiting
- **Complexity Assessment** (0-10): Added complexity, maintenance burden, learning curve
- **Simpler Alternatives**: Concrete proposals for simpler approaches
- **Recommendations**: Implement now / Simplified version / Defer / Skip

Deferred decisions are tracked in `.architecture/deferrals.md` with trigger conditions for future implementation.

### Architectural Recalibration

After architecture reviews, conduct recalibration to translate findings into action:

- "Start architecture recalibration for version X.Y.Z"
- "Recalibrate architecture for [feature name]"

Recalibration includes:
1. **Review Analysis & Prioritization**: Categorize and prioritize recommendations
2. **Architectural Plan Update**: Update ADRs and documentation
3. **Documentation Refresh**: Ensure docs reflect new direction
4. **Implementation Roadmapping**: Create detailed implementation plans
5. **Progress Tracking**: Monitor implementation progress

Recalibration documents are stored in `.architecture/recalibration/` using version numbers or feature names.

## Architecture Principles

This project follows architectural principles defined in `.architecture/principles.md`. Key principles include:

- **Livable Code**: Design for developers who inhabit the codebase
- **Clarity over Cleverness**: Prefer simple, clear designs
- **Separation of Concerns**: Clear boundaries and single responsibilities
- **Evolvability**: Facilitate change without complete rewrites
- **Observability**: System provides insights into behavior and state
- **Security by Design**: Security integral to architecture, not afterthought
- **Domain-Centric Design**: Reflect and serve the problem domain
- **Pragmatic Simplicity**: Value working solutions over theoretical perfection

For detailed explanations and application guidelines, see `.architecture/principles.md`.

## Build & Test (Framework Development)

If working on the AI Software Architect framework itself:

### Testing Framework Components

```bash
# Verify directory structure
ls -la .architecture/

# Check configuration
cat .architecture/config.yml

# List architecture members
cat .architecture/members.yml

# View templates
ls .architecture/templates/
```

### Validating ADRs and Reviews

- ADRs should follow template at `.architecture/templates/adr-template.md`
- Reviews should follow template at `.architecture/templates/review-template.md`
- Recalibration should follow template at `.architecture/templates/recalibration_plan.md`

## Project-Specific Information

[PROJECT_TECH_STACK]

[PROJECT_BUILD_COMMANDS]

[PROJECT_TEST_COMMANDS]

[PROJECT_CONVENTIONS]

## Assistant-Specific Features

The AI Software Architect framework provides enhanced capabilities for specific AI coding assistants:

### Claude Code

Claude Code users have access to enhanced features including:

- **Claude Skills**: Reusable skills for setup, reviews, ADR creation, and status checks
- **MCP Server Integration**: Tools for architecture operations via Model Context Protocol
- **Slash Commands**: Custom commands for framework operations
- **Enhanced Setup**: Intelligent project analysis and template customization

**See [CLAUDE.md](../CLAUDE.md) for complete Claude Code documentation.**

### Cursor

Cursor users can configure the framework via:

- **Configuration**: See `.coding-assistants/cursor/README.md`
- **Rules**: Custom rules for architecture operations
- **Integration**: Tab completion and inline suggestions

**See [.coding-assistants/cursor/README.md](../.coding-assistants/cursor/README.md) for details.**

### GitHub Copilot / Codex

Copilot users can access framework features via:

- **Configuration**: See `.coding-assistants/codex/README.md`
- **Comments**: Use comments to trigger architecture operations
- **Integration**: Inline suggestions for ADRs and reviews

**See [.coding-assistants/codex/README.md](../.coding-assistants/codex/README.md) for details.**

### Other AI Assistants

The framework works with any AI assistant that can read markdown files and follow structured instructions. Key entry points:

- **This file (AGENTS.md)**: Cross-platform instructions
- **.architecture/**: All framework artifacts and templates
- **principles.md**: Architectural principles to apply
- **members.yml**: Available architecture reviewers
- **templates/**: Templates for ADRs, reviews, and recalibration

## Additional Resources

- **Framework Principles**: `.architecture/principles.md`
- **Architecture Members**: `.architecture/members.yml`
- **Configuration**: `.architecture/config.yml`
- **ADR Template**: `.architecture/templates/adr-template.md`
- **Review Template**: `.architecture/templates/review-template.md`
- **Recalibration Template**: `.architecture/templates/recalibration_plan.md`
- **Example ADRs**: `.architecture/decisions/adrs/`
- **Example Reviews**: `.architecture/reviews/`

---

**Framework Version**: [FRAMEWORK_VERSION]
**Last Updated**: [LAST_UPDATED]
**Maintained By**: AI Software Architect Framework
