#!/bin/bash
# on-session-end.sh — Claude Code "SessionEnd" Hook
# Wird ausgelöst wenn eine Claude Code Session endet.
# Entscheidet ob eine neue Session gestartet wird (Kontext-Reset)
# oder ob auf das nächste Zeitfenster gewartet wird.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/data/.openclaw/workspace/projects/Games}"
TASKS_FILE="$PROJECT_DIR/tasks.md"
SESSION_FILE="$PROJECT_DIR/SESSION_NOTES.md"
SIGNAL_DIR="/tmp/claude-signals"
LOG_FILE="/tmp/claude-automation.log"

mkdir -p "$SIGNAL_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "SessionEnd Hook ausgelöst (Games)"

# Prüfe ob die letzte Aufgabe als fertig markiert wurde
TASK_COMPLETE=false
if grep -q "TASK_COMPLETE" "$SESSION_FILE" 2>/dev/null; then
  TASK_COMPLETE=true
  log "Letzte Aufgabe wurde abgeschlossen"
fi

# Prüfe ob es noch offene Aufgaben gibt
HAS_TODO=false
if grep -q "status: todo" "$TASKS_FILE" 2>/dev/null; then
  HAS_TODO=true
fi

# Entscheidungslogik
if [ "$TASK_COMPLETE" = true ] && [ "$HAS_TODO" = true ]; then
  # Aufgabe fertig + noch Tasks offen → Neue Session starten (Kontext-Reset!)
  log "Starte neue Session für nächste Aufgabe"

  # Kurz warten damit die alte Session sauber beendet wird
  sleep 5

  # SESSION_NOTES zurücksetzen
  echo -e "# Session Notes\n\nNeue Session gestartet. Nächste Aufgabe aus tasks.md." > "$SESSION_FILE"

  # Signal für N8N Monitoring
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Neue Aufgabe gestartet" > "$SIGNAL_DIR/status"

  # Neue Claude Code Session starten
  cd "$PROJECT_DIR" && nohup claude --dangerously-skip-permissions \
    -p "Lies tasks.md und wähle die nächste Aufgabe mit status: todo (niedrigste Prio-Nummer zuerst). Markiere sie als in_progress und arbeite sie ab. Beachte die Regeln in CLAUDE.md." \
    > /tmp/claude-session.log 2>&1 &

  log "Neue Session gestartet (PID: $!)"

elif [ "$TASK_COMPLETE" = true ] && [ "$HAS_TODO" = false ]; then
  # Alle Aufgaben fertig!
  log "ALLE AUFGABEN ABGESCHLOSSEN"
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Alle Aufgaben abgeschlossen!" > "$SIGNAL_DIR/all_complete"
  echo -e "# Session Notes\n\nAlle Aufgaben abgeschlossen. Warte auf neue Aufgaben." > "$SESSION_FILE"

else
  # Aufgabe NICHT fertig (Token-Limit, Crash, etc.)
  log "Session beendet ohne Task-Completion — wahrscheinlich Token-Limit"
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Warte auf nächstes Fenster (Task unfertig)" > "$SIGNAL_DIR/status"

  # SESSION_NOTES.md bleibt erhalten für "Mach weiter"-Prompt
  # N8N wird beim nächsten Polling die Session fortsetzen
fi

exit 0
