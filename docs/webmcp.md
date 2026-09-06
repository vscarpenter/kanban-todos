# WebMCP: using Cascade from Claude Code

Cascade registers eight tools on `document.modelContext` so an agent on the same Mac can read
the board, create tasks, move them between columns, update details, and delete them. The board
you see and the board the agent sees are the same IndexedDB data, updated live. Nothing leaves
the browser tab except over a localhost bridge you start yourself.

Everything below was verified on 2026-09-05 with Chrome 152.0.7977.82 on macOS, Claude Code
2.1.261, and Bun 1.4.0. Anything not verified says so.

## The tools

| Tool | What it does | Hints |
| --- | --- | --- |
| `cascade_list_boards` | Every board with id, name, and task counts per column, plus the id of the board on screen | read-only, untrusted content |
| `cascade_get_board` | One board with its columns in order (To Do, In Progress, Done) and counts. Defaults to the board on screen | read-only, untrusted content |
| `cascade_list_tasks` | Compact task list. Filters: `boardId`, `allBoards`, `status`, `priority`, `tag`, `query`, `includeArchived`, `limit` (default 50, max 200) | read-only, untrusted content |
| `cascade_get_task` | One task in full, dates as ISO strings | read-only, untrusted content |
| `cascade_create_task` | `title` required. Optional `description`, `boardId`, `status`, `priority`, `tags`, `dueDate` | |
| `cascade_update_task` | Partial update by `taskId`. `null` clears `description` or `dueDate`; `tags` replaces the list; `progress` only for in-progress tasks | |
| `cascade_move_task` | `taskId` plus `status` (`todo`, `in-progress`, `done`), optional `boardId`. Idempotent; this is how an agent reports status | |
| `cascade_delete_task` | Permanent delete by `taskId` | consequential |

Every success resolves to `{ "ok": true, ... }` with the affected task, board, or columns.
Every failure rejects with a message that names the field, for example
`status must be one of: todo, in-progress, done`.

Titles and descriptions are user content. The read tools carry `untrustedContentHint` so an
agent treats them as data, not instructions.

## Part 1: Chrome

WebMCP ships in Chrome behind a flag and an origin trial. There is no support in Safari or
Firefox.

1. Use Chrome 152 or newer on the stable channel. (Chrome 149 to 151 carry the origin trial
   and the flag but were not tested here.)
2. Open `chrome://flags/#enable-webmcp-testing`, set it to **Enabled**, and relaunch. The
   flag name comes from Chromium's `about_flags.cc`, where it maps to the Blink feature
   `WebMCP`.
3. Open `https://cascade.vinny.dev/` or `http://localhost:3000/` (both are secure contexts).
   The sidebar footer should read **Agent tools on**. Hover it to see the tool count.

Quick check in the DevTools console:

```js
(await document.modelContext.getTools()).map(t => t.name)
```

Expect eight names starting with `cascade_`. If `document.modelContext` is undefined, the flag
is off or the tab predates the relaunch.

What Chrome 152 does that the spec draft (dated 2026-09-04) does not say:

- `navigator.modelContext` is undefined. Only the document form exists in this build.
- `executeTool(tool, input)` wants `input` as a JSON **string**. A plain object fails with
  "Failed to parse input arguments".
- A handler that rejects surfaces to `executeTool` callers as a generic
  `UnknownError: Tool was executed but the invocation failed`. The field-naming message does
  not reach the caller through that path.
- `consequentialHint` is accepted at registration but dropped from `getTools()`. Only
  `readOnlyHint` and `untrustedContentHint` come back.
- The execute callback may receive no `signal` in its options.

An origin trial token would let production work without the flag for Chrome 149 and later.
That needs a registration under your Google account, so it is not part of this setup.
The trial's end version is unverified.

## Part 2: the bridge to Claude Code

Claude Code cannot see a browser tab. It needs an extension that reads the page's tools and a
local process that speaks MCP over stdio.

**Primary: WebMCP Bridge extension plus `webmcp-server`** (agentcathq/webmcp-react). It reads
`document.modelContext` through `getTools()` and `executeTool()`, listens for `toolchange`, and
forwards Claude Code cancellations as an abort. Versions on 2026-09-05: Chrome Web Store
listing 0.2.1 (updated 2026-09-05), GitHub release tag v1.1.0 (2026-09-03), npm
`webmcp-server` 0.2.0 (2026-09-03). The store version and the GitHub tag do not agree; both
are cited so you can tell which one you have.

### 2a. Install the extension

1. Install **WebMCP Bridge** from the Chrome Web Store
   (`https://chromewebstore.google.com/detail/webmcp-bridge/chgjbookknohehmaocfijekhaocaanaf`).
2. Open the Cascade tab, click the extension icon, and pick **Always on**. Chrome asks to allow
   the extension on that site; accept. Off exposes nothing.
3. The popup's dot turns yellow (active, no client) or green (connected to `webmcp-server`).

Pick **Always on**, not **Until reload**. Version 0.2.1 keeps "Until reload" activations in the
service worker's memory, and Chrome stops that worker after about 30 seconds without a bridge
connection. The activation is then gone, with no visible sign, and the tool list stays empty.
"Always on" is stored and registers the content scripts for the origin, so it survives worker
restarts and page reloads. Verified 2026-09-05: with "Until reload" the bridge listed no tools;
with "Always on" the eight tools appeared within a second.

Activation is per origin. Turning it on for `cascade.vinny.dev` does not cover
`localhost:3000`; do each one you use.

### 2b. Install the server

Install once, globally, with Bun:

```bash
bun install -g webmcp-server@0.2.0
ls ~/.bun/bin/webmcp-server
```

The upstream README suggests `npx webmcp-server`, and that works too. The global binary is
recommended because it does not depend on the working directory and starts without an npm
resolution step. Until 2026-09-05 npx could not start any MCP server from this repository:
Claude Code runs servers with the project as cwd, npm read `package.json` there, and it rejected
the yarn-style `parent/child` keys in `overrides`. The overrides now use npm's nested object
form, and the two direct type dependencies are pinned to their override versions, which npm
also requires.

### 2c. Tell Claude Code about it

```bash
claude mcp add -s user --transport stdio webmcp-server -- /Users/vinnycarpenter/.bun/bin/webmcp-server
claude mcp get webmcp-server
```

Replace the path with your own home directory. User scope makes the bridge available in
every project, which is the point: any Claude Code session on this Mac can use Cascade.
Remove it with `claude mcp remove webmcp-server -s user`.

The server listens for the extension on `ws://127.0.0.1:12315` (override with
`WEBMCP_BRIDGE_PORT`). Only one server can hold that port; a stale one shows up in
`lsof -nP -i :12315`.

### 2d. Two-minute smoke test

1. Start a new Claude Code session anywhere (`claude`). The bridge connects on startup.
2. In Chrome, open Cascade with the extension active for that origin.
3. Ask Claude Code: "List the tools from webmcp-server." Expect the eight `cascade_` tools.
   The extension namespaces them by tab and prefixes each description with the tab title, so
   they look like `tab-1482422103:cascade_create_task` with a description starting
   `[Cascade — Kanban tasks, fully local] [Cascade — Kanban tasks, fully local: localhost]`.
   With two Cascade tabs open you get two sets; close one or ask for the tab you mean.
4. Ask: "Create a task in Cascade called 'Hello from Claude Code'." Watch it appear in To Do.
5. Ask: "Move that task to done." Watch it land in Done with a completion time.
6. Ask: "Delete that task." Watch it disappear.

Verified 2026-09-05 against `localhost:3000` with a stdio client driving `webmcp-server`
the way Claude Code does: the eight tools listed, `cascade_create_task` put a card in To Do,
`cascade_move_task` moved it to Done with a completion time, and `cascade_delete_task`
removed it, each change visible on the board without a reload. A call with a bad task id came
back as an MCP error with `isError: true` and Chrome's generic text, "Tool was executed but the
invocation failed"; the field-naming message did not reach the client.

The same run against `https://cascade.vinny.dev/` (v5.3.0, extension set to "Always on" for
that origin) passed the same way: create, move to Done, delete, each visible on the live board
without a reload.

Without the browser, you can talk to the server directly. It answers `initialize` and
`tools/list` over stdio; with no activated tab the tool list is empty.

### Known gaps in this bridge

- It drops tool annotations before they reach Claude Code (verified: `tools/list` carries no
  `annotations` field), so `consequentialHint` on `cascade_delete_task` produces no
  confirmation prompt on the client side.
- Handler error messages arrive as Chrome's generic `UnknownError` (see Part 1).
- It reads tools from every activated tab. With two Cascade tabs open you get two sets.

## Part 3: local development

```bash
bun run dev            # http://localhost:3000
```

The dev server is a secure context, so the flag is enough. Turn the extension on for
`localhost:3000` separately. In development, React strict mode mounts the board twice; the
registration aborts and re-registers cleanly, and the console shows nothing.

When WebMCP is absent the app logs one info line in development. Production builds strip all
console output (`removeConsole` in `next.config.ts`), so only the footer indicator reports the
state there.

## Part 4: tests

- **Unit** (`bun run test`): `src/lib/webmcp/__tests__/` runs every tool against the real
  store actions and the real `TaskDatabase` on fake-indexeddb, plus registration, detection,
  and the registry contract.
- **Real browser, opt-in**: launches the installed Chrome with `--enable-features=WebMCP`,
  calls `getTools()` and `executeTool()` from the page, and asserts the board follows each
  write. Needs Chrome on this machine; the bundled Playwright Chromium (151) is not used.

  ```bash
  WEBMCP_E2E=1 bunx playwright test --project=webmcp
  ```

  Verified 2026-09-05: 3 passed in 2.3s. Without `WEBMCP_E2E=1` the tests skip, and the
  default `chromium` project ignores the file, so `bun run test:e2e` is unaffected.

## Part 5: manual checklist

Run this after any change to the tool layer or the bridge.

- [ ] Chrome flag on, footer reads "Agent tools on", hover shows "8 WebMCP tools".
- [ ] DevTools: `getTools()` lists the eight `cascade_` names.
- [ ] Extension set to "Always on" for the origin (yellow or green dot in its popup).
- [ ] `claude mcp get webmcp-server` reports connected.
- [ ] From Claude Code: create a task. It appears in To Do without a reload.
- [ ] From Claude Code: move it to done. It moves to Done and shows a completion time.
- [ ] From Claude Code: move it to done again. The response says `changed: false`.
- [ ] From Claude Code: delete it. It disappears from the board.
- [ ] Consequential confirmation: not supported by this bridge (annotations are dropped).
      Record it as skipped, not passed.
- [ ] Reload the tab. The footer returns to "Agent tools on" and the tool count is still 8.

## Fallback bridge: webmcp-cdp-bridge

`littleplato/webmcp-cdp-bridge` needs no extension. It connects to Chrome's DevTools
Protocol on port 9222 and evaluates the page's tools from outside. Trade-offs: Chrome has to be
launched with `--remote-debugging-port=9222 --user-data-dir=<separate profile>`, and the code
(last commit 2026-03-11) predates the current spec. It calls `navigator.modelContext.getTools()`
and `tool.execute(args)`; in Chrome 152 the first is undefined and the second does not exist
on a registered tool. Patch `src/cdp.ts` to use `document.modelContext` and
`document.modelContext.executeTool(tool, JSON.stringify(args))` before use. This patched
path is unverified.

```bash
git clone https://github.com/littleplato/webmcp-cdp-bridge
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-webmcp
claude mcp add -s user webmcp-cdp -- ~/.bun/bin/bun run /absolute/path/to/webmcp-cdp-bridge/src/index.ts
```

Rejected alternatives: `@mcp-b/webmcp-local-relay` (5.1.0) needs an embed script on the
page, which adds a runtime dependency; `nathan-gage/webmcp-bridge` (last commit 2026-02-12)
injects its own `navigator.modelContext` polyfill.
