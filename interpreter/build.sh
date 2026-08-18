#!/bin/sh

set -eu

# Build the parser for SQL using tREx.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

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

"$TREX" "$REPO_DIR/grammar/SQL.ebnf" "$SCRIPT_DIR/sql-parser.js"
