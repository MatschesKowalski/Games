#!/bin/bash
# on-stop.sh — Claude Code "Stop" Hook
# Wird ausgelöst wenn Claude Code sich selbst stoppen will.

INPUT=$(cat)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/data/.openclaw/workspace/projects/Games}"
TASKS_FILE="$PROJECT_DIR/tasks.md"
SESSION_FILE="$PROJECT_DIR/SESSION_NOTES.md"

HAS_IN_PROGRESS=$(grep -c "status: in_progress" "$TASKS_FILE" 2>/dev/null || echo "0")
HAS_TASK_COMPLETE=$(grep -c "TASK_COMPLETE" "$SESSION_FILE" 2>/dev/null || echo "0")

# Fall 1: Task läuft noch, kein TASK_COMPLETE → blockieren
if [ "$HAS_IN_PROGRESS" -gt 0 ] && [ "$HAS_TASK_COMPLETE" -eq 0 ]; then
  echo '{"decision": "block", "reason": "STOPP: Eine Aufgabe ist noch in_progress und SESSION_NOTES enthält kein TASK_COMPLETE. Tue folgendes: 1) Markiere die Aufgabe in tasks.md als done (status: done). 2) Schreibe TASK_COMPLETE in SESSION_NOTES.md. 3) Führe git add -A && git commit && git push aus. Erst dann stoppen."}'
  exit 0
fi

# Fall 2: TASK_COMPLETE in Notes, aber Task in tasks.md immer noch in_progress → Widerspruch
if [ "$HAS_TASK_COMPLETE" -gt 0 ] && [ "$HAS_IN_PROGRESS" -gt 0 ]; then
  echo '{"decision": "block", "reason": "WIDERSPRUCH: SESSION_NOTES enthält TASK_COMPLETE, aber in tasks.md steht die Aufgabe noch auf in_progress. Ändere den Status in tasks.md auf done, dann stoppen."}'
  exit 0
fi

# Fall 3: TASK_COMPLETE in Notes, Task auf done — prüfe ob git push gemacht wurde
if [ "$HAS_TASK_COMPLETE" -gt 0 ]; then
  LAST_COMMIT_MSG=$(cd "$PROJECT_DIR" && git log -1 --format="%s" 2>/dev/null || echo "")
  if [ -z "$LAST_COMMIT_MSG" ]; then
    echo '{"decision": "block", "reason": "Kein git commit gefunden. Führe git add -A && git commit && git push aus, bevor du stoppst."}'
    exit 0
  fi
  # Prüfe ob es uncommitted changes gibt
  UNCOMMITTED=$(cd "$PROJECT_DIR" && git status --porcelain 2>/dev/null | grep -v "^??" | wc -l)
  if [ "$UNCOMMITTED" -gt 0 ]; then
    echo '{"decision": "block", "reason": "Es gibt noch uncommitted Änderungen. Führe git add -A && git commit && git push aus, bevor du stoppst."}'
    exit 0
  fi
fi

# Alles in Ordnung — darf stoppen
exit 0
