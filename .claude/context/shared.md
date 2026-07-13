# Shared — Konventionen & Standards

## Naming
| Was              | TypeScript   | i18n-Keys      |
|------------------|--------------|----------------|
| Dateien          | `kebab-case` | —              |
| Funktionen/Vars  | `camelCase`  | —              |
| Klassen/Types    | `PascalCase` | —              |
| Übersetzungs-Keys| —            | `dot.notation` |

## Commits (Conventional Commits)
`feat:` / `fix:` / `chore:` / `refactor:` / `docs:` / `style:` / `test:`
Beispiel: `feat: Bau-System für Ressourcengebäude`

## Anti-Patterns — NIE tun
- Kein `Math.random()`/`Date.now()` direkt im Sim-Kern → nur seeded RNG-Utility
- Kein Import von PixiJS/DOM in `src/sim/`
- Kein hartkodierter Text im Rendering/UI → nur `src/i18n/de.json`
- Keine direkte State-Mutation aus Rendering/UI → nur Befehle an den Kern
- Keine geschützten Namen/Figuren/Häuser (z. B. aus Game of Thrones)
- Kein `TASK_COMPLETE` durch Sub-Agents → nur Orchestrator

## Datei-Limits
- `CLAUDE.md`: max. 55 Zeilen | `agents/*.md`: max. 80 Zeilen
- `context/shared.md`: max. 60 Zeilen | `context/history.md`: max. 40 Zeilen
- `context/arch.md`: max. 15 Zeilen
- Limit überschritten → erst komprimieren, dann ergänzen

## Tests
- Schreiben für jedes neue Feature (Sim-Kern/Content: Vitest / Rendering: Playwright
  wo sinnvoll)
- Alle Tests müssen bestehen vor git commit
- **Immer gezielt testen** — nur betroffene Test-Dateien, nie blind die gesamte Suite
- Feature gelöscht oder umgebaut → zugehörige Test-Datei ebenfalls löschen/anpassen
- `playwright-report/` nach jedem QA-Lauf löschen (`rm -rf playwright-report/`)
