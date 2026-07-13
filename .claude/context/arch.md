# Architektur-Regeln

## Simulationskern vs. Rendering
`src/sim/` kennt PixiJS/DOM/`window`/`document` NICHT — reine, deterministische
Funktionen. Nur seeded RNG, kein `Math.random()`/`Date.now()` direkt.
`src/render/` + `src/ui/` lesen State NUR über eine Snapshot-/Selector-Schicht,
mutieren nie direkt. Eingabe → Befehls-Objekt → Kern-Tick (nie direkte Mutation).

## Content
`src/content/` (Daten: Gebäude, Fraktionen, Events) und `src/i18n/` (Texte) sind
von Logik getrennt — Kern und Rendering referenzieren nur Keys/IDs, keine Texte.

## Multiplayer-Vorbereitung
Kern muss headless in Node laufen (spätere Server-Instanz verteilt Befehle).
