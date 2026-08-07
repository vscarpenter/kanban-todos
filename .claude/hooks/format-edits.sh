#!/bin/bash
# .claude/hooks/format-edits.sh
#
# Fires on PostToolUse for Edit, Write, and MultiEdit. Applies the linter's
# auto-fixable rules to edited files.
#
# Note: this is NOT a formatter. eslint.config.mjs has no Prettier/Biome
# integration, so on .ts/.tsx this only applies eslint's own fixable rules --
# it will not reformat whitespace, quotes, or line width. If you want true
# formatting, add a formatter here and to package.json rather than expecting
# `eslint --fix` to do it.
#
# Register in .claude/settings.json under hooks.PostToolUse with matcher
# "Edit|Write|MultiEdit".

set -u

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[ -z "$FILE_PATH" ] && exit 0
[ ! -f "$FILE_PATH" ] && exit 0

# Match by extension, dispatch to the right formatter
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs)
    bunx eslint --fix "$FILE_PATH" 2>&1 | tail -5 || true
    ;;
  *.py)
    ruff format "$FILE_PATH" 2>&1 | tail -5 || true
    ;;
  *.rs)
    rustfmt "$FILE_PATH" 2>&1 | tail -5 || true
    ;;
  *.go)
    gofmt -w "$FILE_PATH" 2>&1 | tail -5 || true
    ;;
  *.swift)
    swift-format -i "$FILE_PATH" 2>&1 | tail -5 || true
    ;;
esac

# Always exit 0: formatting is best-effort, not a blocker
exit 0
