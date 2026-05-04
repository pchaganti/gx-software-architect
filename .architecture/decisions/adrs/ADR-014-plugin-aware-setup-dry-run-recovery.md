# ADR-014: Plugin-Aware Setup with Dry-Run and Recovery

## Status

Accepted

**Decision Date**: 2026-05-03
**Implementation status**: Change A implemented (1.5.2). Change B conditional, evaluated post-A. Change C deferred until triggered by user reports.
**Extends**: [ADR-012](ADR-012-claude-plugin-distribution-hardening.md), [ADR-013](ADR-013-skill-orchestrator-subagent-delegation.md)
**Triggered by**: 2026-05-03 setup-process DevX audit (1.5.1 release notes)

## Context

The 1.5.1 setup-process audit identified three distinct issues in the `setup-architect` skill, of which only one is addressed in 1.5.1 (and only as documentation):

**1. The skill describes the wrong installation path for plugin users.** Pre-1.4.0, users manually `git clone`'d the framework into `.architecture/.architecture/` and the skill copied templates from there. Post-1.4.0, the canonical install is the Claude Code plugin (`/plugin marketplace add codenamev/ai-software-architect`); the framework's templates ship inside the installed plugin directory. The skill's instructions still center on the clone-based flow. 1.5.1 added prose acknowledging both paths, but the skill itself does not yet **discover** the plugin install location at runtime — a plugin-installed user running `Setup ai-software-architect` will be told to clone the repo, even though the templates are already on disk inside the plugin.

**2. There is no preview-before-apply mode.** Users cannot see what `Setup ai-software-architect` will do before it does it. The skill writes into `.architecture/` immediately. For experienced users on existing projects, that's fine; for first-time users on important codebases, "what is this going to write?" is a reasonable question that today has no answer short of running the skill and reading the diff.

**3. There is no recovery path for partial installs.** If setup fails midway (network glitch during template fetch, user interrupt, model timeout during initial analysis), the user is left with a half-populated `.architecture/`. The 1.5.1 docs added a Recovery section, but the skill itself doesn't detect partial state — re-running it produces redundant or conflicting work.

These three issues share a common shape: **the setup skill assumes a single happy path** (clone present, write everything, success). The reality is multi-path (plugin or clone), users want to inspect before committing, and failures happen.

This ADR scopes the decision for fixing them. Per ADR-012's precedent, items with different necessity get different recommendations.

## Decision Drivers

* **Correctness:** Issue #1 is a literal bug for plugin users. Every other DevX win is moot if `Setup ai-software-architect` doesn't work end-to-end on the canonical install path.
* **Trust:** Issue #2 is about giving users confidence to run the skill on real projects. A `--dry-run` mode is a small commitment that pays back disproportionately when the user is unsure.
* **Resilience:** Issue #3 has a smaller blast radius (most setups succeed), but when they fail the cost is real (delete `.architecture/` and restart, losing any in-progress customization the user had inspected).
* **Pragmatism:** All three could be implemented as one ambitious refactor. They could also each be its own focused commit. The right size is somewhere in between — Issue #1 is non-negotiable; #2 and #3 are evaluated independently against complexity.
* **Compatibility with Phase 4/5 of ADR-012:** The new generator (`tools/cli.js generate-subagents`) and validator (`tools/cli.js validate-adr`) already establish the pattern of "skill calls into a CLI for deterministic operations." Plugin discovery, dry-run, and recovery can follow the same pattern: skill instructs the model to call a CLI command that does the heavy lifting deterministically, and the model interprets the output.

## Decision

Implement **three coordinated changes** to the setup-architect skill, **landed as separate commits**, with the option to defer #2 and #3 if implementation reveals unexpected complexity.

### Change A — Plugin source discovery (required, lands first)

The skill's prerequisites step is rewritten to discover the framework source location at runtime, in this order:

1. Check `${CLAUDE_PLUGIN_ROOT}` environment variable (set by Claude Code for hooks; may be set for skills depending on the runtime).
2. Search `~/.claude/plugins/` for a directory named `ai-software-architect` (typical install location).
3. Fall back to `.architecture/.architecture/` (legacy clone path).
4. If none found, return the dual-option error message added in 1.5.1.

A new CLI command `node tools/cli.js find-source` encapsulates the discovery logic, returning the resolved path (or a non-zero exit). The skill calls this CLI rather than embedding shell heuristics. This matches ADR-009 (script-based deterministic operations) and follows the pattern established by `validate-adr` and `generate-subagents`.

The skill's `Step 3 — Install Framework` instructions are updated to source templates from the discovered location, with the legacy `rm -rf .architecture/.architecture/` cleanup gated to the legacy path only.

### Change B — Dry-run / preview mode (recommended, lands second)

The skill recognizes a "dry-run" or "preview" intent in the user's request (e.g., "Setup ai-software-architect dry-run", "Preview what setup would do") and, when detected, runs the entire flow with all `Write` operations replaced by a printed summary:

```
DRY RUN — no files would be written.

Would create:
  .architecture/decisions/adrs/                  (empty directory)
  .architecture/reviews/                          (empty directory)
  .architecture/templates/adr-template.md         (from plugin)
  ...
  .architecture/members.yml                       (8 default members + 2 stack-specific)
  .architecture/principles.md                     (8 default principles + 1 stack-specific)
  .architecture/config.yml                        (pragmatic_mode.enabled: false)

Would NOT write outside `.architecture/`. To apply, run again without "dry-run".
```

A second CLI command `node tools/cli.js preview-setup [target-dir]` may be added if the skill instructions alone prove insufficient — but the initial implementation is purely instructional (the skill's body checks for the dry-run signal and short-circuits writes).

### Change C — Recovery / partial-install detection (optional, lands third or deferred)

When invoked, the skill detects partial-install state by scanning `.architecture/` against an expected manifest (members.yml present? config.yml? initial-system-analysis.md? templates dir?). If state is partial, the skill offers two paths:

1. **Resume**: complete only the missing pieces (e.g., regenerate `members.yml` if missing, run initial analysis if missing). Skips work already done.
2. **Restart**: `rm -rf .architecture/` and re-run from clean state (with explicit user confirmation given the destructive `rm -rf`).

A new CLI command `node tools/cli.js setup-status` returns the manifest-vs-actual diff, so the skill can describe the state precisely without duplicating detection logic in markdown.

### What is NOT in this ADR

* **Setup outside `.architecture/`** — out of scope; setup never writes outside that directory.
* **Cross-platform shell quoting** — assumed handled by Node CLI commands; the skill doesn't shell out.
* **Telemetry / analytics** — no instrumentation added; observability is via Claude Code's existing tool-use trace.
* **Setup of multiple frameworks at once** — single-framework only, as today.

**Architectural Components Affected:**
* `skills/setup-architect/SKILL.md` — rewrite the prerequisites/install/recovery sections
* `skills/setup-architect/references/installation-procedures.md` — update legacy/plugin path descriptions
* `tools/cli.js` — add `find-source`, optionally `preview-setup`, optionally `setup-status` commands
* `tools/lib/setup-source-discovery.js` (new) — deterministic source-discovery logic + tests
* `tools/lib/setup-status.js` (new, only if Change C ships) — manifest-vs-actual diff + tests

**Interface Changes:**
* New CLI subcommand(s) on `tools/cli.js`. Backward compatible — existing commands unaffected.
* User-facing setup behavior changes in three steps (A: works on plugin install; B: preview available; C: recovery available). Each lands as a separate commit so the impact of each is isolated.

## Consequences

### Positive

* **Plugin install works end-to-end.** The most-recommended install path stops giving misleading clone instructions.
* **`--dry-run` builds user trust** for first-time setup on important codebases.
* **Partial-install recovery** removes the "delete `.architecture/` and pray" pattern that's currently the only recovery option.
* **Pattern reinforcement.** Each change pulls deterministic logic into a CLI command and tests it; the skill stays a thin orchestrator. Matches ADR-009 and the ADR-012/013 lineage.

### Negative

* **Test surface grows.** Source discovery, dry-run, and setup-status are each net-new code paths to maintain. The trade-off is they replace heuristic markdown instructions that were untestable.
* **Skill body grows by ~50 lines** to cover the three new modes. Manageable, but combined with the 1.5.1 narrative additions, the SKILL.md is approaching a size where progressive disclosure (ADR-008) starts to apply. May require splitting some content into `references/` if it crosses the 250-line boundary.
* **Dry-run is a stateful conversation flag**, not a CLI flag. Skill-level dry-run depends on the model correctly recognizing the signal and applying it consistently. Mitigation: explicit instruction in the SKILL.md plus a smoke test under workflow_dispatch CI.

### Neutral

* `setup-architect` remains user-invoked only (`disable-model-invocation: true`). The model never auto-fires it on inferred intent.
* No changes to `members.yml`, `config.yml`, or any other source-of-truth files.

## Implementation Strategy

### Blast Radius

**Impact Scope**: Medium. Affects every plugin-installed user attempting setup (Change A), and is positive — they currently hit a half-broken flow.

**Affected Components**:
* `setup-architect` skill (one file plus its references doc)
* `tools/cli.js` and 1-3 new lib files
* No subagents, no MCP tools, no other skills affected

**Affected Teams**: Solo maintainer; downstream users see better behavior, no migration steps required.

**User Impact**: Plugin users go from "broken instructions" to "works." Existing clone-path users are unaffected (legacy path preserved). Dry-run users gain a confidence-building option. Partial-install victims gain a recovery path.

**Risk Mitigation**:
* Land Change A first; smoke-test on a fixture project before tackling B/C.
* Each change is a separate commit; revert is per-feature.
* Source discovery has a deterministic CLI that can be unit-tested before wiring into the skill.

### Reversibility

**Reversibility Level**: High per change.

**Rollback Feasibility**: Each commit is revertable independently. CLI subcommands are additive — reverting them doesn't break existing workflows.

**Migration Paths**:
* **Forward**: Sequential commits, A → B → C.
* **Rollback**: `git revert` of any individual commit.
* **Evolution**: The CLI subcommand pattern makes adding future setup features (e.g., `setup-architect --upgrade` to migrate older `.architecture/` versions) a natural extension.

**Options Preserved**: All three changes are additive. The skill's existing surface still works for users who don't invoke the new modes.

**Commitments Made**: Plugin source discovery becomes the canonical first step of every setup invocation. The skill's behavior on plugin-installed systems is now defined.

### Sequencing & Timing

**Prerequisites**:
- [x] ADR-012 Phase 4 (`tools/cli.js` exists with command-dispatcher pattern)
- [x] ADR-013 (orchestrator pattern established; setup-architect already simplified to delegation in 1.5.1)
- [x] 1.5.1 documentation (already describes the dual-path behavior; this ADR makes the skill match the docs)

**System Readiness**:
* **Observability**: Claude Code's tool-use trace shows CLI invocations; sufficient.
* **Dependencies**: None new for Change A. Changes B and C may need `picocolors` or similar for nicer dry-run output, but plain stdout is also fine.
* **Infrastructure**: None.
* **Data Migration**: None.

**Team Readiness**: Solo maintainer; the CLI extension pattern is well-established at this point.

**Sequencing Concerns**: Change A must precede B and C — both depend on knowing the source location. B and C are independent of each other.

**Readiness Assessment**: Ready to implement Change A. Changes B and C ready pending Change A's smoke test.

### Social Cost

**Learning Curve**: Low. Users opt into dry-run by phrasing their request; recovery is automatic when partial state is detected.

**Cognitive Load**: Slightly higher for skill *authors* (the SKILL.md branches three ways: discovered-plugin / discovered-clone / not-found). Lower for users (every path leads somewhere coherent).

**Clarity Assessment**:
* **Will this help more than confuse?**: Yes. The current "follow these clone instructions" path is the confusing one for plugin users.
* **Explanation required**: One paragraph in CHANGELOG per change.
* **Onboarding impact**: Net positive for new users; the install path that the README recommends will actually work.

**Documentation Needs**:
* [ ] CHANGELOG entry for 1.6.0 (or 1.5.2/1.5.3 if landing piecemeal)
* [ ] Update `USAGE-WITH-CLAUDE-PLUGIN.md` "First 5 minutes" section to mention `--dry-run` once Change B lands

### Confidence Assessment

**Model Correctness Confidence**: High for Change A; Medium for B and C.
* Change A is straightforward source discovery — the same pattern the rest of the framework already uses.
* Change B depends on the model correctly recognizing the dry-run signal across paraphrased requests; smoke test required.
* Change C depends on the partial-install detection being precise enough to avoid false-positive "you have a partial install, want to resume?" prompts on already-complete installs.

**Assumptions**:
1. `${CLAUDE_PLUGIN_ROOT}` is available to skills, or the heuristic search of `~/.claude/plugins/` is reliable enough. **Validation**: Test on a real plugin install before committing.
2. The model can consistently recognize "dry-run", "preview", "what would this do" phrasings as the dry-run signal. **Validation**: Small fixture set of test prompts under `claude-smoke`.
3. Partial-install state is a meaningful condition users actually hit. **Validation**: If post-1.6.0 telemetry/issues show no partial-install reports, Change C's value is lower than estimated. (This is partially the reason it's marked optional.)

**Uncertainty Areas**:
* Whether `${CLAUDE_PLUGIN_ROOT}` is set in the skill's environment (vs. only in hook environments).
* Whether `~/.claude/plugins/marketplaces/.../plugins/ai-software-architect/` is the stable install path or whether Claude Code rearranges it across versions.

**Validation Approach**:
* Unit-test source discovery against fixture filesystem layouts (mocked dirs).
* Smoke-test against the real plugin install before declaring Change A done.
* For Changes B and C, fixture-based smoke tests via `claude-smoke` workflow_dispatch trigger.

**Edge Cases**:
* User has both a plugin install AND a `.architecture/.architecture/` clone (e.g., legacy user who installed plugin without removing clone). Resolution: prefer plugin path; warn about the redundant clone.
* Plugin install location varies by Claude Code version. Resolution: search heuristic falls back to multiple known patterns.
* Partial install where `members.yml` exists but `agents/` is not generated. Resolution: detect via `generate-subagents --check`; offer to regenerate without restarting full setup.

## Implementation

**Change A — Plugin source discovery (required)**
1. Add `tools/test/setup-source-discovery.test.js` with failing tests for: env var present, plugin dir present, legacy clone present, none present, both present.
2. Implement `tools/lib/setup-source-discovery.js` until tests pass.
3. Wire `find-source` subcommand in `tools/cli.js`.
4. Update `skills/setup-architect/SKILL.md` step 1 to call `node tools/cli.js find-source` and use its output. Update step 3 to source from the resolved path.
5. Smoke-test against the local plugin install and a legacy-clone fixture.
6. Commit: `feat(setup): plugin-aware source discovery for setup-architect`.

**Change B — Dry-run mode (recommended)**
1. Add tests covering dry-run signal recognition (in skill instructions, this is mostly behavioral — the test is a smoke test rather than a unit test).
2. Update `SKILL.md` to recognize dry-run intent and replace `Write` operations with summary output.
3. Smoke-test by running setup with and without the dry-run signal on the same fixture project.
4. Commit: `feat(setup): --dry-run preview for setup-architect`.

**Change C — Partial-install recovery (optional)**
1. Add `tools/test/setup-status.test.js` with failing tests for: empty `.architecture/`, fully populated, partial (members.yml present but no analysis), partial (everything but `agents/` regen).
2. Implement `tools/lib/setup-status.js` and the `setup-status` subcommand.
3. Update `SKILL.md` to call `setup-status` upfront and branch on its output.
4. Smoke-test recovery path against fixture partial-install states.
5. Commit: `feat(setup): partial-install detection and recovery`.

## Alternatives Considered

### Alternative 1: Skip plugin discovery; document the gap

Leave the SKILL.md instructing users to clone manually, even on plugin installs.

**Pros:**
* Zero implementation work.
* Users *can* still get setup to work by following the clone instructions, even if redundant.

**Cons:**
* Silently asks plugin users to do work the plugin already did.
* Contradicts the README's "Plugin (recommended)" framing.
* The 1.5.1 docs explicitly point at this skill as the next step after plugin install.

### Alternative 2: All-three-or-nothing in one ADR

Combine A, B, and C into a single mandatory phase.

**Pros:**
* One ADR to discuss and review.
* Avoids the "we'll come back to this" pattern that historically lets B and C drift indefinitely.

**Cons:**
* Higher up-front cost; risk that one of the three uncovers unexpected complexity and blocks the others.
* The Pragmatic Enforcer specifically calls out "embedded mandatory scope" as the failure mode this framework should avoid.
* Loses the option to ship Change A standalone if it's enough.

### Alternative 3: Dry-run via a CLI command, not a skill mode

Implement `node tools/cli.js setup-architect --dry-run` as a parallel-but-separate entry point.

**Pros:**
* Cleanly separated from the natural-language skill.
* Trivially testable (just CLI output, no model behavior involved).

**Cons:**
* Bifurcates the user's mental model — "ask Claude" vs "run a CLI" depending on what you want.
* Loses the "preview, then ask Claude to apply" flow that's natural in conversation.

## Pragmatic Enforcer Analysis

**Reviewer**: Pragmatic Enforcer
**Mode**: Balanced

**Overall Decision Complexity Assessment**:
This ADR bundles three changes with distinctly different necessity profiles. The risk is approval-by-association — once the package is approved, all three ship even if only one is truly needed. The structure of this ADR explicitly resists that: each change has its own pragmatic score, and the recommendation is to evaluate them independently after Change A lands. Net assessment: **appropriate engineering for Change A; conditional on Change A's outcome for B; defer C unless triggered**.

### Per-change pragmatic scoring

#### Change A — Plugin source discovery

**Necessity**: 9/10
* **Current need**: Plugin users hit broken instructions today. This is a literal bug.
* **Evidence of need**: 1.5.1 audit explicitly identified this as the highest-impact item.
* **Cost of waiting**: Every plugin-installed user pays a confusing first-contact tax.

**Complexity**: 4/10
* CLI subcommand following the established pattern.
* Two new files (`tools/lib/setup-source-discovery.js` + test); maybe 100-150 LOC.
* No new dependencies.

**Recommendation**: ✅ **Approve and ship immediately.**

#### Change B — Dry-run mode

**Necessity**: 6/10
* **Current need**: Helpful for first-time users on important codebases. Not blocking anyone.
* **Evidence of need**: Audit identified as a DevX win, not a fix.
* **Cost of waiting**: Users continue to run setup blindly, which works most of the time.

**Complexity**: 5/10
* Adds a stateful conversational flag (the model must recognize the signal).
* Smoke-test surface non-trivial — must verify behavior across paraphrasings.

**Recommendation**: ⚠️ **Approve with simplification.** Implement only if Change A reveals the discovery infrastructure makes B easy to add. If Change A's smoke testing reveals the discovery layer is fragile, defer B until that stabilizes.

#### Change C — Partial-install recovery

**Necessity**: 4/10
* **Current need**: Real but rare. Most setups complete.
* **Evidence of need**: Audit identified as a missing pattern, but no concrete user reports of partial-install failures.
* **Cost of waiting**: When failures happen, users `rm -rf .architecture/` and restart — annoying but functional.

**Complexity**: 7/10
* Manifest-vs-actual diff requires a stable expected manifest. The "expected" depends on customization (which members were added, which principles).
* Branching the skill three ways (clean / partial-resume / partial-restart) bloats SKILL.md.
* Risk of false positives on already-complete installs.

**Recommendation**: ⏸️ **Defer until triggered.** Don't ship preemptively. Trigger conditions:
* User reports of partial installs in 1.6.0+.
* Pattern of similar partial-state failures across other framework operations.

### Pragmatic Score (aggregate)

If all three ship together: Necessity ~6.3 / Complexity ~5.3 / Ratio ~0.84 — within balanced mode but understates the variance.

The right read is per-change:
* Change A: 9/4 = 0.44 — clearly approve.
* Change B: 6/5 = 0.83 — approve conditionally.
* Change C: 4/7 = 1.75 — **above balanced threshold**; defer.

**Overall Assessment**:
This is an honest case of "not all parts of the package have the same necessity." The ADR's structure (each change separable, scoring per-change) lets the recommendation be precise: **ship A immediately; evaluate B after A's smoke test; defer C unless triggered**. Approving the full bundle without that nuance would be over-engineering for problems that haven't manifested.

## Validation

**Acceptance Criteria:**
- [ ] Change A: plugin-installed `Setup ai-software-architect` succeeds end-to-end without any clone-path warnings.
- [ ] Change A: legacy clone-path users see no behavior regression.
- [ ] Change A: `node tools/cli.js find-source` returns the correct path on both install types and exits non-zero with a clear message when neither is present.
- [ ] Change B (if shipped): `Setup ai-software-architect dry-run` produces a summary without writing any files.
- [ ] Change C (if shipped): a fixture partial-install (`.architecture/` with `members.yml` only) triggers the recovery prompt.

**Testing Approach:**
* **TDD where testable** (Changes A and C have deterministic CLI logic).
* **Smoke-test where behavioral** (Change B's signal recognition; the integration of A's CLI into the skill body).
* **Drift checks**: `node tools/cli.js generate-subagents --check` and `node tools/cli.js validate-adr` continue to pass.

## References

* [ADR-012: Claude Plugin Distribution and Configuration Hardening](ADR-012-claude-plugin-distribution-hardening.md) — established the plugin distribution, leaving the skill instructions referencing the legacy clone path
* [ADR-013: Skill Orchestrator Pattern with Subagent Delegation](ADR-013-skill-orchestrator-subagent-delegation.md) — orchestrator pattern that this ADR extends to setup-architect
* [ADR-009: Script-Based Deterministic Operations](ADR-009-script-based-deterministic-operations.md) — pattern for moving heuristics out of skill markdown into testable CLI commands
* 2026-05-03 setup-process DevX audit (1.5.1 release notes) — surfaced the three issues this ADR scopes
