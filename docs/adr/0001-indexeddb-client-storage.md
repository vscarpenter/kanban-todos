# ADR-0001: IndexedDB for Client-Side Storage

**Status:** Accepted  
**Date:** 2024-01-15

## Context

A Kanban todo app needs persistent storage for tasks, boards, and settings. Traditional
approaches rely on a backend database with a server API. However, storing personal task
data on a third-party server introduces privacy concerns, requires authentication
infrastructure, incurs hosting costs, and breaks offline usage. We need a storage
solution that works entirely within the user's browser.

Options considered:
- **localStorage** — synchronous, 5 MB limit, no querying, blocks the main thread
- **IndexedDB** — asynchronous, large storage quota (~1 GB+), supports indexes and transactions
- **Remote database (e.g., Supabase, PlanetScale)** — requires a server, user accounts, and data leaves the device

## Decision

Use IndexedDB as the sole persistence layer, wrapped in a `TaskDatabase` class that
provides a clean async API over the low-level IndexedDB interface. All task, board,
and settings data is stored locally in the user's browser. No data is ever transmitted
to a server.

The `TaskDatabase` class encapsulates:
- Schema versioning and migrations via `onupgradeneeded`
- Typed read/write methods per object store
- Transaction management and error handling

## Consequences

### Positive
- **True privacy** — user data never leaves their device; no accounts, no tracking
- **Offline-first by default** — the app is fully functional with no network connection
- **Zero backend cost** — no database server, no API layer, no auth service to maintain
- **Large storage capacity** — handles thousands of tasks without hitting limits
- **Fast reads** — indexed queries on local data are extremely low-latency

### Negative
- **No cross-device sync** — data is siloed to one browser; users must manually export/import to migrate
- **Browser storage is clearable** — users or browsers (under storage pressure) can wipe IndexedDB data without warning
- **No server-side backup** — data loss on device means permanent loss unless user exports
- **IndexedDB API is verbose** — the `TaskDatabase` wrapper is required to keep consuming code readable
- **Private/incognito mode** — storage is ephemeral in private browsing sessions, which may surprise users
