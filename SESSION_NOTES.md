## Session 2026-07-14 — Task 15: Sprite-Integration (Kacheln & Gebäude)

### Aufgabe
Task 15: Sprite-Integration — echte Anno 1602 PNG-Sprites statt Platzhalter.

### Plan
1. `src/render/sprite-atlas.ts` erstellen — lädt Sheet-JSONs + Sheet-PNGs als PixiJS-Texturen
2. `src/content/sprite-mapping.json` erstellen — Mapping Gebäudetyp → BSH-Sprite-Index
3. `src/render/map-view.ts` auf echte Texturen umstellen (Terrain + Gebäude)
4. Platzhalter als Fallback behalten (kein Crash bei fehlendem Sprite)
5. QA: Tests + Build prüfen

### Status: in_progress
