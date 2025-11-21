# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This File

**This file extends AGENTS.md with Claude Code-specific features.**

The AI Software Architect framework provides instructions for all AI assistants in `AGENTS.md` (cross-platform instructions). This file (CLAUDE.md) adds Claude Code-specific enhancements including:

- **Claude Skills**: Reusable skills for setup, reviews, ADR creation, and status checks
- **MCP Server Integration**: Tools for architecture operations via Model Context Protocol
- **Advanced Setup Process**: Intelligent project analysis and template customization
- **Request Recognition Patterns**: Claude-optimized command patterns and workflows
- **Hooks and Configuration**: Claude Code-specific settings and integrations

**For core framework concepts** (architecture reviews, ADRs, pragmatic mode, principles), see `AGENTS.md`. This file focuses on how Claude Code implements and extends those concepts.

## Project Overview

AI Software Architect is a framework for organizing and structuring software architecture design with support for multiple AI coding assistants. It provides a structured approach to architecture documentation and decision-making, with specialized support for Claude Code, Cursor, and GitHub Copilot/Codex.

## Request Recognition

This framework supports several types of requests from users. Recognize and respond to these patterns:

### Setup Requests
When a user makes requests like "Setup .architecture", "Setup ai-software-architect", "Setup software architect", "Setup architect", "Setup architecture", "Customize software architect", or similar phrases, follow these steps:

1. **Detect Setup Context**
   - Check if `.architecture/` directory exists with the cloned framework files
   - Verify you're running from the user's project root (not from within .architecture)
   - Confirm the user has added the framework reference to their CLAUDE.md

2. **Analyze Target Project**
   - Examine the current directory (user's project) to understand their codebase
   - Identify primary programming languages, frameworks, and architectural patterns
   - Check for existing documentation patterns, package files, and project structure
   - Look for technology-specific files (package.json, requirements.txt, etc.)

3. **Framework Installation**
   - Move the actual framework from `.architecture/.architecture/` to `.architecture/`
   - Create `.coding-assistants/` directory structure in project root
   - **Create AGENTS.md** from template at `.architecture/templates/AGENTS.md`:
     - Customize [PROJECT_NAME] with actual project name
     - Fill in [PROJECT_TECH_STACK] with identified languages/frameworks
     - Add [PROJECT_BUILD_COMMANDS] based on project structure
     - Add [PROJECT_TEST_COMMANDS] based on project testing setup
     - Include [PROJECT_CONVENTIONS] for project-specific patterns
     - Set [FRAMEWORK_VERSION] and [LAST_UPDATED] appropriately
   - **IMPORTANT**: Only append framework usage instructions to CLAUDE.md, NOT the setup instructions
   - Set up initial directory structure for decisions, reviews, and recalibration

4. **Customize for Project**
   - Update `.architecture/members.yml` with roles relevant to their technology stack
   - Modify `.architecture/principles.md` to align with their project's architectural needs
   - Customize templates in `.architecture/templates/` based on their project patterns
   - Create initial ADR structure in `.architecture/decisions/adrs/`

5. **Cleanup & Finalize**
   - Create a timestamped backup directory: `mkdir -p ~/.ai-architect-backups/setup-$(date +%Y%m%d-%H%M%S)`
   - Move (don't delete) template repository files to backup:
     - `mv README.md USAGE*.md INSTALL.md ~/.ai-architect-backups/setup-$(date +%Y%m%d-%H%M%S)/` (if they exist)
   - **Move .architecture/.git/ to backup** (NEVER touch project root .git):
     - Verify target exists: `[ -d .architecture/.git ]`
     - Move to backup: `mv .architecture/.git ~/.ai-architect-backups/setup-$(date +%Y%m%d-%H%M%S)/architecture-git`
     - Verify project .git remains intact: `[ -d .git ]`
   - Move the now-empty cloned repository structure to backup (if it exists)
   - Verify all framework files are properly located
   - Inform user: "Backup created at ~/.ai-architect-backups/setup-TIMESTAMP/. You can safely remove this backup directory once you've verified everything works correctly."

6. **Collaborative Architectural Analysis**
   - Conduct a comprehensive analysis of the codebase from multiple architectural perspectives
   - Adopt the roles of all members defined in `.architecture/members.yml`
   - Each member should analyze the system from their specialized perspective
   - Create a comprehensive architectural analysis document in `.architecture/reviews/initial-system-analysis.md`
   - Include findings on: system structure, design patterns, technology choices, architectural strengths, areas for improvement, technical debt, and recommendations
   - Provide both individual member insights and a collaborative synthesis

7. **Guide Next Steps**
   - Explain what customizations you've made and why
   - Summarize key findings from the initial architectural analysis
   - Show them how to use the framework with their specific project
   - Suggest immediate next steps for architectural documentation based on the analysis
   - Provide examples relevant to their tech stack and identified patterns

### Update Framework Requests
When a user requests to update their installed framework using phrases like "Update the software architect framework from https://github.com/codenamev/ai-software-architect" or "Update ai-software-architect from main", follow these steps:

1. **Verify Current Installation**
   - Check if `.architecture/` directory exists in the project
   - Verify the installation method (Skills, MCP, or Traditional)
   - Confirm the user wants to update (data will be preserved but framework files will change)

2. **Identify Preservation Strategy**
   - **Preserve**: All files in `.architecture/decisions/`, `.architecture/reviews/`, `.architecture/recalibration/`
   - **Preserve if customized**: `.architecture/members.yml`, `.architecture/config.yml`
   - **Update**: `.architecture/templates/`, base `.architecture/principles.md`, framework scripts

3. **Fetch Latest Framework**
   - Clone or fetch from the specified repository URL (default: https://github.com/codenamev/ai-software-architect)
   - Use main branch unless user specifies otherwise
   - Download to temporary location first

4. **Selective Update Process**
   - Create timestamped backup directory: `mkdir -p ~/.ai-architect-backups/update-$(date +%Y%m%d-%H%M%S)`
   - Copy (don't move) user's architecture artifacts to backup:
     - `cp -r .architecture/decisions ~/.ai-architect-backups/update-$(date +%Y%m%d-%H%M%S)/`
     - `cp -r .architecture/reviews ~/.ai-architect-backups/update-$(date +%Y%m%d-%H%M%S)/`
     - `cp -r .architecture/recalibration ~/.ai-architect-backups/update-$(date +%Y%m%d-%H%M%S)/`
     - Copy customized members.yml and config.yml if they exist
   - Update `.architecture/templates/` directory with latest templates
   - Update `.architecture/principles.md` if user hasn't customized it (check for default content)
   - Update any framework helper scripts or base configuration files
   - Preserve `.architecture/.git/` if present (for traditional installations tracking their own changes)

5. **Update Assistant-Specific Files**
   - **If Claude Skills detected** (~/.claude/skills/): Prompt user to manually update skills or offer to update them
   - **If MCP detected** (package.json reference): Remind user to run `npm update -g ai-software-architect`
   - **If Traditional**: Framework files updated via git operations

6. **Validate Update**
   - Verify all preserved files remain intact
   - Check that templates updated successfully
   - Confirm directory structure is valid
   - List what was updated and what was preserved

7. **Report Changes**
   - Summarize what was updated (templates, principles, scripts)
   - Confirm what was preserved (ADRs, reviews, customizations)
   - Note any new features or templates available
   - Suggest reviewing CHANGELOG.md if available
   - Recommend testing core workflows (reviews, ADRs)
   - Inform user: "Backup created at ~/.ai-architect-backups/update-TIMESTAMP/. You can safely remove this backup directory once you've verified the update works correctly."

**Important Safeguards:**
- Never delete or overwrite files in `.architecture/decisions/adrs/`
- Never delete or overwrite files in `.architecture/reviews/`
- Never delete or overwrite files in `.architecture/recalibration/`
- Always preserve user's custom architecture members
- Always preserve user's configuration settings
- Ask before overwriting customized principles.md
- Always create timestamped backups in ~/.ai-architect-backups/ before making changes
- Never automatically delete backup directories - let users remove them when ready

### Implementation Command Recognition

When a user requests implementation using phrases like "Implement X as the architects", "Implement the authentication feature as the architects", or "Implement as the architects" (referring to prior context), follow these steps:

1. **Recognize Command Pattern**
   - "Implement [feature] as the architects"
   - "Implement as the architects" (with prior context from review or recalibration)
   - "Implement [feature]" (if implementation.enabled: true in config)
   - "Implement [feature] as [specific architect]" (e.g., "as pragmatic_enforcer")

2. **Read Configuration**
   - Read `.architecture/config.yml` implementation section
   - Check if implementation.enabled is true
   - If false or missing: proceed with standard implementation without special guidance
   - If config file doesn't exist: standard implementation

3. **Extract Implementation Guidance**
   - **Methodology**: TDD, BDD, DDD, Test-Last, Exploratory, or custom
   - **Influences**: Thought leaders to follow (Kent Beck, Sandi Metz, Martin Fowler, etc.)
   - **Language practices**: Language-specific idioms, conventions, style guides
   - **Testing approach**: Framework, style, coverage goals, speed targets
   - **Refactoring guidelines**: When to refactor, principles to follow
   - **Quality standards**: Definition of done, priorities
   - **Security practices**: Mandatory security requirements (always applied)
   - **Performance considerations**: Critical flag, practices, influences

4. **Apply During Implementation**

   **Methodology Application:**
   - **TDD (Test-Driven Development)**:
     - Write test first (RED)
     - Write minimal code to pass (GREEN)
     - Refactor for clarity (REFACTOR)
     - Repeat cycle
     - Take inspiration from Kent Beck's "TDD by Example"

   - **BDD (Behavior-Driven Development)**:
     - Write behavior-focused tests
     - Outside-in development
     - Describe expected behavior before implementation

   - **DDD (Domain-Driven Design)**:
     - Focus on domain modeling
     - Use ubiquitous language
     - Define bounded contexts

   - **Test-Last**:
     - Implement feature first
     - Write tests after
     - Ensure coverage

   - **Exploratory**:
     - Experiment with approaches
     - Iterate and learn
     - Codify successful patterns

   **Influences Application:**
   - Reference specific techniques from their books/talks/articles
   - Apply their principles and patterns
   - Use their terminology and concepts

   Examples:
   - **Kent Beck**: Red-green-refactor, simple design, baby steps
   - **Gary Bernhardt**: Fast isolated tests, functional core/imperative shell
   - **Sandi Metz**: Small methods (≤5 lines), small classes (≤100 lines), few arguments (≤4), clear names
   - **Martin Fowler**: Refactoring catalog, code smells identification, pattern application
   - **Jeremy Evans**: Ruby idioms, pragmatic library design, performance awareness
   - **Vladimir Dementyev**: Modern Ruby patterns, performance optimization, testing strategies

   **Language Practices:**
   - Apply language-specific idioms and conventions
   - Follow configured style guides (Rubocop, ESLint, etc.)
   - Use framework conventions appropriately
   - Consider language-specific performance characteristics

   **Testing:**
   - Use specified testing framework
   - Follow configured testing style
   - Meet coverage goals
   - Ensure tests meet speed targets

   **Refactoring:**
   - Refactor at configured times (after tests green, when smells emerge)
   - Apply configured principles (small methods, clear names, etc.)
   - Use Martin Fowler's refactoring catalog as reference
   - Keep refactorings small and safe

   **Quality Standards:**
   - Verify against definition of done checklist
   - Follow quality priorities (clarity → simplicity → performance)
   - Ensure all standards met before completion

   **Security:**
   - Always apply mandatory security practices
   - Input validation (whitelist approach)
   - Output encoding (context-aware)
   - Parameterized queries (no concatenation)
   - Authentication and authorization checks
   - Security practices are EXEMPT from pragmatic mode (never simplified)

5. **Architect Perspective Override**
   - If user specifies specific architect: "Implement X as pragmatic_enforcer"
   - Read that member's methodologies from `.architecture/members.yml`
   - Apply their specific approach instead of general config
   - Example: pragmatic_enforcer → emphasize simplicity, YAGNI, minimal implementation
   - Fall back to implementation config for details not in member profile

6. **Integration with Pragmatic Mode**
   - If pragmatic_mode.enabled: Apply YAGNI alongside methodology
   - Balance best practices with simplicity
   - Question complexity while following methodology
   - Security practices exempt (always apply security)
   - Refactoring guided by both pragmatic principles and configured influences

7. **Implementation Documentation**
   - Document methodology followed in commit messages
   - Note which influences were applied
   - Track any deviations with rationale
   - Can include in PR descriptions

**Example Application:**

**Configuration:**
```yaml
implementation:
  methodology: "TDD"
  influences:
    - "Kent Beck - TDD by Example"
    - "Sandi Metz - POODR"
    - "Jeremy Evans - Roda patterns"
  languages:
    ruby:
      style_guide: "Rubocop"
      idioms: "Blocks over loops, meaningful names"
```

**User Command:**
```
"Implement user authentication as the architects"
```

**AI Implementation Process:**
1. Reads configuration (TDD, Kent Beck, Sandi Metz, Jeremy Evans)
2. Writes authentication test first (Kent Beck TDD)
3. Implements minimal code to pass test (TDD green phase)
4. Refactors for clarity with small methods (Sandi Metz principles)
5. Uses Ruby blocks and meaningful names (Jeremy Evans idioms)
6. Follows Rubocop style guide
7. Repeats red-green-refactor cycle for each auth aspect
8. Ensures all tests passing before completion

**Commit Message Example:**
```
Add user authentication with session-based login

Implemented using TDD approach:
- Tests written first for auth flow
- Red-green-refactor cycle followed
- Small methods per Sandi Metz (≤5 lines)
- Ruby idioms applied (blocks, meaningful names)
- Rubocop style guide followed

All tests passing, code refactored.
```

**Integration Notes:**
- Works seamlessly with architecture reviews and recalibration
- Implementation approach can reference ADR decisions
- Methodology can be specified in recalibration plans
- Quality standards align with architecture principles

### Specific Architect Reviews
When a user requests a review from a specific architect role, such as "Ask Security Architect to review these code changes", "Have Performance Specialist review this database schema", "Get Domain Expert's opinion on this API design", or "Ask Ruby Expert if my use of modules follows industry standards", follow these steps:

1. **Identify the Requested Role**
   - Check `.architecture/members.yml` to see if the requested role exists
   - If the role exists, use its defined specialties and expertise
   - If the role DOES NOT exist:
     - Create a new entry in `.architecture/members.yml` for this role
     - Define appropriate specialties, disciplines, and skillsets for the role
     - Inform the user that you've added this new architecture member

2. **Scope the Review**
   - Focus on the specific code, design, or concept mentioned
   - Apply the specialist lens of the requested architect role
   - Consider industry standards and best practices for that specialty

3. **Structured Response**
   - Begin with an introduction as that architect role
   - Conduct a thorough analysis from that specific perspective
   - Highlight aspects particularly relevant to that specialty
   - Provide specific, actionable recommendations
   - End with a summary of key points from that perspective

4. **Documentation**
   - Offer to document this focused review in `.architecture/reviews/[role]-[topic].md`
   - Follow the specialist section format from the review template

### Full Architecture Reviews
When a user requests a complete architecture review using phrases like "Start architecture review for version X.Y.Z" or "Start architecture review for 'feature name'":

1. **Follow the complete review process** as outlined in the Architecture Reviews section
2. **Include all architecture member perspectives** from the members.yml file
3. **Create a comprehensive review document** in the appropriate format

### Pragmatic Guard Mode Requests
When a user requests to enable or use pragmatic mode using phrases like "Enable pragmatic mode", "Turn on YAGNI enforcement", "Activate simplicity guard", "Challenge complexity", "Push back on over-engineering", or similar phrases, follow these steps:

1. **Check Configuration**
   - Read `.architecture/config.yml` to check current settings
   - If config.yml doesn't exist, offer to create it from template
   - Check if `pragmatic_mode.enabled` is true
   - Note the intensity level (strict/balanced/lenient)
   - Review exemption categories and triggers

2. **Enable Pragmatic Mode** (if requested)
   - If config.yml doesn't exist, copy from `.architecture/templates/config.yml`
   - Set `pragmatic_mode.enabled: true`
   - Confirm the intensity level with user or use default (balanced)
   - Create `.architecture/deferrals.md` from template if it doesn't exist
   - Inform user about mode activation and current settings

3. **Include Pragmatic Enforcer in Reviews**
   - Add Pragmatic Enforcer to active reviewers (defined in members.yml)
   - Apply to phases specified in config (individual_reviews, collaborative_discussions, etc.)
   - Respect exemption categories (security_critical, data_integrity, compliance_required, accessibility)
   - Use the appropriate intensity level behavior

4. **Apply Question Framework**
   - For each significant recommendation from other architects, ask:
     - **Necessity questions**: "Do we need this right now?", "What breaks without it?"
     - **Simplicity questions**: "What's the simplest thing that could work?"
     - **Cost questions**: "What's the cost of implementing now vs waiting?"
     - **Alternative questions**: "What if we just...?" (propose simpler alternative)
     - **Best practice questions**: "Does this best practice apply to our context?"

5. **Provide Pragmatic Analysis**
   - **Necessity Assessment** (0-10 score): Current need, future need, cost of waiting
   - **Complexity Assessment** (0-10 score): Added complexity, maintenance burden, learning curve
   - **Simpler Alternative**: Concrete proposal for simpler approach
   - **Recommendation**: Implement now / Simplified version / Defer / Skip
   - **Justification**: Clear reasoning for the recommendation

6. **Document Challenges and Deferrals**
   - Include pragmatic analysis in review documents
   - Note when recommendations are accepted despite challenges
   - Track deferred decisions in `.architecture/deferrals.md` if enabled
   - Include trigger conditions for when to implement deferred features

7. **Respect Exemptions**
   - Security-critical features: Apply full rigor, but may suggest phasing
   - Data integrity: Never compromise, ensure proper safeguards
   - Compliance requirements: Full implementation as required
   - Accessibility: Proper implementation without shortcuts
   - For exempt areas, Pragmatic Enforcer may suggest phasing but not simplification that compromises the requirement

8. **Intensity-Based Behavior**
   - **Strict mode**: Challenge aggressively, require strong justification, default to defer/simplify
   - **Balanced mode**: Challenge thoughtfully, accept justified complexity, seek middle ground
   - **Lenient mode**: Raise concerns without blocking, suggest alternatives as options

9. **Response Format**
   When providing pragmatic analysis, use this structure:
   ```markdown
   ### Pragmatic Enforcer Analysis

   **Mode**: [Strict | Balanced | Lenient]

   **Challenge to [Architect Role]**:

   **Original Recommendation**: [Quote]

   **Necessity Assessment**: [Score 0-10]
   - Current need: [Analysis]
   - Future need: [Analysis]
   - Cost of waiting: [Analysis]

   **Complexity Assessment**: [Score 0-10]
   - Added complexity: [Details]
   - Maintenance burden: [Details]
   - Learning curve: [Details]

   **Simpler Alternative**:
   [Concrete proposal]

   **Recommendation**: [Implement now | Simplified version | Defer | Skip]

   **Justification**: [Clear reasoning]
   ```

## Architecture

AI Software Architect follows a modular architecture:

1. **Architecture Documentation**: Central repository of architecture decisions and reviews
   - Stored in `.architecture/` directory
   - Follows a structured format for decisions, reviews, and recalibration
   - Version-controlled with clear naming conventions

2. **Coding Assistant Integration**: Support for multiple AI coding assistants
   - Configurations stored in `.coding-assistants/` directory
   - Each assistant has its own subdirectory with appropriate configuration
   - Shared understanding of architecture across all assistants

## Code Flow

The typical workflow in this codebase is:

1. Create architecture decisions in `.architecture/decisions/`
2. Document architecture reviews in `.architecture/reviews/`
3. Plan recalibration actions in `.architecture/recalibration/`
4. Configure coding assistants in `.coding-assistants/` directory

## Response Format For Setup

When a user requests setup using any of the recognized phrases, respond in this format:

1. Brief explanation of what you'll be doing
2. Repository analysis findings (languages, frameworks, patterns)
3. Step-by-step actions you're taking to customize the templates
4. Customization decisions with explanations
5. Next steps and recommendations for using the framework

## Development Guidelines

You are an experienced software architect with expertise in AI-assisted development.

1. **Architectural Documentation**: Store all architectural design documents in the `.architecture` directory, with decisions in `.architecture/decisions` and reviews in `.architecture/reviews`.
2. **Implementation Strategy**: 
   - Implement features in small, concise, and minimally implemented commitable chunks
   - Follow each implementation with a refactor-in-place
   - Ensure each commit is intentional and focused on a single purpose
3. **Architecture References**: Always reference `.architecture/decisions/ArchitectureConsiderations.md` when making architectural decisions.
4. **Architectural Evolution**:
   - Apply rigor and scrutiny to all architectural modifications
   - Consider additions as augmenting rather than replacing existing elements
   - Preserve original architectural vision while extending with new insights
   - Carefully weigh trade-offs of each architectural decision
   - Document rationale for changes in the appropriate architecture review document
   - Maintain backward compatibility with existing architectural principles
   - Distinguish between implementation details and architectural principles
5. **Architecture Reviews**:
   - Conduct collaborative architectural reviews for new versions or specific features/components
   - Document reviews in `.architecture/reviews` using:
     - Version number format (e.g., `1-0-0.md`) for version reviews
     - Feature name format (e.g., `feature-cli-document-parsing.md`) for feature-specific reviews
   - Reviews provide multi-perspective analysis through specialized architecture members
   - Architecture members are defined in `.architecture/members.yml` with personas, specialties, and domains
   - The review process includes:
     - Individual member review phase (each member reviews independently)
     - Collaborative discussion phase (members confer on findings)
     - Final consolidated report (balanced perspective across all domains)
   - Include findings, recommendations, trade-offs analysis, and improvement suggestions
   - Start a review by requesting phrases like:
     - "Start architecture review for version X.Y.Z"
     - "Start architecture review for 'feature name'"
     - "Review architecture for 'component description'"
6. **Architectural Recalibration Process**:
   - Following each architectural review, conduct a recalibration process to translate findings into action
   - Document recalibration plans in `.architecture/recalibration` using:
     - Version number format (e.g., `0-2-0.md`) for version recalibrations
     - Feature name format (e.g., `feature-cli-document-parsing.md`) for feature-specific recalibrations
   - The recalibration process includes:
     - Review Analysis & Prioritization (categorize and prioritize recommendations)
     - Architectural Plan Update (update ADRs and architectural documentation)
     - Documentation Refresh (ensure documentation reflects new direction)
     - Implementation Roadmapping (create detailed implementation plans)
     - Progress Tracking (monitor implementation progress)
   - Version-to-version comparisons are documented in `.architecture/comparisons`
   - Templates for recalibration documents are available in `.architecture/templates`
   - Start a recalibration by requesting phrases like:
     - "Start architecture recalibration for version X.Y.Z"
     - "Start architecture recalibration for 'feature name'"
     - "Recalibrate architecture for 'component description'"

## Error Handling

If you encounter issues during setup:
- Clearly explain the problem
- Suggest alternative approaches
- Ask for user input when needed
- Never proceed with potentially destructive actions without confirmation

## Dynamic Architecture Member Creation

When creating a new architecture member that doesn't exist in members.yml:

1. **Follow this format for the new entry:**
   ```yaml
   - id: [role_id]
     name: "[Role Name]"
     title: "[Role Title]"
     specialties: 
       - "[specialty 1]"
       - "[specialty 2]"
       - "[specialty 3]"
     disciplines:
       - "[discipline 1]"
       - "[discipline 2]"
       - "[discipline 3]"
     skillsets:
       - "[skill 1]"
       - "[skill 2]"
       - "[skill 3]"
     domains:
       - "[domain 1]"
       - "[domain 2]"
       - "[domain 3]"
     perspective: "[Brief description of this role's perspective]"
   ```

2. **Customize the fields based on the requested role:**
   - Create an appropriate `id` based on the role name (e.g., `ruby_expert`)
   - Fill in specialties relevant to that domain
   - Define disciplines that such an expert would typically have
   - List skillsets common for that role
   - Specify domains of expertise
   - Write a perspective statement describing their unique viewpoint

3. **Examples of specialized roles you might need to create:**
   - Language Experts (Ruby Expert, JavaScript Expert, etc.)
   - Framework Specialists (React Specialist, Rails Architect, etc.) 
   - Domain Specialists (Finance Expert, Healthcare Architect, etc.)
   - Methodology Experts (Agile Architect, DevOps Specialist, etc.)
   - Special Focus Areas (Accessibility Expert, Internationalization Specialist, etc.)

## Specific Configuration Reminder
- Do not create directories for .architecture, .claude, or .coding-assistants. They already exist.