# CLAUDE.md — Orchestrator

## Aufgaben-Workflow
1. `tasks.md` lesen → nächste Aufgabe mit `status: todo` (niedrigste Prio-Nummer zuerst)
2. Aufgabe als `in_progress` markieren, SESSION_NOTES.md mit Aufgabe + Plan befüllen
3. Aufgabentyp bestimmen → passenden Agent aufrufen (siehe Routing)
4. QA-Agent aufrufen → **betroffene Test-Dateien explizit mitgeben** (nie blind alle testen)
5. Bei Test-Fehler → Domain-Agent erneut mit Fehler-Kontext aufrufen (max. 3 Versuche)
6. Bei Erfolg: Aufgabe als `done` markieren → `git add -A && git commit && git push` → TASK_COMPLETE

!!! Am Ende jeder Task muss immer `TASK_COMPLETE` in SESSION_NOTES.md stehen, fange keine neuen Tasks in der selben Session an !!!

## Agent-Routing
| Aufgaben-Typ                                        | Agent                          |
|------------------------------------------------------|--------------------------------|
| Simulationskern (Tick, Befehle, State, Speicherstand) | `.claude/agents/sim-core.md`   |
| PixiJS, Rendering, Kamera, Isometrie, UI              | `.claude/agents/rendering.md`  |
| Sprachdateien (i18n), Story/Events, Fraktionstexte    | `.claude/agents/content.md`    |
| Cross-cutting (Kern + Rendering)                      | sim-core → dann rendering      |
| Tests ausführen / Ergebnis prüfen                     | `.claude/agents/qa.md`         |

## Kontext für Agents
Jeder Agent lädt zusätzlich:
- `.claude/context/arch.md` — Architektur-Abhängigkeitsregeln (Kern/Rendering-Trennung)
- `.claude/context/shared.md` — Konventionen, Anti-Patterns, Datei-Limits
- `.claude/context/history.md` — Schlüssel-Entscheidungen des Projekts
- `.claude/context/prd.md` — Projektübersicht (bei Unklarheit über Scope/Ziel)
- `spielkonzept.md` (Repo-Root) — vollständiges Spielkonzept (Ursprungsdokument)

## TASK_COMPLETE — Absolute Regeln
- **NUR der Orchestrator** schreibt "TASK_COMPLETE" in SESSION_NOTES.md
- Sub-Agents dürfen "TASK_COMPLETE" **NIEMALS** verwenden — auch nicht in negativem Kontext
- Reihenfolge zwingend: Tests bestehen → git commit + push → SESSION_NOTES.md = "TASK_COMPLETE"
- Beim Schreiben: SESSION_NOTES.md **vollständig überschreiben**, kein weiterer Text

## Session-Persistenz
- SESSION_NOTES.md während der Arbeit regelmäßig aktualisieren (Fortschritt, nächste Schritte)
- Bei Unterbrechung (Token-Limit): aktuellen Stand vollständig dokumentieren
- `/compact` nutzen wenn Kontext über 70%

## Datei-Limits (werden durchgesetzt)
- `CLAUDE.md`: max. 55 Zeilen — `agents/*.md`: max. 80 Zeilen
- `context/shared.md`: max. 60 Zeilen — `context/history.md`: max. 40 Zeilen
- `context/arch.md`: max. 15 Zeilen
- **Regel:** Limit überschritten → erst komprimieren, dann ergänzen

## Arbeitsregeln (aus spielkonzept.md)
- Auf Deutsch kommunizieren. Nichts ohne Rückfrage aus dem Internet herunterladen.
- Keine geschützten Namen/Figuren/Häuser (z. B. aus Game of Thrones) übernehmen.

## Kommunikation mit dem User
- **Der User ist Laie** — keine Tech-/Gamedev-Fachbegriffe ohne Erklärung. Unvermeidlicher
  Fachbegriff: einmal in Klammern in einem Satz erklären, dann in Klartext weiter.
- **Prägnant und kurz** antworten — keine Wiederholungen, keine Aufwärm-Sätze. Wichtige
  Inhalte (Entscheidungen, Caveats) nicht weglassen, nur Beiwerk-Text reduzieren.
- Kein ungebetenes Cross-Selling von Features ("man könnte auch …") — nur erwähnen, wenn
  relevant für die aktuelle Frage.
