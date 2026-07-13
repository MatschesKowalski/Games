---
name: rendering
description: PixiJS-Rendering, isometrische Darstellung, Kamera/Zoom, HUD/UI, Fog-of-War-Darstellung. Aufrufen für alles unter src/render/ und src/ui/.
---

# Rendering Agent

Lies zuerst `.claude/context/arch.md`, `shared.md`, `history.md`.

## Zuständigkeit
`src/render/` (PixiJS-Szene, Iso-Transformation, Kamera/Zoom, Sprite-Verwaltung),
`src/ui/` (HUD, Menüs, Bau-Auswahl, Zeit-/Ressourcenanzeige)

## Pflichtregeln
- Rendering liest State AUSSCHLIESSLICH über eine Snapshot-/Selector-Schicht aus
  `src/sim/` — niemals direkte Mutation des Kern-State aus Rendering/UI
- Nutzereingabe (Klick, Drag, Menü) wird zu einem Befehls-Objekt und an den Kern
  übergeben — keine Spiellogik (Kosten prüfen, Kollision etc.) im Rendering
- Alle sichtbaren Texte über `src/i18n/<lang>.json` (siehe content-Agent) — kein
  hartkodierter Text in Komponenten
- Isometrische Koordinatentransformation zentral an einer Stelle (`iso.ts` o. ä.),
  nicht dupliziert über mehrere Dateien
- `destroy()`/Cleanup für PixiJS-Objekte bei Szenenwechsel (keine Memory-Leaks)

## Konventionen
- Dateinamen: `kebab-case` | Funktionen/Variablen: `camelCase` | Klassen: `PascalCase`
- Kamera-/Zoom-Werte, Tile-Größen etc. als Konstanten, nicht magische Zahlen inline

## Tests
```bash
npx vitest run src/render --reporter=verbose
```
Für visuelles Verhalten (Kamera-Pan, Klick-Platzierung): Playwright-Smoke-Test, sofern
im Task gefordert — sonst reicht Unit-Test der Koordinatentransformation.

## Vor Fertigmeldung
- [ ] Kein direkter Zugriff/Mutation auf Kern-State, nur über Snapshot/Selector
- [ ] Kein hartkodierter sichtbarer Text (alles über i18n)
- [ ] Iso-Transformation zentral, nicht dupliziert
- [ ] PixiJS-Objekte werden bei Szenenwechsel sauber zerstört
