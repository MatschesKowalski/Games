# Tasks — Backlog (parkiert)

<!--
  Diese Aufgaben sind PARKIERT und werden NICHT automatisch vom Workflow aufgegriffen.
  Erst in tasks.md eintragen, wenn sie dran sind.
-->

---

## Terrain & Karten-Optik

---

### Task B1: Terrain-System — Datenstruktur & Insel-Generator
- **beschreibung:** |
    Die Karte ist derzeit ein einheitliches grünes Rechteck. Dieses Task fügt
    ein echtes Terrain-System ein: jede Kachel bekommt einen Typ, und ein
    prozeduraler Generator erzeugt eine Insel mit natürlich wirkender Landschaft.

    1. `src/sim/terrain.ts`: `TerrainType`-Enum exportieren:
       `ocean | coast | sand | grass | forest | mountain`
       Und Hilfsfunktionen: `isPassable(t: TerrainType): boolean` (ocean/mountain
       blockieren Gebäudebau), `isWater(t: TerrainType): boolean`

    2. `src/sim/map-gen.ts`: Funktion `generateIslandTerrain(cols: number,
       rows: number, seed: number): TerrainType[][]`
       Algorithmus (kein externes Noise-Paket — nur rng.ts aus `src/sim/rng.ts`):
       a. Distanzmaske: Jedes Feld bekommt einen Wert 0–1 basierend auf
          Abstand vom Mittelpunkt. Felder > 0.85 = ocean.
       b. Irregularität: geseedetes Rauschen addieren, damit Küste wellig wird.
       c. Terrain nach Distanz-Wert:
          - 0.00–0.25: mountain
          - 0.25–0.40: forest
          - 0.40–0.65: grass
          - 0.65–0.75: sand
          - 0.75–0.85: coast
          - > 0.85: ocean
       d. 3–5 zufällige Berggruppen + 4–7 Waldflecken per Seed platzieren.

    3. `GameState` erweitern um `terrain: TerrainType[][]`;
       `createInitialState()` ruft Generator auf.
       MAP_COLS / MAP_ROWS als Konstanten definieren.

    4. Bau-Logik: Gebäude nur auf grass/sand/forest erlaubt.

    5. Speichern/Laden: terrain in Save-State aufnehmen.

- **akzeptanzkriterien:** |
    - [ ] GameState.terrain enthält 2D-Matrix mit unterschiedlichen Typen
    - [ ] Erkennbarer Insel-Umriss (ocean außen, land innen)
    - [ ] Gebäudebau auf ocean/mountain schlägt fehl
    - [ ] Speichern → Laden → terrain-Grid identisch
    - [ ] Vitest-Test: ≥ 4 verschiedene Typen und ≥ 20 % ocean
- **dateien:** |
    - NEU: `src/sim/terrain.ts`, `src/sim/map-gen.ts`, `src/sim/map-gen.test.ts`
    - ÄNDERN: `src/sim/state.ts`, `src/sim/commands.ts` oder `src/sim/tick.ts`

---

### Task B2: Terrain-Rendering — Anno 1602 Kacheln & Ozean-Hintergrund
- **beschreibung:** |
    Terrain-Grid sichtbar machen: jede Kachel erhält den passenden Anno 1602
    Sprite, Hintergrund wird Ozean-Blau, Karte sieht wie eine Insel aus.

    1. Sprite-Indizes per Sichtprüfung von dist/sprites/stadtfld/sprite_N.png
       für sand, coast, forest, mountain identifizieren.
       Bekannte Startwerte: grass=0, water=800.

    2. buildBaseMap() erhält terrain-Grid als Parameter. Pro Kachel:
       Terrain-Typ → Sprite-Index aus sprite-mapping.json → Anno-Sprite.

    3. Ozean-Hintergrund: Graphics hinter tile-layer in Ozean-Blau (0x1a6ea8).

    4. MapView.updateTerrain(terrain) als neue Methode.

    5. sprite-mapping.json: terrain-Sektion für alle 6 Typen erweitern.

- **akzeptanzkriterien:** |
    - [ ] Mindestens 4 optisch unterschiedliche Terrain-Sprites
    - [ ] Ocean-Felder erscheinen als Wasser
    - [ ] Hintergrund ist Ozean-Blau, nicht dunkel-navy
    - [ ] Kein einheitliches grünes Viereck mehr
- **dateien:** |
    - ÄNDERN: `src/render/map-view.ts`, `src/content/sprite-mapping.json`, `src/main.ts`

---

### Task B3: Terrain-Übergänge, Bäume & Berge
- **beschreibung:** |
    Visueller Feinschliff: Übergangs-Kacheln zwischen Terrain-Typen,
    Baum-Sprites auf Waldfeldern, Berg-Sprites auf Bergfeldern.

    1. 4-Bit-Nachbarmask pro Kachel → Übergangs-Sprite (analog Mauer-Varianten).
       Priorität: grass↔sand, sand↔coast/ocean.
       Sprite-Indizes per Sichtprüfung ermitteln (Bereich 1–50 für Gras-
       Varianten, Bereich 107–160 für Sand/Küste — per Inspektion bestätigen).

    2. Baum-Sprites auf 70 % der Wald-Kacheln (deterministisch via Seed).
       Baum-Sprite-Indizes per Sichtprüfung in Stadtfld.bsh finden
       (wahrscheinlich Bereich 1600–2000).

    3. Berg-Sprites auf Bergkacheln (wahrscheinlich 107–160, per Inspektion).

    4. Küsten-Animation (optional): Wasser-Frames als AnimatedSprite.

- **akzeptanzkriterien:** |
    - [ ] Übergänge grass↔sand sind weich
    - [ ] Waldfelder zeigen Baum-Sprites
    - [ ] Bergfelder zeigen Fels-Sprite
    - [ ] Karte wirkt abwechslungsreich
- **dateien:** |
    - ÄNDERN: `src/render/map-view.ts`, `src/content/sprite-mapping.json`

---

## Verteidigungs-Phase (Phase 2)

---

### Task B4: Angriffs-Ereignisse
- **beschreibung:** |
    Feindliche Angriffswellen als Kern-Spielereignis.

    1. `src/sim/events.ts`: GameEvent Union-Type:
       attack-warning, attack-start, attack-result
    2. GameState um pendingEvents + attackWave erweitern
    3. tick.ts: Timing-Logik für Warnung und Angriff
    4. Angriffs-Stärke skaliert mit attackWave
    5. Gegnergruppen aus units.ts mit side: "enemy"
    6. UI: HUD-Banner mit i18n-Texten

- **akzeptanzkriterien:** |
    - [ ] attack-warning nach konfigurierten Ticks im State
    - [ ] Warnung in UI sichtbar
    - [ ] attack-start folgt nach weiterem Ablauf
    - [ ] Stärke steigt mit attackWave
    - [ ] Determinismus erhalten
    - [ ] Vitest-Test
- **dateien:** |
    - NEU: `src/sim/events.ts`, `src/sim/events.test.ts`
    - ÄNDERN: `src/sim/state.ts`, `src/sim/tick.ts`, `src/ui/hud.ts`, `src/i18n/de.json`

---

### Task B5: Aufstellungs-Phase
- **beschreibung:** |
    Nach attack-warning: Deployment-Phase. Spieler positioniert Truppen,
    dann startet Kampf.

    1. GameState.phase: "build" | "deployment" | "combat" | "result"
    2. Bei attack-warning → deployment-Phase
    3. Einheiten verschieben (move-unit-Befehl)
    4. "Bereit!"-Button → deployment-ready → combat
    5. Optionales Zeitlimit

- **akzeptanzkriterien:** |
    - [ ] Phasenwechsel build → deployment → combat
    - [ ] Einheiten im Deployment-Modus verschiebbar
    - [ ] HUD zeigt aktuelle Phase
    - [ ] Determinismus
- **dateien:** |
    - ÄNDERN: `src/sim/state.ts`, `src/sim/commands.ts`, `src/sim/tick.ts`
    - ÄNDERN: `src/ui/hud.ts`, `src/main.ts`, `src/i18n/de.json`
    - NEU: `src/sim/phase.test.ts`

---

### Task B6: Autobattle-Kern
- **beschreibung:** |
    Deterministisches Kampfsystem, das pro Tick automatisch abläuft.

    1. combat.ts: resolveCombatTick(state) → state (pure function)
       - Feinde bewegen auf Spieler-Einheiten zu (Greedy oder A*)
       - Angriff in Reichweite (RNG via rng.ts)
       - Türme feuern automatisch
       - HP ≤ 0 → Einheit entfernen
       - Feinde erreichen Rathaus → Schaden
       - Alle Feinde tot → won: true; Rathaus HP 0 → won: false
    2. tick() in Combat-Phase ruft resolveCombatTick auf
    3. Nach Kampf → result → build

- **akzeptanzkriterien:** |
    - [ ] Feinde bewegen sich pro Tick
    - [ ] Sieg/Niederlage-Bedingungen funktionieren
    - [ ] Türme schießen
    - [ ] Determinismus (gleicher Seed → gleicher Verlauf)
    - [ ] Vitest-Test: 5 Feinde vs. 3 Soldaten
- **dateien:** |
    - NEU: `src/sim/combat.ts`, `src/sim/combat.test.ts`
    - ÄNDERN: `src/sim/tick.ts`, `src/sim/state.ts`

---

### Task B7: Kampf-Rendering & Audio
- **beschreibung:** |
    Kampf sichtbar und hörbar machen.

    1. Soldat-Sprites aus Soldat.bsh (8 Richtungen × Frames)
    2. Bewegungs-Animation: Interpolation zwischen Grid-Feldern
    3. Angriffs-Animation
    4. Tod-Effekt (Effekte.bsh oder Ausblenden)
    5. Kampf-Sounds: sdtattk, Schwert, Muskete, Kanone
    6. Ergebnis-Screen mit Triumph.wav bei Sieg

- **akzeptanzkriterien:** |
    - [ ] Einheiten als Sprites sichtbar
    - [ ] Bewegung animiert (kein Teleportieren)
    - [ ] Kampfgeräusche
    - [ ] Ergebnis-Screen nach Kampf
- **dateien:** |
    - ÄNDERN: `src/render/map-view.ts`, `src/render/sound-manager.ts`
    - NEU: `src/render/unit-sprites.ts`, `src/ui/combat-result.ts`
    - ÄNDERN: `src/main.ts`, `src/i18n/de.json`

---

### Task B8: Integrationstest Phase 2
- **beschreibung:** |
    Vollständiger Loop Phase 2 getestet und dokumentiert.

    1. Vitest-Integrationstest: Aufbau → Kaserne → Truppen → Mauern →
       Angriff → Deployment → Kampf → Sieg/Niederlage → Build → Save/Load
    2. Alle Phase-1-Tests weiterhin grün
    3. Manueller Testbericht in SESSION_NOTES.md
    4. Notiz für Phase 3 (Fog of War): benötigte State-Felder

- **akzeptanzkriterien:** |
    - [ ] Integrationstest deckt vollen Phase-2-Loop ab
    - [ ] Alle Vitest-Tests grün
    - [ ] npm run build fehlerfrei
    - [ ] SESSION_NOTES.md mit Abnahme-Bericht
- **dateien:** |
    - NEU: `src/sim/phase2-loop.test.ts`
    - ÄNDERN: `SESSION_NOTES.md`
