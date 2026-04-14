---
name: verify-app
model: sonnet
---
Perform end-to-end verification of the kanban-todos application.

Run these checks in order and report pass/fail for each:

**Build verification:**
1. `bun run lint` — zero errors required; zero warnings preferred
2. `npx tsc --noEmit` — zero TypeScript errors required
3. `bun run test --run` — zero failing tests required
4. `bun run build` — successful production build required

**Code quality checks:**
5. No files in `src/` exceed 410 lines: `find src -name '*.ts' -o -name '*.tsx' | xargs wc -l | sort -n | tail -20`
6. No `console.log` in production code (console.error/warn in components is acceptable): `grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx" | grep -v "__tests__\|test\.\|logger\.ts"`
7. No non-null assertions without comments: `grep -rn "\!" src/ --include="*.ts" --include="*.tsx" | grep -v "__tests__\|test\.\|\.d\.ts\|//"`

**Architecture checks:**
8. ADRs exist: `ls docs/adr/` should list at least 5 documents
9. Agent definitions exist: `ls .claude/agents/` should include build-validator, code-simplifier, security-reviewer, tdd-enforcer, verify-app

Return overall status: ✅ VERIFIED or ❌ FAILED
List each check with its status and any relevant details.
