# ADR-0006: WebMCP Tool Layer for Browser Agents

**Status:** Accepted
**Documented:** 2026-09-05

## Context

Agents running on the same machine (Claude Code first, other MCP clients later) want to use
Cascade as their task tracker: read the board, create tasks, move them between columns, and
report status. Cascade stores everything in the browser's IndexedDB with no backend and no
account (ADR-0001), so the usual answer, an HTTP API, is off the table. The data only exists
inside a browser tab.

WebMCP is a draft web standard (Web Machine Learning Community Group) that lets a page
register JavaScript functions as tools on `document.modelContext`. A browser, an extension,
or a local bridge can then list and call those tools. Chrome ships it behind
`chrome://flags/#enable-webmcp-testing` and an origin trial from Chrome 149.

Options considered:

- **WebMCP tools registered by the page** (chosen). Tools run in the tab against the same
  Zustand actions the UI uses, so the agent and the user see one board.
- **A local HTTP or WebSocket server the page connects to.** Adds a network hop and a
  second process the page depends on, and breaks the "no network" promise.
- **Screen-scraping through a browser automation extension.** Works today without a flag
  but is slow, brittle, and blind to the data model.
- **A page-side polyfill and relay** (MCP-B `@mcp-b/global` plus `webmcp-local-relay`).
  Works in browsers without the flag, but adds a runtime dependency and a script the page
  would load from a CDN.

## Decision

Register eight `cascade_` tools from `src/lib/webmcp/` at boot, after the three stores have
initialized. Every tool calls a store action; none opens IndexedDB or restates a business
rule. One `AbortController` owns the registration, and aborting it is the only teardown path.

Feature detection runs in this order: `document.modelContext`, then `navigator.modelContext`,
then nothing. When the API is absent the app logs one info line and behaves exactly as
before. No polyfill ships; the flag or the origin trial is documented instead.

Reads carry `readOnlyHint` and `untrustedContentHint` because titles and descriptions are
user content. Delete carries `consequentialHint`. Inputs are validated inside every handler;
success resolves to `{ ok: true, ... }` and failure rejects.

A one-line indicator in the sidebar footer reports whether tools are registered.

The bridge to Claude Code lives outside the repository: the WebMCP Bridge Chrome extension
plus the `webmcp-server` stdio process, documented in `docs/webmcp.md`.

## Consequences

### Positive

- **One board, one data path.** Agent writes re-render the UI through the same store
  updates a click does. No sync, no second copy.
- **Local-first stays intact.** Nothing leaves the tab. The bridge runs on localhost and only
  while the user has activated it.
- **Cheap to test.** Tool handlers are plain async functions and run against the real
  `TaskDatabase` on fake-indexeddb.
- **Cross-origin and multi-user stay possible later.** `exposedTo` is left unset and the
  detection is a single function.

### Negative

- **Chrome only, behind a flag.** Safari and Firefox have no implementation. Until the flag
  or origin trial is on, the tools simply do not exist.
- **The bridge is a moving target.** No bridge is a standard yet. The chosen one drops tool
  annotations before they reach Claude Code, so `consequentialHint` gives no confirmation
  prompt on the client side.
- **Chrome 152 hides handler error messages from `executeTool`.** A rejected handler
  surfaces to callers as a generic `UnknownError`, so the field-naming messages reach the
  console but not the agent through that path. Revisit when Chrome forwards the reason.
- **Chrome 152 does not surface `consequentialHint` in `getTools()`.** It accepts the
  annotation and drops it. The tool still declares it for future builds.
- **Production builds strip console output**, so the "API absent" info line shows in
  development only unless `removeConsole` is relaxed.
