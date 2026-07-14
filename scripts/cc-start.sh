#!/bin/bash
# cc-start.sh v4.2 — Zentrales Script für Claude Code Automation
# v4:   script TTY + echo pipe für Pro-Abo + pgrep statt PID-Check
# v4.1: setsid statt nohup — CC überlebt SSH-Session-Ende
# v4.2: Token-Limit-Erkennung für smashed Text (ANSI-Cursor-Codes entfernen Leerzeichen)
#
# Modi:
#   check          - Prüft ob CC läuft
#   tasks          - Zählt offene Tasks
#   notes          - Liest SESSION_NOTES.md
#   should-start   - Entscheidet ob CC gestartet werden soll
#   start <typ>    - Startet CC (neue-aufgabe | weiter)
#   status         - Strukturierter Bericht für Telegram
#   should-report  - Prüft ob 5h-Bericht fällig ist
#   mark-reported  - Markiert Bericht als gesendet
#   git-push       - Pushed Änderungen an GitHub

MODE=$1
PROJECT="/data/.openclaw/workspace/projects/Games"
CC="/data/.local/bin/claude"
MODEL="claude-sonnet-4-6"
LOCKFILE="/data/cc-games.lock"
SESSION_LOG="/data/claude-games-session.log"
LAST_REPORT="/data/cc-games-last-report.txt"
LAST_START="/data/cc-games-last-start.txt"
FAILED_STARTS="/data/cc-games-failed-starts.txt"

# Token-Limit Suchbegriffe (case-insensitive)
# Normale Schreibweise + smashed (ANSI-Cursor-Codes entfernen Leerzeichen im Log)
TOKEN_LIMIT_PATTERNS="hit your limit|hityourlimit|you've hit your limit|youvehityour|resets.*UTC|resets.*[0-9].*[ap]m|rate limit|ratelimit|rate_limit|usage limit|usagelimit|token limit|tokenlimit|session limit|sessionlimit|100%.*limit|over_quota|resource_exhausted|plan limit|planlimit|Credit balance|limit to reset|Switch to extra usage|rate-limit-options"

# ============================================================
check_token_limit() {
    if [ -f "$SESSION_LOG" ]; then
        # ANSI-Escape-Codes + Carriage Returns entfernen, damit grep den reinen Text findet
        TAIL=$(tail -100 "$SESSION_LOG" 2>/dev/null \
            | sed 's/\x1b\[[0-9;]*[A-Za-z]//g' \
            | sed 's/\x1b\][^\x07]*\x07//g' \
            | tr -d '\r')
        if echo "$TAIL" | grep -qiE "$TOKEN_LIMIT_PATTERNS"; then
            return 0
        fi
    fi
    return 1
}

get_failed_starts() {
    cat "$FAILED_STARTS" 2>/dev/null || echo "0"
}

increment_failed_starts() {
    CURRENT=$(get_failed_starts)
    echo $((CURRENT + 1)) > "$FAILED_STARTS"
}

reset_failed_starts() {
    echo "0" > "$FAILED_STARTS"
}

minutes_since_last_fail() {
    if [ -f "$FAILED_STARTS" ]; then
        LAST_FAIL=$(stat -c %Y "$FAILED_STARTS" 2>/dev/null || echo "0")
        NOW=$(date +%s)
        echo $(( (NOW - LAST_FAIL) / 60 ))
    else
        echo "9999"
    fi
}
# ============================================================

if [ "$MODE" = "check" ]; then
    pgrep -f "claude.*dangerously" > /dev/null 2>&1 && echo "running" || echo "stopped"

elif [ "$MODE" = "tasks" ]; then
    COUNT=$(grep -c "\*\*status:\*\* todo" "$PROJECT/tasks.md" 2>/dev/null)
    echo "${COUNT:-0}"

elif [ "$MODE" = "notes" ]; then
    cat "$PROJECT/SESSION_NOTES.md" 2>/dev/null || echo "NO_SESSION_NOTES"

elif [ "$MODE" = "check-token-limit" ]; then
    if check_token_limit; then
        echo "yes-token-limit-erkannt"
    else
        echo "no-kein-token-limit"
    fi

# ============================================================
# MODUS: should-start
# ============================================================
elif [ "$MODE" = "should-start" ]; then
    # 1. Läuft CC bereits?
    if pgrep -f "claude.*dangerously" > /dev/null 2>&1; then
        NOTES=$(cat "$PROJECT/SESSION_NOTES.md" 2>/dev/null || echo "")
        if echo "$NOTES" | grep -q "TASK_COMPLETE"; then
            # Task fertig → CC killen, neu starten
            pkill -f "claude.*dangerously" 2>/dev/null
            sleep 3
        elif check_token_limit; then
            # Token-Limit erkannt während CC läuft → CC killen, Fenster-Start setzen
            # Die Wartezeit-Logik greift dann weiter unten (Schritt 4)
            pkill -f "claude.*dangerously" 2>/dev/null
            sleep 3
            if [ ! -f "/data/cc-games-window-start.txt" ]; then
                date +%s > /data/cc-games-window-start.txt
            fi
        else
            echo "no-running"
            exit 0
        fi
    fi

    # 2. Lock-File
    if [ -f "$LOCKFILE" ]; then
        LOCK_AGE=$(( $(date +%s) - $(stat -c %Y "$LOCKFILE" 2>/dev/null || echo "0") ))
        if [ "$LOCK_AGE" -gt 600 ]; then
            rm -f "$LOCKFILE"
        else
            echo "no-locked"
            exit 0
        fi
    fi

    # 3. Gibt es offene Tasks?
    TODO_COUNT=$(grep -c "\*\*status:\*\* todo" "$PROJECT/tasks.md" 2>/dev/null)
    TODO_COUNT=${TODO_COUNT:-0}
    IN_PROGRESS=$(grep -c "\*\*status:\*\* in_progress" "$PROJECT/tasks.md" 2>/dev/null)
    IN_PROGRESS=${IN_PROGRESS:-0}
    if [ "$TODO_COUNT" -eq 0 ] && [ "$IN_PROGRESS" -eq 0 ]; then
        if [ ! -f "/data/cc-games-all-done-notified.txt" ]; then
            echo "1" > /data/cc-games-all-done-notified.txt
            echo "no-all-done"
        else
            echo "no-waiting"
        fi
        exit 0
    fi

    # 4. Token-Limit Check: Log-basiert
    if check_token_limit; then
        if [ -f "/data/cc-games-window-start.txt" ]; then
            WINDOW_START=$(cat /data/cc-games-window-start.txt)
            NOW=$(date +%s)
            MIN_SINCE=$(( (NOW - WINDOW_START) / 60 ))
        else
            MIN_SINCE=0
        fi

        if [ "$MIN_SINCE" -lt 300 ]; then
            WAIT=$(( 300 - MIN_SINCE ))
            if [ ! -f "/data/cc-games-token-limit-notified.txt" ]; then
                echo "1" > /data/cc-games-token-limit-notified.txt
                echo "no-token-limit-log-wait-${WAIT}min"
            else
                echo "no-waiting"
            fi
            exit 0
        else
            reset_failed_starts
            rm -f /data/cc-games-token-limit-notified.txt
            date +%s > /data/cc-games-window-start.txt
            echo "" > "$SESSION_LOG"
        fi
    fi

    # 5. Token-Limit Check: Fehlstart-basiert (Backup)
    FAILS=$(get_failed_starts)
    if [ "$FAILS" -ge 3 ]; then
        if [ -f "/data/cc-games-window-start.txt" ]; then
            WINDOW_START=$(cat /data/cc-games-window-start.txt)
            NOW=$(date +%s)
            MIN_SINCE=$(( (NOW - WINDOW_START) / 60 ))
        else
            MIN_SINCE=0
        fi

        if [ "$MIN_SINCE" -lt 300 ]; then
            WAIT=$(( 300 - MIN_SINCE ))
            if [ ! -f "/data/cc-games-token-limit-notified.txt" ]; then
                echo "1" > /data/cc-games-token-limit-notified.txt
                echo "no-token-limit-fail-wait-${WAIT}min"
            else
                echo "no-waiting"
            fi
            exit 0
        else
            reset_failed_starts
            rm -f /data/cc-games-token-limit-notified.txt
            date +%s > /data/cc-games-window-start.txt
            echo "" > "$SESSION_LOG"
        fi
    fi

    # 6. Entscheide: neue Aufgabe oder weiter?
    NOTES=$(cat "$PROJECT/SESSION_NOTES.md" 2>/dev/null || echo "")

    # Sicherheitsprüfung: Task in_progress aber TASK_COMPLETE fehlt → hängt halb-fertig
    # Lösung: Task auf todo zurücksetzen, sauber neu starten
    if grep -q "status: in_progress" "$PROJECT/tasks.md" 2>/dev/null; then
        if ! echo "$NOTES" | grep -q "TASK_COMPLETE"; then
            # Session war unterbrochen ohne sauberes Ende → Task zurücksetzen
            sed -i 's/\*\*status:\*\* in_progress/**status:** todo/g' "$PROJECT/tasks.md"
            echo "Warte auf neue Aufgabe." > "$PROJECT/SESSION_NOTES.md"
            NOTES="Warte auf neue Aufgabe."
        fi
    fi

    # Nächsten Task-Namen ermitteln (für Telegram-Nachricht)
    NEXT_TASK=$(grep -B5 "\*\*status:\*\* todo" "$PROJECT/tasks.md" 2>/dev/null | grep "^### " | head -1 | sed 's/^### //' | tr -d '\n\r')
    if [ -z "$NEXT_TASK" ]; then
        NEXT_TASK=$(grep -B5 "\*\*status:\*\* in_progress" "$PROJECT/tasks.md" 2>/dev/null | grep "^### " | head -1 | sed 's/^### //' | tr -d '\n\r')
    fi
    [ -z "$NEXT_TASK" ] && NEXT_TASK="Unbekannte Task"

    if [ ! -f "/data/cc-games-window-start.txt" ]; then
        date +%s > /data/cc-games-window-start.txt
    fi

    if echo "$NOTES" | grep -q "TASK_COMPLETE"; then
        echo "yes-neue-aufgabe::$NEXT_TASK"
    elif [ -z "$NOTES" ] || echo "$NOTES" | grep -q "Warte auf"; then
        echo "yes-neue-aufgabe::$NEXT_TASK"
    else
        echo "yes-weiter::$NEXT_TASK"
    fi

# ============================================================
# MODUS: start <neue-aufgabe|weiter>
# v4.1: setsid + script TTY + echo pipe + pgrep Check
# ============================================================
elif [ "$MODE" = "start" ]; then
    TYPE=$2

    # Lock setzen
    echo "$(date '+%Y-%m-%d %H:%M:%S')" > "$LOCKFILE"
    date '+%Y-%m-%d %H:%M:%S' > "$LAST_START"

    if [ "$TYPE" = "neue-aufgabe" ]; then
        # SESSION_NOTES zurücksetzen
        echo "Neue Session gestartet $(date '+%Y-%m-%d %H:%M:%S'). Naechster offener Task wird bearbeitet." > "$PROJECT/SESSION_NOTES.md"

        # Altes Log leeren + all-done Flag zurücksetzen
        echo "" > "$SESSION_LOG"
        rm -f /data/cc-games-all-done-notified.txt

        PROMPT="Lies CLAUDE.md, tasks.md und SESSION_NOTES.md. Arbeite eigenstaendig am naechsten offenen Task (status: todo). KEINE Rueckfragen - triff eigene Entscheidungen. Dokumentiere Entscheidungen in SESSION_NOTES.md. Aktualisiere tasks.md bei Fortschritt. Committe und pushe nach jedem Task."

        cd "$PROJECT" && export PATH="/home/node/.local/bin:$PATH" && \
            setsid script -q -c "printf '%s\n' \"$PROMPT\" | $CC --dangerously-skip-permissions --model $MODEL" /dev/null \
            > "$SESSION_LOG" 2>&1 &

    elif [ "$TYPE" = "weiter" ]; then
        echo "" > "$SESSION_LOG"

        # --continue: neueste Conversation im Projektverzeichnis fortsetzen (kein interaktiver Dialog)
        # Minimaler Prompt: Session kennt den Stand bereits aus der Conversation History
        PROMPT="Lies SESSION_NOTES.md und arbeite autonom weiter. Committe und pushe jede Aenderung."

        cd "$PROJECT" && export PATH="/home/node/.local/bin:$PATH" && \
            setsid script -q -c "printf '%s\n' \"$PROMPT\" | $CC --dangerously-skip-permissions --model $MODEL --continue" /dev/null \
            > "$SESSION_LOG" 2>&1 &
    fi

    # Warte und prüfe ob CC noch läuft (Fehlstart-Erkennung)
    sleep 60
    if ! pgrep -f "claude.*dangerously" > /dev/null 2>&1; then
        # CC ist nach 60s schon weg → Fehlstart
        increment_failed_starts
        FAILS=$(get_failed_starts)

        if check_token_limit; then
            echo "failed-token-limit-versuch-$FAILS"
        else
            echo "failed-unknown-versuch-$FAILS"
        fi
    else
        # CC läuft stabil → alles gut
        reset_failed_starts
        echo "started-$TYPE"
    fi

    # Lock entfernen
    rm -f "$LOCKFILE"

# ============================================================
# MODUS: status
# ============================================================
elif [ "$MODE" = "status" ]; then
    DONE_TASKS=$(grep -B2 "\*\*status:\*\* done" "$PROJECT/tasks.md" 2>/dev/null | grep "^### " | sed 's/### /  [OK] /' || echo "  Keine")
    TODO_TASKS=$(grep -B2 "\*\*status:\*\* todo" "$PROJECT/tasks.md" 2>/dev/null | grep "^### " | sed 's/### /  📋 /' || echo "  Keine")
    PROGRESS_TASKS=$(grep -B2 "\*\*status:\*\* in_progress" "$PROJECT/tasks.md" 2>/dev/null | grep "^### " | sed 's/### /  🔄 /' || echo "  Keine")

    DONE_COUNT=$(grep -c "\*\*status:\*\* done" "$PROJECT/tasks.md" 2>/dev/null)
    DONE_COUNT=${DONE_COUNT:-0}
    TODO_COUNT=$(grep -c "\*\*status:\*\* todo" "$PROJECT/tasks.md" 2>/dev/null)
    TODO_COUNT=${TODO_COUNT:-0}
    IN_PROGRESS=$(grep -c "\*\*status:\*\* in_progress" "$PROJECT/tasks.md" 2>/dev/null)
    IN_PROGRESS=${IN_PROGRESS:-0}
    TOTAL=$((DONE_COUNT + TODO_COUNT + IN_PROGRESS))

    CC_RUNNING=$(pgrep -f "claude.*dangerously" > /dev/null 2>&1 && echo "[OK] Ja" || echo "❌ Nein")
    LAST=$(cat "$LAST_START" 2>/dev/null || echo "Noch nie")
    FAILS=$(get_failed_starts)

    NOTES=$(cat "$PROJECT/SESSION_NOTES.md" 2>/dev/null || echo "Keine Session Notes vorhanden")

    TOKEN_STATUS="[OK] OK"
    if check_token_limit; then
        TOKEN_STATUS="⚠️ Token-Limit erkannt (Log)"
    elif [ "$FAILS" -ge 3 ]; then
        TOKEN_STATUS="⚠️ Token-Limit vermutet ($FAILS Fehlstarts)"
    fi

    echo "📊 *5-Stunden-Bericht (Games)*"
    echo ""
    echo " CC laeuft: $CC_RUNNING"
    echo " Fortschritt: $DONE_COUNT/$TOTAL Tasks erledigt"
    echo "⏱ Letzter Start: $LAST"
    echo "📋 Token-Status: $TOKEN_STATUS"
    echo ""
    echo "*Erledigt:*"
    echo "$DONE_TASKS"
    echo ""
    echo "*In Arbeit:*"
    echo "$PROGRESS_TASKS"
    echo ""
    echo "*Offen:*"
    echo "$TODO_TASKS"
    echo ""
    echo "*Letzte Session Notes:*"
    echo "$NOTES" | head -20

# ============================================================
# MODUS: should-report
# ============================================================
elif [ "$MODE" = "should-report" ]; then
    if [ ! -f "$LAST_REPORT" ]; then
        echo "yes"
        exit 0
    fi

    LAST_REPORT_TIME=$(cat "$LAST_REPORT" 2>/dev/null || echo "0")
    NOW=$(date +%s)
    DIFF=$(( NOW - LAST_REPORT_TIME ))

    if [ "$DIFF" -ge 18000 ]; then
        echo "yes"
    else
        NEXT_IN=$(( (18000 - DIFF) / 60 ))
        echo "no-next-in-${NEXT_IN}min"
    fi

# ============================================================
# MODUS: mark-reported
# ============================================================
elif [ "$MODE" = "mark-reported" ]; then
    date +%s > "$LAST_REPORT"
    echo "marked"

# ============================================================
# MODUS: git-push
# ============================================================
elif [ "$MODE" = "git-push" ]; then
    cd "$PROJECT" && git add -A && git commit -m "Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')" && git push 2>&1 || echo "Nichts zu pushen"

fi
