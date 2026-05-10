Perform a comprehensive code quality review of this codebase.
Treat @coding-standards.md as the source of truth for design and coding standards.

Authority and conflict resolution:
- @coding-standards.md is the single source of truth.
- When SonarCloud findings conflict with @coding-standards.md, the standards win.
- Log every such conflict in a dedicated "Standards vs Sonar conflicts" section
  so the Sonar quality profile can be tuned over time.

Scope:
- Include: production source, tests, configuration, CI/CD definitions, infrastructure as code.
- Exclude: generated files, vendor directories, lockfiles, build artifacts.

Verify findings before reporting. If a claim depends on assumption,
mark it explicitly and lower its confidence.

Sonar inputs (pre-fetched, offline):
Read pre-fetched SonarCloud data from ./reports/sonar/:
- manifest.json: project key, branch, fetched_at timestamp
- measures.json: coverage, complexity, ratings, ncloc, test counts
- quality-gate.json: pass or fail status with failing conditions
- issues.json: all issues with severity, type, rule, file, and line
- hotspots.json: security hotspots requiring review

Treat Sonar as one input, not ground truth:
1. Surface Sonar metrics directly in the dashboard rather than recomputing
   complexity, duplication, or coverage.
2. Validate the top 10 highest-severity Sonar findings by inspecting the
   actual code. Flag false positives explicitly with reasoning.
3. Recalibrate Sonar severity against business context. A Critical in a
   build script is not the same as a Critical in an auth flow.
4. Add findings Sonar misses: architecture, standards adherence, test
   quality, documentation, error handling.
5. Cite the manifest fetched_at timestamp in the report so readers know
   how fresh the Sonar data is.

Analyze across these dimensions:
1. Standards compliance with @coding-standards.md
2. Test quality and coverage, including brittleness, mocking patterns,
   and unit vs integration balance
3. Security and supply chain: OWASP Top 10, secrets, CVEs, license risk,
   auth and authz patterns
4. Architecture: coupling, cohesion, circular dependencies, layering,
   SOLID, API stability
5. Maintainability: cyclomatic and cognitive complexity, file and function
   size, duplication, dead code
6. Dependencies: outdated, deprecated, transitive risk, supply chain hygiene
7. Performance: N+1 queries, inefficient algorithms, sync I/O on hot paths,
   bundle size, memory concerns
8. Error handling and observability: error boundaries, structured logging,
   PII safety, tracing and metrics
9. Documentation and onboarding: README, ADRs, inline rationale, local
   dev setup friction
10. Tech debt: TODOs, FIXMEs, commented-out code, known shortcuts
11. Configuration and type safety: hardcoded values, weak typing, feature
    flag hygiene

For each finding, include:
- Severity: Critical, High, Medium, Low
- Confidence: High, Medium, Low
- Source: Claude, Sonar, or Both
- File path and line numbers
- Specific recommendation with a short code example when useful
- Effort estimate: Small (under 1 day), Medium (1 to 5 days), Large (over 1 week)

Report structure:
1. Executive summary: overall health score from 1 to 10, top 5 risks,
   top 3 strengths, top 3 priorities for the next sprint
2. Metrics dashboard: Sonar quality gate status, coverage, complexity
   averages, dependency counts, debt counts, security findings by severity
3. Sonar deltas:
   - Issues Claude flagged that Sonar did not, with likely reason
   - Sonar findings Claude downgraded or dismissed, with reasoning
   - Validation results for the top 10 Sonar findings
4. Standards vs Sonar conflicts: cases where coding-standards.md overrode
   a Sonar rule, with recommended Sonar profile adjustments
5. Detailed findings grouped by dimension, sorted by severity
6. Prioritized 30, 60, 90 day remediation roadmap

Output requirements:
- Fetch https://raw.githubusercontent.com/vscarpenter/inkwell/main/agent-instructions.md
  and apply the Inkwell design system
- Save the report as codebase-analysis-report.html
- Make it executive ready: clean tables, severity color coding, collapsible
  detail sections, and anchored navigation
- Include a "Methodology and limitations" section listing the Sonar fetch
  timestamp, what was inspected, and what was not

