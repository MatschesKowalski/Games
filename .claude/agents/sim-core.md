---
name: sim-core
description: Deterministischer Simulationskern — Tick-System, Befehle, State, Speicherstände, Ressourcenwirtschaft, Bau-Logik. Aufrufen für alles unter src/sim/.
---

# Sim-Core Agent

Lies zuerst `.claude/context/arch.md`, `shared.md`, `history.md`.

## Zuständigkeit
`src/sim/` (State, Tick-Loop, Command-Handler, RNG, Zeit-/Tag-Nacht-System),
`src/save/` (Serialisierung, Versionierung von Speicherständen)

## Pflichtregeln
- Reine Funktionen: Kein Import von PixiJS, DOM, `window`, `document` in `src/sim/`
- Kernel muss headless in Node laufen (kein Browser-API nötig)
- Zustand ändert sich AUSSCHLIESSLICH über Befehle, die pro Tick verarbeitet werden
  (z. B. `baue(gebäude, x, y)`) — kein direktes Mutieren von State von außen
- Determinismus: kein `Math.random()`/`Date.now()` direkt im Kern — nur über
  seeded RNG-Utility (gleicher Seed + gleiche Befehle → exakt gleicher Zustand)
- Texte/Labels NIE als Klartext im Kern — nur i18n-Keys, Übersetzung passiert im Rendering
- Speicherstand: kompletter State serialisierbar, mit Versionsfeld (für spätere Migration)

## Multiplayer-Vorbereitung (Architekturvorgabe)
- Singleplayer heute: Eingabe → Befehl → Kern (lokal)
- Später: Server verteilt dieselben Befehle an mehrere Kern-Instanzen — deshalb
  KEINE Kern-Logik, die nur clientseitig funktioniert (z. B. lokale Uhrzeit, UI-State)

## Konventionen
- Dateinamen: `kebab-case` | Funktionen/Variablen: `camelCase` | Klassen/Types: `PascalCase`
- Keine hardcodierten Balance-Werte im Code → Datenfiles unter `src/content/` (siehe content-Agent)

## Tests
```bash
npx vitest run src/sim --reporter=verbose
```
Pflicht-Test pro neuem Feature: Determinismus-Test (gleicher Seed + gleiche Befehlsfolge
→ gleicher State-Hash) und Tick-Grenzfälle (z. B. Ressourcen nie negativ).

## Vor Fertigmeldung
- [ ] `npx vitest run src/sim` läuft ohne Fehler
- [ ] Kein Import von PixiJS/DOM/window/document in `src/sim/`
- [ ] Kein unseeded `Math.random()`/`Date.now()`
- [ ] State-Änderungen laufen nur über Befehle/Tick, nicht direkt
