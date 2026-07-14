#!/bin/bash
# on-pre-tool.sh — Claude Code "PreToolUse" Hook
# Erzwingt echten Sitzungs-Stopp nach einer abgeschlossenen Aufgabe: Sobald
# SESSION_NOTES.md TASK_COMPLETE enthaelt, wird JEDER weitere Werkzeug-Aufruf
# blockiert, damit die Session zwingend endet und N8N die naechste Aufgabe in
# einer frischen Sitzung startet (statt im selben Kontext weiterzuarbeiten).

INPUT=$(cat)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/data/.openclaw/workspace/projects/Games}"
SESSION_FILE="$PROJECT_DIR/SESSION_NOTES.md"

if grep -q "TASK_COMPLETE" "$SESSION_FILE" 2>/dev/null; then
  # git add/commit/push trotzdem erlauben — sonst kann nach TASK_COMPLETE nicht mehr gepusht werden
  CMD=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null)
  if echo "$CMD" | grep -qE "^git (add|commit|push)"; then
    exit 0
  fi

  echo "STOPP: Diese Aufgabe ist bereits abgeschlossen (TASK_COMPLETE steht in SESSION_NOTES.md). Rufe JETZT kein weiteres Werkzeug mehr auf. Schreibe nur noch eine kurze Abschluss-Zusammenfassung als Text und beende deine Antwort. Fange KEINE neue Aufgabe an — die naechste Aufgabe wird automatisch in einer neuen, frischen Sitzung gestartet." >&2
  exit 2
fi

exit 0
