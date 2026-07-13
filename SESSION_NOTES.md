## Task 9: Platzhalter-Asset-Pipeline
**Status:** in_progress
**Start:** 2026-07-13

### Plan
1. src/render/placeholder-sprites.ts — programmatische Platzhalter mit PixiJS Graphics
2. src/render/map-view.ts anpassen — Gebäude via placeholder-sprites statt direkter Farben

### Entscheidungen
- placeholder-sprites.ts ist die EINZIGE Stelle, die Gebäude-Farben/Formen definiert
- Austausch gegen echte Assets: nur placeholder-sprites.ts ändern, map-view.ts bleibt gleich
- Darstellung: Raute in Gebäude-Farbe + Initiale des Gebäudenamens als Text-Overlay
