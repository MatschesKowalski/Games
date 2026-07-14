#!/bin/bash
# on-pre-tool.sh — Claude Code "PreToolUse" Hook
# Blockiert weitere Tool-Aufrufe nach TASK_COMPLETE — aber NUR in automatischen
# Sitzungen (gestartet mit --dangerously-skip-permissions via N8N/cc-start.sh).
# Manuelle/interaktive Sitzungen werden nie blockiert.

INPUT=$(cat)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/data/.openclaw/workspace/projects/Games}"
SESSION_FILE="$PROJECT_DIR/SESSION_NOTES.md"

if grep -q "TASK_COMPLETE" "$SESSION_FILE" 2>/dev/null; then
  # Prüfen ob diese Session automatisch gestartet wurde (--dangerously-skip-permissions
  # im Prozessbaum) — manuelle Sessions bleiben unblockiert
  IS_AUTOMATED=0
  CHECK_PID=$PPID
  for _ in 1 2 3 4 5; do
    ARGS=$(tr '\0' ' ' < /proc/$CHECK_PID/cmdline 2>/dev/null || echo "")
    if echo "$ARGS" | grep -q "dangerously-skip-permissions"; then
      IS_AUTOMATED=1
      break
    fi
    CHECK_PID=$(awk '/^PPid:/{print $2}' /proc/$CHECK_PID/status 2>/dev/null)
    [ -z "$CHECK_PID" ] && break
  done

  if [ "$IS_AUTOMATED" -eq 1 ]; then
    # git add/commit/push trotzdem erlauben — wird nach TASK_COMPLETE noch gebraucht
    CMD=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null)
    if echo "$CMD" | grep -qE "^git (add|commit|push)"; then
      exit 0
    fi
    echo "STOPP: Diese Aufgabe ist bereits abgeschlossen (TASK_COMPLETE steht in SESSION_NOTES.md). Rufe JETZT kein weiteres Werkzeug mehr auf. Schreibe nur noch eine kurze Abschluss-Zusammenfassung als Text und beende deine Antwort. Fange KEINE neue Aufgabe an — die naechste Aufgabe wird automatisch in einer neuen, frischen Sitzung gestartet." >&2
    exit 2
  fi
fi

exit 0
