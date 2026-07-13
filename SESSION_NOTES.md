## Task 7: Bau-System (Gebäude platzieren, Kosten, Gebäude-Katalog)
**Status:** in_progress
**Start:** 2026-07-13

### Plan
1. src/content/buildings.ts — Gebäude-Katalog (Rathaus, Holzfäller, Steinbruch, Bauernhof)
2. src/sim/commands.ts erweitern — build-Befehl hinzufügen
3. applyCommand: Kollision, Ressourcen prüfen, Kosten abziehen
4. src/sim/production.ts: echte Gebäude statt Platzhalter
5. src/render/map-view.ts: Gebäude auf Karte darstellen
6. src/sim/build.test.ts — Kollision, Kosten, Determinismus
7. src/i18n/de.json: building-Keys prüfen (bereits vorhanden)

### Entscheidungen
- Gebäude-Katalog als TypeScript-Datei (nicht JSON) für bessere Typsicherheit
- Rendering: einfache farbige Rechtecke über den Kacheln (Task 9 baut darauf auf)
