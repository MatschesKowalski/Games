## Task 5: Isometrische Karten-Darstellung (Tile-Rendering, Kamera)
**Status:** in_progress
**Start:** 2026-07-13

### Plan
1. src/render/iso.ts — gridToScreen/screenToGrid Transformationen
2. src/render/map-view.ts — 40×40 Kacheln mit PixiJS-Graphics
3. src/render/camera.ts — Pan (Drag) + Zoom (Mausrad), Grenzbeschränkung
4. src/render/iso.test.ts — Inverse Transformation testen
5. src/main.ts erweitern — Karte + Kamera einbinden, Hover-Highlight

### Entscheidungen
- Platzhalter-Kacheln als einfache PixiJS Graphics (Rauten)
- Kamera-Grenzen: Spieler kann nicht über Kartenrand hinausscrollen
