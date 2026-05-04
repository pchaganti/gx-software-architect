# ADR-012: Claude Plugin Distribution and Configuration Hardening

## Status

Proposed

**Decision Date**: 2026-04-14
**Supersedes**: None
**Extends**: [ADR-011](ADR-011-claude-marketplace-plugin-implementation.md) — Claude Marketplace Plugin Implementation

## Context

A Claude Code configuration audit of the framework (conducted 2026-04-14) identified five gaps between the repository's current state and 2026 Claude Code best practices. ADR-011 established the plugin distribution channel but shipped a minimal `.claude-plugin/plugin.json` that wires up only the MCP server. The audit findings:

1. **Plugin skill distribution is broken.** Skills live under `.claude/skills/` (project-local convention). Claude Code plugins load skills from `skills/` at the plugin root. Users installing via `/plugin marketplace add` receive the MCP server but **none of the seven skills**. The skills channel and the plugin channel currently work only for cloners.

2. **No `agents/` subagents.** The framework's core abstraction — architecture team members defined in `.architecture/members.yml` — is the textbook use case for Claude Code subagents. Today, "persona adoption" is handled via in-prompt instructions, which is brittle (context-dependent), token-heavy (personas are re-described each invocation), and cannot use `context: fork` isolation.

3. **CI simulates Claude rather than exercising it.** `.github/workflows/claude-code-tests.yml` is 419 lines of bash that regex-matches natural-language patterns and `echo`s file contents to assert "Claude would recognize this." It never runs `claude -p` or loads a SKILL.md. Genuine regressions in skill descriptions or plugin loading would pass the suite.

4. **Permissions hygiene drift.** `.claude/settings.local.json` allows `Bash(find:*)`, `Bash(grep:*)`, `Bash(ag:*)` — directly contradicting the project's own guidance to prefer the `Glob`/`Grep` tools. There is no tracked `.claude/settings.json` for team-shared permissions (e.g., pre-approving `mcp__ai-software-architect__*` tools), so every contributor pays an approval tax for tools the repo itself ships.

5. **No `hooks/hooks.json`.** ADR template compliance is enforced only at human-review time; malformed ADRs reach commits. A `PostToolUse` hook on `.architecture/decisions/adrs/**` could validate frontmatter, required sections, and filename format deterministically.

**Scope boundary**: This ADR does not re-open the plugin distribution decision (ADR-011). It fixes the implementation of that decision and closes the gap between "plugin exists" and "plugin is fully featured and correct."

## Decision Drivers

* **Correctness**: Users installing the plugin should receive the advertised functionality. Today they receive ~20% of it (MCP only).
* **Coherence**: The `members.yml` abstraction predates subagents. Now that subagents exist, re-expressing members as subagents eliminates a whole class of prompt-engineering failure modes.
* **TDD feasibility**: Some phases are testable (hook validator, subagent generator); others are structural (file moves, settings JSON). The plan should TDD what is testable and smoke-test the rest — not force unit tests onto config files.
* **Reversibility**: Every change should be individually revertable. No "big-bang" restructure.
* **Consistency with project principles**: Project instructions say "use Grep/Glob tools over shell grep"; the committed permissions should reflect that.
* **CI signal quality**: CI failures should indicate a real plugin regression, not a mismatched regex.

## Decision

Restructure and harden the Claude Code plugin surface of the repository in five sequential phases, each landed as an independent commit with its own tests (where testable) and rollback path.

**Phase 1 — Plugin skill distribution (structural)**
Move `.claude/skills/` to `skills/` at the repository root so that `/plugin install` loads them. Keep a minimal `.claude/` for local-only artifacts (e.g., `settings.local.json`). Update `.claude-plugin/plugin.json` and `marketplace.json` version to reflect the structural change. Validate with `claude --plugin-dir ./` loading the plugin and listing all seven skills.

**Also retire the legacy cp-based "Claude Skills" install path.** The pre-plugin install method (`git clone … && cp -r .../skills ~/.claude/skills/`) was a sibling distribution channel before ADR-011. Post-plugin, it is a strict subset of plugin installation: it ships skills but not the MCP server, settings, hooks, or generated subagents. Documenting two install paths that deliver different feature sets is a sustained source of confusion. Phase 1 removes the cp-based "Option 2: Claude Skills" section from README, replaces `USAGE-WITH-CLAUDE-SKILLS.md` with a short redirect to `USAGE-WITH-CLAUDE-PLUGIN.md`, and drops the "Skills" column from the installation-method comparison table. The plugin remains the canonical Claude Code distribution; the MCP-only and traditional-clone options are unaffected.

**Phase 2 — Tracked `settings.json` and permissions cleanup (config)**
Create tracked `.claude/settings.json` pre-approving `mcp__ai-software-architect__*` tools and the skills this repo ships. Remove `Bash(find:*)`, `Bash(grep:*)`, `Bash(ag:*)` from `settings.local.json`. Validated by JSON-schema lint and manual inspection; no unit tests.

**Phase 3 — ADR validation hook (`hooks/hooks.json` + validator script)**
Add a Node.js validator script at `tools/validate-adr.js` that checks ADR files for: correct filename format (`ADR-\d{3}-[a-z0-9-]+\.md`), required sections (Status, Context, Decision, Consequences), status enum, and frontmatter-free markdown. Wire it via `hooks/hooks.json` as a `PostToolUse` hook with matcher `.architecture/decisions/adrs/**`. **TDD: write failing tests covering each validation rule before implementing the validator.** Package-level `npm test` runs the validator test suite.

**Phase 4 — Subagent generator from `members.yml`**
Add `tools/generate-subagents.js` that reads `.architecture/members.yml` and emits one subagent markdown file per member to `agents/{member-id}.md` with frontmatter (`name`, `description`, `tools`) derived from the member's specialties/perspective. Generated subagents are committed (not runtime-generated) so the plugin ships with them. **TDD: tests drive the generator on fixture `members.yml` files and assert output structure.** Running the generator on the real `members.yml` updates `agents/` and is verified by the existing test suite plus a golden-file snapshot.

**Phase 5 — Replace CI simulation with real Claude invocation**
Rewrite `.github/workflows/claude-code-tests.yml` to:
1. Keep the fixture-project matrix (nodejs/rails/python/generic).
2. Install the Claude Code CLI.
3. Run `claude --plugin-dir ./ -p "<test prompt>"` against each fixture and assert on exit status plus a small set of output contains-checks (e.g., "created ADR-001", "loaded 7 skills").
4. Gate on `anthropics/claude-code-action` availability — if the action is not stable, fall back to a documented manual test plan in the workflow file so the workflow does not silently no-op.

No tests are added for Phases 1, 2, or 5 beyond what the Claude CLI itself provides. The user has explicitly accepted "fully testing many aspects of this is not possible" as a trade-off.

**Architectural Components Affected:**
* `.claude-plugin/plugin.json` and `marketplace.json` (version bumps, possibly additional fields)
* `.claude/skills/*` → `skills/*` (file moves)
* `.claude/settings.json` (new, tracked)
* `.claude/settings.local.json` (permissions cleanup)
* `hooks/hooks.json` (new)
* `tools/validate-adr.js` + tests (new)
* `tools/generate-subagents.js` + tests (new)
* `agents/*.md` (new, generated)
* `.github/workflows/claude-code-tests.yml` (rewrite)
* `package.json` (add `test` script and any dev-deps for test runner)

**Interface Changes:**
* Plugin installation now delivers skills, subagents, hooks, and MCP server together. Users on previous plugin versions will gain functionality without manual steps.
* Framework-wide commitment that every ADR passes `validate-adr.js` before commit. Non-compliant historical ADRs (if any) will be fixed in Phase 3.

## Consequences

### Positive

* Plugin installation delivers the full advertised feature set. The plugin channel from ADR-011 becomes credible rather than partial.
* Subagents replace brittle in-prompt persona adoption with Claude Code-native primitives, preserving main-context tokens via `context: fork`.
* Permissions hygiene aligns `.claude/settings*.json` with the project's own conventions (Grep/Glob over shell grep).
* ADR validation becomes deterministic and shifted-left; malformed ADRs fail before merge rather than at review time.
* CI begins producing real signal about plugin loadability and skill triggering rather than regex self-congratulation.
* The tests added in Phases 3 and 4 are the first true unit tests for the plugin surface — they form a foundation for adding more as features grow.

### Negative

* Moving `.claude/skills/` → `skills/` is a file-path break for anyone who cloned the repo and referenced the old path in external tooling. Mitigation: version bump and CHANGELOG entry.
* Retiring the cp-based install method is a documented behavior break for users who scripted that flow. Mitigation: CHANGELOG calls out the migration to `/plugin marketplace add`; the cp recipe still works (the directory simply moves) but is no longer documented or supported.
* Subagent generation introduces a build step — if a contributor edits `members.yml` without regenerating, the committed `agents/*.md` drifts. Mitigation: the generator test suite fails if committed files don't match `members.yml`, forcing regeneration in CI.
* Phase 5's real-CLI CI is heavier than a bash simulation (downloads Claude, consumes API credits if the action requires live calls). Mitigation: gate expensive checks to `main` pushes; use fixture-only prompts where possible.
* Phases 3 and 4 introduce the first Node test runner to a project whose only current code is `cli.js` and `mcp/index.js`. This is new infrastructure.

### Neutral

* `tools/` directory gains two scripts alongside its existing contents; no restructure needed.
* `members.yml` remains the source of truth. The generator is one-way; no information flows back.
* The hook only fires locally and in CI for contributors running Claude Code — it does not replace human review of ADR quality.

## Implementation Strategy

### Blast Radius

**Impact Scope**: Medium. Changes affect every installed plugin instance (~unknown count but nontrivial given ADR-011's marketplace push), the CI pipeline, and every future ADR authoring flow.

**Affected Components**:
- Plugin installation (Phase 1) — affects all plugin users
- Local dev permissions (Phase 2) — affects all contributors
- ADR authoring (Phase 3) — affects all ADR authors in this repo and any downstream project that adopts the hook
- Subagent surface (Phase 4) — affects any user invoking architecture review/specialist review
- CI (Phase 5) — affects all PRs

**Affected Teams**: Solo maintainer; downstream users learn via CHANGELOG and version bump.

**User Impact**: Plugin users gain features; they lose no prior functionality. Contributors gain stricter ADR validation — a minor friction addition that should be net-positive.

**Risk Mitigation**:
- Every phase is an independent commit with its own revert path.
- Phase 1 validated with `claude --plugin-dir ./` locally before publishing.
- Phase 5 starts behind a `workflow_dispatch` flag before being merged into PR triggers.

### Reversibility

**Reversibility Level**: High per-phase; Medium for the full change.

**Rollback Feasibility**:
- Phases 1, 2, 3, 5 are single-commit reverts.
- Phase 4 is reversible but leaves generated `agents/*.md` files that must be deleted.
- Skill path break in Phase 1 is the only hard commitment — mitigated by being a minor version bump with clear CHANGELOG.

**Migration Paths**:
- **Forward Migration**: Sequential commits in order 1 → 2 → 3 → 4 → 5.
- **Rollback Migration**: `git revert` the offending commit; if full rollback is required, revert phases in reverse order.
- **Evolution Path**: Once the pattern is established, additional hooks, subagents, and skills can be added without re-visiting structure.

**Options Preserved**:
- Switching hook validator from Node to another runtime later (shell, Python) is a drop-in replacement.
- Adding more generated subagents (e.g., per-project-type experts) uses the same generator.

**Commitments Made**:
- Plugin root becomes the canonical skills location (matches Claude Code convention).
- `members.yml` as source of truth for subagents is now enforced by CI.

### Sequencing & Timing

**Prerequisites**:
- [x] ADR-011 accepted (plugin distribution channel exists)
- [x] Node.js available in repo (for validator/generator scripts)
- [ ] Agreement on test runner for new scripts (proposal: Node's built-in `node:test` — zero-dep)

**System Readiness**:
- **Observability**: Adequate. Plugin loading failures surface in Claude Code UI; CI surfaces script failures.
- **Dependencies**: None new expected beyond `node:test` (built-in).
- **Infrastructure**: None.
- **Data Migration**: None — ADRs already conform to the validator's expected format (verified in Phase 3 before hook activation).

**Team Readiness**: Solo maintainer familiar with all layers. No training needed.

**Sequencing Concerns**: Phase 1 must precede Phase 5 (CI tests need the plugin to be loadable from root). Phase 3 should precede Phase 4 to establish the test-runner pattern. Phase 2 is independent and could move to any slot but is cheap so it lands early.

**Readiness Assessment**: Ready to implement.

### Social Cost

**Learning Curve**: Low.
- Subagent authoring is documented in Claude Code docs.
- Hook validator and subagent generator are straightforward Node scripts.

**Cognitive Load**: Modest increase — contributors must now know that `members.yml` edits require `npm run generate:agents` and that ADR authoring is validated. Both are discoverable via CI failures.

**Clarity Assessment**:
- **Will this help more than confuse?**: Yes. The current state — "skills are here but not really there" — is more confusing than having a single canonical location.
- **Explanation required**: One paragraph in CONTRIBUTING-style docs (or CLAUDE.md) explaining the `members.yml` → `agents/` generation step.
- **Onboarding impact**: Net positive. A new contributor sees a plugin that works as advertised and CI that tests it.

**Documentation Needs**:
- [ ] CHANGELOG entry for Phase 1 structural move
- [ ] README note on `agents/` being generated from `members.yml`
- [ ] Inline docstring in validator listing enforced rules

### Confidence Assessment

**Model Correctness Confidence**: High.
- Claude Code plugin structure is well documented and the audit cited specific failure modes, not speculative ones.
- Subagent-from-members mapping is a direct translation, not a novel abstraction.

**Assumptions**:
1. `claude-code-action` (or equivalent CLI install) is stable enough to run in GitHub Actions by 2026-04. **Validation**: Checked in Phase 5 with a soft-fail fallback plan.
2. The Node built-in `node:test` runner is acceptable for this project (no existing test infrastructure to conflict with). **Validation**: Verify during Phase 3 kickoff; fall back to a minimal custom runner if needed.
3. Existing ADRs pass the validator on first run. **Validation**: Phase 3 test suite runs the validator against `.architecture/decisions/adrs/*.md` as a fixture set before the hook is enabled.
4. Subagent descriptions generated from `perspective` text are specific enough for Claude's triggering heuristics. **Validation**: Phase 4 smoke-tests against at least two invocation prompts per subagent.

**Uncertainty Areas**:
- Whether `context: fork` is the right isolation mode for every subagent, or only for a subset (e.g., reviews but not single-member Q&A).
- Whether the ADR validator should hard-fail or warn-only on historical ADRs; decided as "warn-first, fail-on-new" to avoid blocking retroactive fixes.

**Validation Approach**:
- Each phase ships with its own validation step; all five are individually revertable if validation fails.
- Phase 4 golden-file snapshot guards against silent subagent drift.
- Phase 5 provides the end-to-end smoke test for the whole stack.

**Edge Cases**:
- A user with a modified local `members.yml` would regenerate different subagents; the hook-check-on-CI catches any drift between committed files and source of truth.
- Hook validator runs on every ADR write — performance is not a concern at this scale (dozens of ADRs, not thousands).

## Implementation

**Phase 1: Plugin Skill Relocation**
* Move `.claude/skills/` to `skills/` via `git mv`.
* Update `plugin.json` version (`1.3.0` → `1.4.0`) and any internal path references in skills or docs.
* Validate: `claude --plugin-dir ./` lists all seven skills.
* Commit: `refactor(plugin): relocate skills to plugin root for correct plugin loading`.

**Phase 2: Tracked settings.json and Permissions Cleanup**
* Create `.claude/settings.json` with `permissions.allow` containing `mcp__ai-software-architect__*`, `Skill(architecture-*)`, `Skill(create-adr)`, `Skill(list-members)`, `Skill(pragmatic-guard)`, `Bash(npm test:*)`, `Bash(node tools/*:*)`.
* Remove `Bash(find:*)`, `Bash(grep:*)`, `Bash(ag:*)` from `settings.local.json`.
* Validate: JSON parses; permissions remain sufficient for common workflows.
* Commit: `chore(claude): track team permissions and drop shell grep allows`.

**Phase 3: ADR Validation Hook (TDD)**
* Add `tools/validate-adr.test.js` with failing tests for each validation rule.
* Implement `tools/validate-adr.js` until tests pass.
* Run validator against all existing ADRs; fix any that fail (or widen rules if the mismatch reveals an acceptable variant).
* Add `hooks/hooks.json` wiring `PostToolUse` matcher on `.architecture/decisions/adrs/**`.
* Add `npm test` entry to `package.json` if not present.
* Commit: `feat(hooks): add ADR validation hook with test suite`.

**Phase 4: Subagent Generator from members.yml (TDD)**
* Add `tools/generate-subagents.test.js` with tests driving expected subagent output from a fixture `members.yml`.
* Implement `tools/generate-subagents.js` until tests pass.
* Run generator on real `.architecture/members.yml`; commit generated `agents/*.md`.
* Add a CI check (or hook) asserting that `agents/*.md` matches what the generator would produce from `members.yml`.
* Commit: `feat(agents): generate subagents from members.yml`.

**Phase 5: Real Claude Code CI Workflow**
* Rewrite `.github/workflows/claude-code-tests.yml` to install Claude Code and run `claude -p` smoke tests against each project fixture.
* If `claude-code-action` is stable, use it; otherwise call the CLI directly and document the fallback.
* Remove the regex-simulation assertions.
* Commit: `ci(claude): replace simulation with real Claude CLI smoke tests`.

## Alternatives Considered

### Alternative 1: Do nothing; document known limitations

Accept that the plugin channel ships only the MCP server and that skills are installed via Claude Skills separately.

**Pros:**
* Zero churn.
* No new infrastructure (test runner, hooks, generator).
* No CI credit spend.

**Cons:**
* Permanently splits what ADR-011 framed as a unified plugin into two install paths users must understand.
* Leaves subagents unshipped — a first-class Claude Code primitive unused by the framework whose whole premise is "architecture as personas."
* Leaves CI regex-simulation in place, providing false confidence.
* The audit gaps will keep getting flagged by anyone running a similar review.

### Alternative 2: Monorepo split — extract plugin to its own repo

Move plugin-only files to a sibling repo (e.g., `ai-software-architect-plugin`) and keep this repo focused on the framework docs and MCP server.

**Pros:**
* Clean boundaries; plugin versioning independent from framework.
* Smaller blast radius per change.

**Cons:**
* Dramatically higher cost (two repos, two CI pipelines, cross-repo release coordination) for a solo-maintained project.
* Splits the documentation that currently benefits from co-location.
* ADR-011 explicitly chose the single-repo plugin strategy.

### Alternative 3: Runtime subagent synthesis instead of generated files

Keep `members.yml` as the only source; have `cli.js` or the MCP server synthesize subagents at install time.

**Pros:**
* No build-step drift risk.
* `members.yml` remains the single source of truth with no generated artifacts in git.

**Cons:**
* Claude Code plugins load `agents/*.md` statically at install; there is no "install-time codegen" hook. Runtime synthesis would require the plugin to become an installer itself.
* Much more complex than a one-way generator.
* Breaks the "subagents are just files" mental model that the rest of the ecosystem depends on.

## Pragmatic Enforcer Analysis

**Reviewer**: Pragmatic Enforcer
**Mode**: Balanced

**Overall Decision Complexity Assessment**:
This decision pushes complexity up (five phases, new test infrastructure, new generator, new hook) to pay down complexity elsewhere (removing in-prompt persona adoption, replacing regex CI, closing a distribution gap). It is not speculative — every phase responds to a concrete audit finding, and none of the phases build for a hypothetical future. The risk is scope creep: bundling "also add output styles," "also add a statusline," "also add a commands/ directory" would tip this from appropriate to over-engineered. The current scope resists that temptation by deferring those additions.

**Decision Challenge**:

**Proposed Decision**: "Restructure and harden the Claude Code plugin surface of the repository in five sequential phases."

**Necessity Assessment**: 8/10
- **Current need**: Phases 1 and 4 address concrete "feature is broken or absent" gaps. Phase 2 fixes a live contradiction with project conventions. Phases 3 and 5 are quality-of-life but less urgent.
- **Future need**: Deferring Phase 1 means ADR-011's plugin channel remains partly broken indefinitely — this is not a "future" concern, it is a present one.
- **Cost of waiting**: Every plugin install in the interim ships a degraded experience. Every ADR authored in the interim can bypass validation. Every CI run in the interim produces noise, not signal.
- **Evidence of need**: The audit (conducted 2026-04-14) documents each gap with specific line references and concrete failure modes.

**Complexity Assessment**: 6/10
- **Added complexity**: Test runner infrastructure, generator script, validator script, hook config, subagent files, CI rewrite. Nontrivial but all bounded and unsurprising.
- **Maintenance burden**: Generator + hook must be maintained as `members.yml` evolves and the ADR template evolves. Both changes are rare.
- **Learning curve**: Low — all primitives (Node tests, hooks, subagents) are standard Claude Code idioms.
- **Dependencies introduced**: Ideally zero new npm deps (use `node:test`). One new CLI dependency (Claude Code) in CI.

**Alternative Analysis**:
The "do nothing" and "monorepo split" alternatives were considered and rejected. A "minimum phase" alternative — just Phase 1 — was considered implicitly: do only the broken thing, defer everything else. That is explicitly captured as the fallback below.

**Simpler Alternative Proposal**:
**Minimal viable alternative**: Land **Phase 1 only** (move skills to plugin root). That alone closes the "broken plugin channel" gap — the most critical finding. Phases 2-5 can be deferred and picked up individually as triggered by future audits, regressions, or contributor pain points.

**Recommendation**: ⚠️ Approve with simplifications

**Justification**:
Phase 1 is unambiguously necessary and should ship immediately. Phases 2-5 are each defensible on their own merits but are not all equally urgent, and bundling them into a single arc creates pressure to ship them together even if one encounters unforeseen complexity. The recommended simplification is **structural**: land each phase as its own commit with its own tests, and treat the ADR as a roadmap rather than an atomic commitment. If Phase 3 (say) turns out to require a test framework choice that is contentious, pause there without blocking Phases 1 and 2.

**If Deferring or Simplifying**:
- **Trigger conditions**: Defer Phase 5 (real-CLI CI) if `claude-code-action` is not stable enough to avoid CI flakiness. Defer Phase 4 (subagent generator) if Claude Code's subagent triggering heuristics turn out to fire unreliably on generated descriptions.
- **Minimal viable alternative**: Phase 1 alone closes the highest-priority gap.
- **Migration path**: The phases are independently landable, so deferral does not require re-architecting.

**Pragmatic Score**:
- **Necessity**: 8/10
- **Complexity**: 6/10
- **Ratio**: 0.75 *(Target: <1.5 — well within balanced mode)*

**Overall Assessment**:
Appropriate engineering for concrete, audit-identified problems. The phased structure and explicit simplification fallback keep this from tipping into over-engineering. Green-light with the expectation that phases will be evaluated independently during execution, not rubber-stamped as a package.

## Validation

**Acceptance Criteria:**
- [ ] Phase 1: `claude --plugin-dir ./` loads the plugin and lists all seven skills by name.
- [ ] Phase 2: `.claude/settings.json` parses as valid JSON; `settings.local.json` no longer contains `find`/`grep`/`ag` allows; common workflows in this repo do not require new per-command approvals.
- [ ] Phase 3: `node --test tools/validate-adr.test.js` passes; running `validate-adr.js` against every file in `.architecture/decisions/adrs/` exits 0; hook fires on a test ADR edit.
- [ ] Phase 4: `node --test tools/generate-subagents.test.js` passes; running the generator on `members.yml` produces `agents/*.md` for every non-mode-specific member; a CI check asserts committed files match generator output.
- [ ] Phase 5: CI workflow invokes Claude Code against each fixture project and asserts on real output rather than regex over natural-language patterns.

**Testing Approach:**
* **TDD where testable**: Phases 3 and 4 write failing tests first, then implement.
* **Smoke-test where not unit-testable**: Phases 1, 2, and 5 rely on running Claude Code (or equivalent CLI validation) against the result and asserting observed behavior.
* **Golden file**: Phase 4 commits a snapshot of generator output so drift is caught by a simple diff, not by re-running the generator in CI alone.
* **Revert-safety**: Every phase is a single commit; each can be reverted without affecting the others.

## References

* [ADR-011: Claude Marketplace Plugin Implementation](ADR-011-claude-marketplace-plugin-implementation.md) — the distribution channel this ADR hardens
* [ADR-007: Tool Permission Restrictions for Skills](ADR-007-tool-permission-restrictions-for-skills.md) — informs Phase 2 permissions scoping
* [ADR-008: Progressive Disclosure Pattern for Large Skills](ADR-008-progressive-disclosure-pattern-for-large-skills.md) — informs skill structure preserved during Phase 1 move
* [ADR-005: LLM Instruction Capacity Constraints](ADR-005-llm-instruction-capacity-constraints.md) — motivates Phase 4 (subagents preserve main-context tokens via `context: fork`)
* Claude Code best-practices audit, 2026-04-14 (conversation-local; not persisted as a separate document)
