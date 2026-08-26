#!/bin/sh

set -eu

# Build the parser for SQL using tREx.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_PATH="$SCRIPT_DIR/sql-parser.js"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_PATH="${TARGET_PATH}.bak-${TIMESTAMP}"
TEMP_OUTPUT="$(mktemp "$SCRIPT_DIR/sql-parser.XXXXXX.js")"

TREX_LOCAL="$REPO_DIR/maiacc/bin/tREx.sh"
TREX_SIBLING="$(cd "$REPO_DIR/.." && pwd)/maiacc/bin/tREx.sh"

if [ -x "$TREX_LOCAL" ]; then
	TREX="$TREX_LOCAL"
elif [ -x "$TREX_SIBLING" ]; then
	TREX="$TREX_SIBLING"
else
	echo "Error: tREx.sh not found in '$TREX_LOCAL' or '$TREX_SIBLING'." >&2
	exit 127
fi

if [ -f "$TARGET_PATH" ]; then
	cp "$TARGET_PATH" "$BACKUP_PATH"
fi

"$TREX" "$REPO_DIR/grammar/SQL.ebnf" "$TEMP_OUTPUT"
cp "$TEMP_OUTPUT" "$TARGET_PATH"
rm -f "$TEMP_OUTPUT"

echo "Parser regenerated successfully. Backup retained at: $BACKUP_PATH"
