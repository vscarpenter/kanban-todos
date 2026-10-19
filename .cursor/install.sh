#!/usr/bin/env bash
# Cloud Agent install phase for the Cascade (kanban-todos) app.
# Runs once during an environment build, before the snapshot, so bun and
# node_modules are baked into the image future agents boot from.
set -euo pipefail

# Bun is this repo's package manager (bun.lock) but is not part of the base
# image. Install it on the default PATH; login shells skip ~/.bashrc, so a
# symlink into /usr/local/bin is what makes `bun` resolvable in later phases.
#
# Note: package.json pins "packageManager": "bun@1.3.5", but bun.lock is written
# in lockfile version 3, which 1.3.5 cannot parse ("Unknown lockfile version").
# We install the current bun release, which reads the lockfile; determinism comes
# from --frozen-lockfile pinning the dependency tree rather than the bun version.
if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
fi
sudo ln -sf "$HOME/.bun/bin/bun" /usr/local/bin/bun

bun --version
bun install --frozen-lockfile
