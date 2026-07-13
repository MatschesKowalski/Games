#!/bin/bash
# on-pre-tool.sh — Claude Code "PreToolUse" Hook
# Erzwingt echten Sitzungs-Stopp nach einer abgeschlossenen Aufgabe: Sobald
# SESSION_NOTES.md TASK_COMPLETE enthaelt, wird JEDER weitere Werkzeug-Aufruf
# blockiert, damit die Session zwingend endet und N8N die naechste Aufgabe in
# einer frischen Sitzung startet (statt im selben Kontext weiterzuarbeiten).

cat > /dev/null  # Hook-Payload (stdin) konsumieren, Inhalt wird nicht gebraucht

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/data/.openclaw/workspace/projects/Games}"
SESSION_FILE="$PROJECT_DIR/SESSION_NOTES.md"

if grep -q "TASK_COMPLETE" "$SESSION_FILE" 2>/dev/null; then
  echo "STOPP: Diese Aufgabe ist bereits abgeschlossen (TASK_COMPLETE steht in SESSION_NOTES.md). Rufe JETZT kein weiteres Werkzeug mehr auf. Schreibe nur noch eine kurze Abschluss-Zusammenfassung als Text und beende deine Antwort. Fange KEINE neue Aufgabe an — die naechste Aufgabe wird automatisch in einer neuen, frischen Sitzung gestartet." >&2
  exit 2
fi

exit 0
