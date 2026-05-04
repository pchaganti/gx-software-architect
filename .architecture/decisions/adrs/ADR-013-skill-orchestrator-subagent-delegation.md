# ADR-013: Skill Orchestrator Pattern with Subagent Delegation

## Status

Proposed

**Decision Date**: 2026-05-03
**Extends**: [ADR-012](ADR-012-claude-plugin-distribution-hardening.md) — closes the loop on Phase 4 (subagent generation)

## Context

ADR-012 Phase 4 generated `agents/*.md` subagents from `.architecture/members.yml` — eight first-class Claude Code subagents, each with persona-grounded descriptions and scoped tools. The motivation in that ADR was explicit: replace brittle in-prompt persona adoption with Claude Code-native primitives, preserve main-context tokens via `context: fork`, and use the right tool for the right job.

The subagents shipped, but the skills that *would benefit from them* — `architecture-review` and `specialist-review` — still adopt personas inline. Today, when a user runs `architecture-review`, Claude reads `members.yml` and re-narrates each member's review in the main conversation context. Each persona-switch costs tokens, risks drift between turns, and pollutes the main thread with material that should be isolated.

This is the visible gap: ADR-012 generated the primitives but did not refactor the consumers. ADR-013 closes that gap.

A second motivating signal: claude-code-guide audit (2026-05-03) identified "skill→subagent delegation" as the emerging best-practice pattern for review workflows. Skills become **orchestrators** (cheap, kept in main thread, route between specialists). Subagents become **deep-analysis isolates** (use `context: fork`, return synthesized findings). The pattern is well-understood and matches what we built in ADR-012 Phase 4.

## Decision Drivers

* **Token efficiency:** Eight inline persona reviews each emit several thousand tokens of perspective-narration into the main thread. Delegation moves that to forked contexts that don't bloat the main session.
* **Persona fidelity:** A subagent loaded *as* the security-specialist doesn't drift mid-review. An inline persona Claude is impersonating can blur as the conversation progresses.
* **Closing ADR-012:** The subagents exist but aren't used. That's a half-finished implementation, exactly what the project's own coding guidelines (in CLAUDE.md, "no half-finished implementations") call out.
* **User-facing consistency:** Direct invocation of a subagent (via `Agent({subagent_type: "security-specialist"})` or `/agents`) and skill-mediated review should produce structurally similar output. Today, only the latter works; the former is a stranger to the framework's review process.
* **Pragmatism boundary:** This change is scoped to two skills and stays within the existing ADR-012 architecture. It is not a rewrite of the review process itself.

## Decision

Refactor `architecture-review` and `specialist-review` SKILL.md files into **orchestrators** that delegate the deep-perspective work to the corresponding `agents/*.md` subagents.

**For `specialist-review`** (single-perspective): the skill body becomes ~30 lines that:
1. Resolves the requested specialist's id from `members.yml` (e.g., "Security Specialist" → `security-specialist`).
2. Dispatches a single `Agent({subagent_type: "<id>"})` call with the review target and a structured prompt template.
3. Optionally writes the returned review to `.architecture/reviews/` if the user asked to persist it.

**For `architecture-review`** (multi-perspective): the skill body becomes ~50 lines that:
1. Reads `members.yml` and selects every active member (filtering `pragmatic_enforcer` based on `pragmatic_mode.enabled`).
2. Dispatches one `Agent({subagent_type: "<id>"})` call per member **in parallel** (subagents are independent; parallel invocation is the documented best practice for independent work).
3. Aggregates the returned reviews into a consolidated review document with cross-cutting themes called out.
4. Writes the consolidated review to `.architecture/reviews/`.

**Subagent files (`agents/*.md`) are not changed.** They already carry persona, tools, perspective, and source-of-truth pointers — all the information the orchestrator needs to delegate effectively. The orchestrator skill provides the *task* (review prompt) at call time; the subagent provides the *who* and *how-to-think-about-this*.

**Architectural Components Affected:**
* `skills/architecture-review/SKILL.md` (rewrite the body; preserve frontmatter)
* `skills/specialist-review/SKILL.md` (rewrite the body; preserve frontmatter)
* No changes to `agents/*.md`, `members.yml`, or the generator
* No changes to the `architecture-review` references at `skills/architecture-review/references/*.md` (those describe the review *process*, which the orchestrator still drives)

**Interface Changes:**
* User-visible behavior: review output structure is unchanged. The token cost of running a review drops noticeably.
* Skill `allowed-tools` may relax: the orchestrator does less direct file work, since subagents handle reads.

## Consequences

### Positive

* Closes the implementation gap left by ADR-012 Phase 4 — the subagents are now actually used.
* Main-context tokens during a review drop substantially; the orchestrator only sees aggregated findings, not raw per-perspective narration.
* Persona drift between turns becomes structurally impossible — each subagent runs in its own context.
* Pattern aligns with current Claude Code best practices for review-flow skills, making the framework more legible to other Claude Code authors.
* `Agent({subagent_type: ...})` is now the documented, supported entry point for users who want to invoke a single specialist outside any skill — the framework, the skill, and direct invocation produce the same persona work.

### Negative

* Calling eight subagents in parallel for a full review is a heavier compute pattern than inline persona narration. For users on stricter budgets or smaller models, this may be slower or costlier per-call (though the main-thread savings usually outweigh).
* Errors in subagent calls (timeout, refusal) need explicit handling in the orchestrator. Inline persona narration was monolithic and didn't have that failure surface.
* Skill instructions become more abstract — they describe *delegation* rather than *review steps*. Contributors editing the orchestrator must understand the subagent contract; that's a small learning curve.

### Neutral

* The `references/` and `assets/` directories under each skill are still loaded as needed; the progressive-disclosure pattern (ADR-008) is preserved.
* No changes to `members.yml` schema or the generator. The generator's output is the canonical subagent surface; this ADR just *uses* it.

## Implementation Strategy

### Blast Radius

**Impact Scope**: Medium. Affects every user of `architecture-review` and `specialist-review`. Does not affect users of `create-adr`, `setup-architect`, `list-members`, `architecture-status`, or `pragmatic-guard`.

**Affected Components**:
- The two refactored skills (orchestrators).
- Indirectly: every subagent (they will be invoked more frequently). No code change in subagents themselves.

**Affected Teams**: Solo maintainer. Contributor-facing impact is the new pattern to follow when adding similar skills.

**User Impact**: Output quality should improve (less drift); cost profile changes but is bounded by the existing eight-member team size.

**Risk Mitigation**:
- Refactor `specialist-review` first (single-call delegation, simpler) and validate before tackling `architecture-review`.
- Both skills land as separate commits so either can be reverted independently.

### Reversibility

**Reversibility Level**: High.

**Rollback Feasibility**: Each skill refactor is a single-commit revert. No data migration, no schema change, no upstream consumer break.

**Migration Paths**:
- **Forward**: Two sequential commits, specialist-review then architecture-review.
- **Rollback**: `git revert` of either commit restores the inline-persona behavior.
- **Evolution**: Once this pattern is established, future skills (e.g., a hypothetical `pre-release-review` or `compliance-audit`) follow the same orchestrator/subagent split.

**Options Preserved**: Subagent invocation works directly (via `/agents` or `Agent` calls) regardless of whether skills delegate to them. This refactor doesn't lock subagents into being skill-only.

**Commitments Made**: The skill→subagent delegation pattern becomes the documented review-flow architecture for this framework.

### Sequencing & Timing

**Prerequisites**:
- [x] ADR-012 Phase 4 — `agents/*.md` exists and is in sync with `members.yml`.
- [x] CI drift check (`generate-subagents --check`) — guards against subagent rot.

**System Readiness**:
- **Observability**: Subagent invocations are visible in Claude Code's tool-use trace. Aggregation happens in the orchestrator and is the user-visible artifact.
- **Dependencies**: None new.
- **Infrastructure**: None.
- **Data Migration**: None — `.architecture/reviews/` schema is unchanged.

**Team Readiness**: Familiar pattern (Agent calls are widely documented in Claude Code).

**Sequencing Concerns**: `specialist-review` first; `architecture-review` second.

**Readiness Assessment**: Ready to implement.

### Social Cost

**Learning Curve**: Low. Skill orchestration via `Agent({subagent_type: ...})` is a one-liner.

**Cognitive Load**: Slightly higher for skill *authors* (must understand the subagent contract). Lower for skill *users* (output is cleaner).

**Clarity Assessment**:
- **Will this help more than confuse?**: Yes. The half-finished state (subagents shipped, skills unused) is the more confusing position.
- **Explanation required**: One CHANGELOG note for the 1.5.0 release. The pattern itself is self-explanatory once readers see the skill body.
- **Onboarding impact**: Net positive for contributors; the orchestrator pattern is small enough to grok in one read.

**Documentation Needs**:
- [ ] Update CHANGELOG for 1.5.0
- [ ] Inline comments in each refactored skill explaining the delegation pattern (one paragraph)

### Confidence Assessment

**Model Correctness Confidence**: High.
- The pattern is documented Claude Code best practice; the subagents already exist and were generated for exactly this use case.

**Assumptions**:
1. Parallel `Agent` calls for the eight-member team are well-supported by Claude Code's subagent infrastructure. **Validation**: Smoke test with a four-member subset before full rollout.
2. Subagent descriptions are specific enough that the orchestrator's `subagent_type` selection is unambiguous. **Validation**: ADR-012 Phase 4 already verifies this via the generator's tests.
3. Aggregation in the orchestrator preserves enough fidelity for the consolidated review to be useful. **Validation**: First production review run is the test; if aggregation is lossy, the orchestrator can include verbatim per-subagent sections.

**Uncertainty Areas**:
- Whether `context: fork` is automatic for `Agent` calls or requires explicit flag. (If explicit: skill author sets it per call.)
- Whether parallel subagent invocations should be capped (e.g., never more than 4 concurrent) for rate-limit hygiene. Current expectation: none of our reviewers are heavy enough to warrant a cap.

**Validation Approach**:
- Smoke-test `specialist-review` against a small fixture before refactoring `architecture-review`.
- After both refactors, run the existing `claude-smoke` workflow (ADR-012 Phase 5) with manual `workflow_dispatch` to verify the plugin still loads and skills are still discoverable.

**Edge Cases**:
- A user with a heavily customized `members.yml` (extra members not in the default eight). Resolution: orchestrator iterates dynamically, no hardcoded list. Custom members must have generated subagent files (caught by the existing drift check).
- `pragmatic_enforcer` with `mode_specific.active_when: false`. Resolution: orchestrator filters by the config flag before dispatching.

## Implementation

**Phase A: specialist-review orchestrator**
* Rewrite SKILL.md body to: identify specialist id → `Agent({subagent_type})` call → optionally write review.
* Trim `allowed-tools` (orchestrator no longer reads code directly; the subagent does).
* Preserve frontmatter metadata.
* Smoke-test by invoking with a real specialist + small target.
* Commit: `refactor(skills): specialist-review delegates to subagents`.

**Phase B: architecture-review orchestrator**
* Rewrite SKILL.md body to: read members.yml → filter by pragmatic_mode → parallel `Agent({subagent_type})` calls → aggregate → write consolidated review.
* Trim `allowed-tools` similarly; keep Write for the consolidated review document.
* Preserve `references/` files (still used for review-process guidance).
* Smoke-test by running a comprehensive review on this repo.
* Commit: `refactor(skills): architecture-review orchestrates subagent calls`.

## Alternatives Considered

### Alternative 1: Embed review process inside each subagent

Each `agents/<member>.md` includes a "When invoked, do this review" section. Skills become trivial (just kick off one or many subagents).

**Pros:**
* Subagents are fully self-contained; direct invocation works without skill mediation.
* Skill body shrinks to almost nothing.

**Cons:**
* Couples subagents to a single use case (review). Casual Q&A or ADR consultation against the same persona becomes awkward.
* Generator template grows substantially — each member's file gains task-specific content the generator would have to maintain.
* Loses the orchestrator's value as the place where skill-specific concerns (write to `.architecture/reviews/`, choose pragmatic_enforcer based on config) live.

### Alternative 2: Hybrid — keep inline persona for "quick reviews," delegate only for "deep reviews"

Add a `--depth` parameter (or equivalent natural-language signal) and route accordingly.

**Pros:**
* Preserves a fast path for trivial use cases.
* Hedges against the unknown cost of running eight subagents in parallel.

**Cons:**
* Doubles the implementation surface — both pathways need testing and maintenance.
* The "quick" path keeps inline persona drift, which is the very problem this ADR is closing.
* Adds a user-facing complexity (when does each path fire?) that wasn't there before.

### Alternative 3: Defer — keep ADR-012 Phase 4 dormant until a clear need emerges

Generated subagents stay in `agents/` but no skill uses them. They become reference documentation for the framework's perspective taxonomy.

**Pros:**
* Zero churn.
* Avoids the parallel-subagent cost question entirely.

**Cons:**
* Leaves the implementation half-finished (against project guidelines).
* The audit signal ("skills don't use subagents") will keep getting flagged in future reviews.
* Generated artifacts that exist but are unused tend to drift over time as the surrounding code evolves.

## Pragmatic Enforcer Analysis

**Reviewer**: Pragmatic Enforcer
**Mode**: Balanced

**Overall Decision Complexity Assessment**:
This is a closing-the-loop refactor, not net-new architecture. Phase 4 of ADR-012 paid the conceptual cost of introducing subagents; this ADR realizes their value. The complexity profile is dominated by editing two skill files and validating the result — no new concepts, no new infrastructure, no new dependencies. The risk of over-engineering is low because the scope is tight and the alternatives (Alternative 2's hybrid) were explicitly rejected for adding complexity without addressing the core gap.

**Decision Challenge**:

**Proposed Decision**: "Refactor architecture-review and specialist-review SKILL.md files into orchestrators that delegate the deep-perspective work to the corresponding agents/*.md subagents."

**Necessity Assessment**: 7/10
- **Current need**: ADR-012 Phase 4 generated subagents that no skill uses. That's a half-finished implementation against the project's own guidelines.
- **Future need**: Every future review skill would benefit from this pattern; establishing it now means follow-on skills don't re-invent.
- **Cost of waiting**: Each in-prompt persona review costs tokens and risks drift. The cost compounds across reviews; deferring the fix is paying interest.
- **Evidence of need**: Audit (2026-05-03) flagged this as P2; ADR-012 implementation note explicitly noted the gap.

**Complexity Assessment**: 4/10
- **Added complexity**: Two skill rewrites. ~80 lines of new SKILL.md content total.
- **Maintenance burden**: Lower than the inline-persona alternative — orchestrators are shorter and don't have to encode persona details.
- **Learning curve**: Low; `Agent({subagent_type})` is documented Claude Code primitive.
- **Dependencies introduced**: None.

**Alternative Analysis**:
The "do nothing" path (Alternative 3) was considered and rejected — it leaves a half-finished implementation. The hybrid path (Alternative 2) was considered and rejected as over-engineered. The embedded path (Alternative 1) was considered and rejected as coupling subagents to a single use case.

**Simpler Alternative Proposal**:
**Minimum viable scope**: Refactor only `specialist-review` (Phase A), defer `architecture-review` (Phase B) to a later release. Specialist review is the simpler case (single Agent call) and tests the pattern with less surface area.

**Recommendation**: ✅ Approve decision

**Justification**:
This decision has clear necessity (closing ADR-012 Phase 4), low complexity (two file edits), and an explicit minimum-viable fallback (Phase A only). The pattern aligns with current best practices and doesn't introduce speculative abstractions. Approval, with the expectation that Phase A lands first and Phase B is evaluated independently.

**If Deferring or Simplifying**:
- **Trigger conditions**: Defer Phase B if Phase A reveals unexpected issues with parallel `Agent` invocation, aggregation fidelity, or cost.
- **Minimal viable alternative**: Phase A alone delivers most of the user-visible value (specialist reviews are the more common request).
- **Migration path**: Phase B is independently landable later.

**Pragmatic Score**:
- **Necessity**: 7/10
- **Complexity**: 4/10
- **Ratio**: 0.57 *(Target: <1.5 — well within balanced mode)*

**Overall Assessment**:
Appropriate engineering. This is a closing-the-loop refactor with a clean fallback and no speculative complexity. Green-light Phase A; evaluate Phase B independently after Phase A ships.

## Validation

**Acceptance Criteria:**
- [ ] Phase A: `specialist-review` SKILL.md dispatches a single `Agent({subagent_type})` call and produces a review structurally indistinguishable from the prior inline-persona output.
- [ ] Phase B: `architecture-review` SKILL.md dispatches one `Agent` call per active member, aggregates the results, and writes a consolidated review to `.architecture/reviews/`.
- [ ] All existing tests pass; the `claude-smoke` workflow (manually triggered) still loads the plugin and lists all skills.
- [ ] CHANGELOG updated with a 1.5.0 entry describing the orchestrator pattern.

**Testing Approach:**
* Unit-test surface for skill bodies is limited — they are markdown instructions, not code. Validation is **smoke testing** by invoking each skill against a real or fixture target and confirming the Agent calls fire and the output is sensible.
* Drift check: `node tools/cli.js generate-subagents --check` continues to guarantee subagent files remain in sync with `members.yml`.

## References

* [ADR-012: Claude Plugin Distribution and Configuration Hardening](ADR-012-claude-plugin-distribution-hardening.md) — Phase 4 generated the subagents this ADR consumes
* [ADR-005: LLM Instruction Capacity Constraints](ADR-005-llm-instruction-capacity-constraints.md) — motivates moving deep work out of the main thread
* [ADR-008: Progressive Disclosure Pattern for Large Skills](ADR-008-progressive-disclosure-pattern-for-large-skills.md) — orchestrator pattern preserves the references/assets convention
* Claude Code best-practices follow-up audit, 2026-05-03 (conversation-local; not a separate document)
