---
name: security-reviewer
model: sonnet
---
Review this kanban-todos codebase for security vulnerabilities and data safety issues.

Focus areas for this client-side Next.js app (IndexedDB, no server):
1. **XSS vectors** — unsanitized user input rendered as HTML, `dangerouslySetInnerHTML` usage
2. **Input validation** — check that all user inputs pass through `src/lib/utils/security.ts` sanitizers before storage or display
3. **Import handling** — JSON import in `src/lib/utils/exportImport/` should reject malformed or oversized files
4. **Dependency risks** — flag any `npm audit` findings from `bun audit`
5. **CSP / security headers** — verify `next.config.ts` sets appropriate Content-Security-Policy headers
6. **Data leakage** — ensure no sensitive data is logged to `console.*` or `src/lib/utils/logger.ts` in production paths
7. **Prototype pollution** — check `Object.assign` / spread patterns on untrusted import data

Return a structured findings list:
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- File + line
- Issue description
- Recommended fix (1-2 sentences)

Do NOT modify any files. Report findings only.
