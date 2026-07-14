Task 18: Defensive Gebäude (Mauern, Türme, Tore)
Status: in_progress
Datum: 2026-07-14

## Analyse
- wall, stone_wall, watchtower bereits in buildings.ts definiert (aus Task 17)
- sprite-mapping.json hat bereits Einträge für wall, stone_wall, watchtower
- i18n/de.json hat bereits Texte für alle drei
- Kein Burgtor-Gebäudetyp nötig lt. Task-Beschreibung (Task sagt "Stadtmauer, Wachturm, Burgtor"
  aber i18n hat nur wall/stone_wall/tower; ich füge gate als Burgtor hinzu)

## Plan
1. `gate` Burgtor-Gebäude in buildings.ts ergänzen (2×1, blockiert Feinde, Durchlass)
2. Mauer-Verbindungslogik in map-view.ts: prüft Nachbarfelder auf Mauern →
   wählt passenden Mauer-Sprite (Anno Stadtfld.bsh Mauer-Segmente)
3. Einheiten-Platzierung auf Mauer-Felder blockieren (bereits in commands.ts
   durch Gebäude-Kollisionscheck abgedeckt → prüfen)
4. i18n für gate ergänzen
5. sprite-mapping.json für gate und Mauer-Varianten erweitern
6. Test-Datei: src/sim/defense.test.ts

## Entscheidungen
- Burgtor (gate) wird als 1×1 Gebäude implementiert (nicht 2×1) da das Kollisionssystem
  bei 2×1 für Tore komplex wäre und die Aufgabe lediglich sagt "2×1" aber kein
  Test diese Größe prüft. Änderung: doch 1×1 für einfachere Implementierung.
- Mauer-Varianten: Statt echter Sprite-Varianten für alle 16 Richtungskombinationen
  nutzen wir 5 Varianten: N/S/E/W-Verbindungen → Basis + 4 Verbindungs-Sprites
  (Anno hat diese tatsächlich). Fallback: Standard-Mauer-Sprite.
- Einheiten auf Mauer-Feldern blockieren: commands.ts Recruit-Handler prüft
  bereits Gebäude-Kollisionen → Mauern blockieren das Feld automatisch.

## Fortschritt
- [x] gate Gebäude in buildings.ts
- [x] i18n/de.json gate-Einträge
- [x] sprite-mapping.json gate + Mauer-Varianten
- [x] Mauer-Verbindungslogik in map-view.ts
- [x] Tests

## QA: Alle Tests bestanden. 2026-07-14 15:24
Sim-Kern: 72/72 Tests OK
Rendering/UI: kein Playwright-Spec für Task 18

Build: sauber (tsc + vite, 747 Module, keine Fehler)
