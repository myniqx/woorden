#!/usr/bin/env bash
# Usage: bash scripts/add-zinnen.sh [file]
# Default file: scripts/zinnen-queue.txt
#
# Each line in the file is a zin in woorden notation.
# Lines starting with # are skipped (comments).
# Already-processed lines are tracked in zinnen-queue.done.

FILE="${1:-scripts/zinnen-queue.txt}"
DONE_FILE="${FILE%.txt}.done"

if [[ ! -f "$FILE" ]]; then
  echo "File not found: $FILE"
  exit 1
fi

touch "$DONE_FILE"

while IFS= read -r line; do
  # Skip empty lines and comments
  [[ -z "$line" || "$line" == \#* ]] && continue

  # Skip already processed lines
  if grep -qxF "$line" "$DONE_FILE"; then
    echo "SKIP: $line"
    continue
  fi

  echo ""
  echo ">>> $line"
  npm run woorden -- add-zin "$line"
  STATUS=$?

  if [[ $STATUS -eq 0 ]]; then
    echo "$line" >> "$DONE_FILE"
  else
    echo "FAILED (exit $STATUS): $line"
    echo "Press Enter to continue, Ctrl+C to abort..."
    read -r
  fi

done < "$FILE"

echo ""
echo "Done. Processed lines tracked in: $DONE_FILE"
