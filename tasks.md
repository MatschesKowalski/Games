# Tasks — Aufbau/Defense-Endlosspiel

## Anleitung
<!--
  Status-Werte: todo | in_progress | done
  Priorität: Niedrigere Nummer = höhere Priorität
  Aufgaben werden sequentiell abgearbeitet (eine nach der anderen)

  Testing: Sim-Kern/Content mit Vitest, Rendering/UI wo sinnvoll mit Playwright
  Konventionen: TypeScript kebab-case Dateien, camelCase Funktionen/Variablen,
  PascalCase Klassen/Types, Conventional Commits, keine Strings im Code außerhalb i18n

  WICHTIG: Jede Aufgabe ist eigenständig beschrieben.
  Der Agent braucht KEINEN Kontext vorheriger Tasks (außer dem, was vorherige
  Tasks tatsächlich im Code angelegt haben).

  Quelle: spielkonzept.md (Repo-Root)
  Anno 1602 Assets liegen lokal unter `Anno 1602/` (nicht im Repo, lokal verfügbar).
-->

## Aufgaben

---

### Task 1–12: MVP-Phase (abgeschlossen)
- **prio:** 1–12
- **status:** done
- **beschreibung:** |
    Vollständiger MVP-Loop: Projekt-Setup, i18n, Simulationskern, Speichersystem,
    isometrische Karte, Ressourcenwirtschaft, Bausystem, Tag/Nacht-Zyklus,
    Platzhalter-Assets, HUD/UI, Save/Load-UI, Integrationstest.
    Details in Git-History (Commits ee64de5 bis 6c60310).

---

## Welle 2: Anno 1602 Asset-Integration

---

### Task 13: BSH+SCP-Parser — Sprite-Extraktion
- **prio:** 13
- **status:** done
- **beschreibung:** |
    Anno 1602 speichert alle Spiel-Grafiken in `.bsh`-Dateien (proprietäres
    Sprite-Format) mit zugehörigen `.scp`-Paletten-Dateien (Farbtabellen).
    Dieses Task schreibt ein Node.js-Script in TypeScript, das beide kombiniert
    und PNG-Sprite-Sheets ausgibt.

    Ziel-Dateien (liegen unter `Anno 1602/` bzw. `Anno 1602/GFX/`):
    - `Stadtfld.bsh` — alle isometrischen Terrain- und Gebäude-Kacheln
    - `Soldat.bsh` — Soldaten-Animationen (alle Richtungen)
    - `Traeger.bsh` — Träger/Arbeiter-Sprites
    - `Ship.bsh` — Schiffs-Sprites
    - `Tiere.bsh` — Tier-Sprites (Schafe, Kühe)
    - `Effekte.bsh` — Effekte (Rauch, Feuer)
    - `Schatten.bsh` — Schatten

    Paletten (Farbzuordnung je Zoom-Stufe):
    - `big.scp` / `big00.scp`…`big66.scp` — Großansicht
    - `med.scp` / `med00.scp`… — mittlere Ansicht
    - `mit.scp`, `lit.scp`, `lar.scp` — weitere Stufen

    BSH-Format (community-dokumentiert, reverse-engineered):
    - Header: 4 Bytes Anzahl Sprites, dann Offset-Tabelle (je 4 Bytes)
    - Pro Sprite: Breite (2 Bytes), Höhe (2 Bytes), X-Offset (2 Bytes),
      Y-Offset (2 Bytes), dann Pixel-Daten als Palette-Indizes (1 Byte = 1 Pixel,
      0 = transparent)
    - SCP: 256 × RGB-Tripel (768 Bytes = eine Farbpalette)

    Aufgaben:
    1. `scripts/extract-bsh.ts`: liest BSH-Datei + SCP-Palette, gibt für jeden
       Sprite ein PNG-Buffer aus (Node `sharp` oder `pngjs` für PNG-Erzeugung)
    2. `scripts/run-extract.ts`: Batch-Script, das alle relevanten BSH-Dateien
       durchläuft und PNGs nach `assets/sprites/<dateiname>/sprite_<idx>.png`
       schreibt
    3. Zusätzlich: ein kombiniertes Sprite-Sheet pro BSH-Datei
       (`assets/sprites/<dateiname>/sheet.png`) mit zugehöriger JSON-Metadaten-
       Datei (`sheet.json`: Array von `{x, y, w, h}` pro Sprite)
    4. Script läuft mit `npx ts-node scripts/run-extract.ts` oder
       `node --loader ts-node/esm scripts/run-extract.ts`

    Alle Pfade relativ zu Repo-Root konfigurierbar (keine hardcodierten absoluten
    Pfade außer Basis-Pfad per Env-Variable `ANNO_PATH`, Default: `./Anno 1602`).
- **akzeptanzkriterien:** |
    - [ ] `npx ts-node scripts/run-extract.ts` läuft ohne Crash durch
    - [ ] Für Stadtfld.bsh entstehen sichtbar korrekte isometrische Kachel-PNGs
          (visuell prüfen: Rauten-Form erkennbar, keine Farb-Artefakte)
    - [ ] sheet.json enthält korrekte x/y/w/h-Koordinaten (Roundtrip: Sprite
          aus Sheet ausschneiden = Original-Sprite)
    - [ ] Transparenz (Index 0) wird korrekt als Alpha=0 übernommen
    - [ ] Kein Import aus `pixi.js` in den Scripts (Node-only)
- **kontext:** |
    Das BSH-Format ist von der Anno 1602 Community vollständig reverse-engineered
    und gut dokumentiert (z.B. im "anno-toolkit" GitHub-Projekt und
    anno1602.de-Modding-Wiki). Der bearbeitende Agent soll NICHT das Internet
    aufrufen — das Format reicht, wie es hier beschrieben ist.
    pngjs ist bevorzugt (pure JS, keine native Abhängigkeiten).
- **dateien:** |
    - NEU: `scripts/extract-bsh.ts`, `scripts/run-extract.ts`
    - NEU: `assets/sprites/` (Ordner, wird vom Script befüllt)
    - ÄNDERN: `package.json` (pngjs als dev-dependency)

---

### Task 14: COD-Parser — Gebäude- & Einheitendaten extrahieren
- **prio:** 14
- **status:** done
- **beschreibung:** |
    Anno 1602 speichert alle Spielbalance-Daten in `.cod`-Dateien. Die wichtigsten
    für unser Spiel sind `haeuser.cod` (Gebäude: Kosten, Produktion, Bevölkerungsbedarf)
    und `figuren.cod` (Einheiten: HP, Schaden, Geschwindigkeit).

    Das COD-Format (community-dokumentiert):
    - Datei beginnt mit einem 2-Byte-Header (0x01 0x30 = komprimiert mit
      eigenem RLE-Schema, oder unkomprimiert)
    - Bei komprimierten Dateien: dekomprimieren, dann strukturierte Records lesen
    - Records sind sequentielle Daten-Blöcke mit fixer Größe je Typ
    - haeuser.cod: je Gebäude ca. 60–80 Bytes (ID, Baukosten Holz/Stein/Gold,
      Produktionsrate, benötigte Bevölkerung, Größe)
    - figuren.cod: je Einheit ca. 20–30 Bytes (ID, HP, Schaden, Geschwindigkeit,
      Typ: Soldat/Schütze/Schiff)

    Da das exakte Byte-Layout komplex ist, pragmatischer Ansatz:
    1. Datei als Hex lesen, bekannte Konstantwerte (z.B. Holzkosten von Anno 1602
       Holzfällerhütte = 2 Holz, 0 Stein) als Anker nutzen um Offset zu finden
    2. Dann strukturiert die nächsten Gebäude lesen
    3. Ergebnis als lesbares JSON abspeichern (`assets/data/buildings-raw.json`,
       `assets/data/units-raw.json`)
    4. Separates Mapping-Script `scripts/map-to-game.ts` übersetzt die Anno-IDs
       und -Werte auf unser Spielsystem (unsere Ressourcen-IDs, unsere Gebäude-IDs)

    Falls COD-Parsing zu aufwendig (Format undokumentiert): Fallback — die
    bekannten Anno 1602 Balance-Werte aus der Community-Dokumentation manuell
    als JSON erfassen (in SESSION_NOTES.md begründen).
- **akzeptanzkriterien:** |
    - [ ] `assets/data/buildings-raw.json` enthält mind. 8 Gebäudetypen mit
          je Baukosten und Produktionsdaten (Werte plausibel prüfen gegen bekannte
          Anno 1602 Werte)
    - [ ] `assets/data/units-raw.json` enthält mind. 3 Einheitentypen mit HP/Schaden
    - [ ] `scripts/map-to-game.ts` gibt ein für unser Spiel passendes JSON aus
    - [ ] Werte werden in `src/content/buildings.ts` und einem neuen
          `src/content/units.ts` übernommen (alte Platzhalter-Werte ersetzt)
    - [ ] Alle bestehenden Vitest-Tests weiterhin grün
- **kontext:** |
    Baut nicht direkt auf vorherige Tasks auf (eigenständiges Script), aber die
    Ergebnis-Werte ersetzen die bisherigen Platzhalter in `src/content/buildings.ts`
    (Task 7). Einheitendaten werden in Task 17 (Einheiten-System) weiter genutzt.
- **dateien:** |
    - NEU: `scripts/parse-cod.ts`, `scripts/map-to-game.ts`
    - NEU: `assets/data/buildings-raw.json`, `assets/data/units-raw.json`
    - ÄNDERN: `src/content/buildings.ts`, `src/i18n/de.json`
    - NEU: `src/content/units.ts`

---

### Task 15: Sprite-Integration (Kacheln & Gebäude)
- **prio:** 15
- **status:** done
- **beschreibung:** |
    Die in Task 13 extrahierten PNG-Sprite-Sheets in das laufende Spiel einbinden —
    echte Grafiken ersetzen die programmatischen Platzhalter aus Task 9.

    1. `src/render/sprite-atlas.ts`: lädt die Sheet-JSONs und Sheet-PNGs aus
       `assets/sprites/` als PixiJS-Textures; bietet `getSprite(sheetName,
       spriteIndex): Texture` an
    2. Stadtfld.bsh-Kacheln als Map-Tiles:
       - Die isometrischen Terrain-Kacheln (Gras, Wasser, Weg, Sand) aus
         Stadtfld.bsh identifizieren (bekannte Indizes aus Anno-Dokumentation)
         und als Tile-Texturen einsetzen
       - `src/render/map-view.ts` auf echte Texturen umstellen statt
         programmatischer Grafik
    3. Gebäude-Sprites: je Gebäudetyp aus dem Katalog (buildings.ts) den
       passenden BSH-Sprite-Index hinterlegen (Mapping in einer JSON-Datei
       `src/content/sprite-mapping.json`)
    4. Platzhalter-Sprites aus `placeholder-sprites.ts` werden nur noch als
       Fallback verwendet (kein Aufruf wenn echter Sprite vorhanden)
- **akzeptanzkriterien:** |
    - [ ] Karte zeigt echte Anno 1602 Terrain-Kacheln statt einfarbige Rauten
    - [ ] Mindestens 3 Gebäudetypen zeigen ihre echten Sprites auf der Karte
    - [ ] Fehlender Sprite → Platzhalter als Fallback (kein Crash)
    - [ ] `npm run build` erzeugt fehlerfrei ein Bundle
    - [ ] Alle bestehenden Tests weiterhin grün
- **kontext:** |
    Setzt Task 13 (extrahierte Assets) und Task 9 (Platzhalter-System) voraus.
    sprite-atlas.ts ist DIE zentrale Stelle für Sprite-Zugriff — nicht in
    anderen Render-Dateien direkt aus dem assets/-Ordner laden.
- **dateien:** |
    - NEU: `src/render/sprite-atlas.ts`, `src/content/sprite-mapping.json`
    - ÄNDERN: `src/render/map-view.ts`, `src/render/placeholder-sprites.ts`
    - ÄNDERN: `package.json` (vite asset-handling für assets/-Ordner prüfen)

---

### Task 16: Audio-Integration
- **prio:** 16
- **status:** done
- **beschreibung:** |
    Die WAV-Dateien aus Anno 1602 als Spielsounds einbinden. Anno 1602 hat
    Sounds für jedes Gebäude, Kampfgeräusche und Umgebungssounds.

    Relevante WAV-Dateien (unter `Anno 1602/`):
    - Umgebung: `Wellen.wav`, `Vogel1-6.wav`, `Baum.wav`
    - Gebäude: `Backer.wav`, `Schmied.wav`, `Kirche.wav`, `Markt.wav`,
      `Muhle.wav`, `Schule.wav`, `Theater.wav`, `Wirtshs.wav` u.v.m.
    - Kampf: `Schwert1-5.wav`, `Muskete1-3.wav`, `Kanone5-8.wav`,
      `sdtattk1-6.wav` (Soldat-Angriff), `shpattk1-4.wav` (Schiff-Angriff)
    - UI: `Select.wav`, `Scroll.wav`
    - Siegjingle: `Triumph.wav`

    1. `src/render/sound-manager.ts`: Web-Audio-API basierter Sound-Manager.
       `playSound(id: string): void`, `playAmbient(id: string): void` (looped),
       `stopAmbient(): void`, Lautstärke-Steuerung, kein Abspielen doppelter
       Ambient-Tracks
    2. Sound-Mapping: `src/content/sound-mapping.json` — ordnet Spielereignisse
       (`building.built`, `building.bakery.ambient`, `combat.sword`, usw.) den
       WAV-Dateinamen zu
    3. WAV-Dateien werden aus `Anno 1602/` zur Build-Zeit nach `public/sounds/`
       kopiert (Vite-Config oder kurzes Copy-Script)
    4. Integration: Gebäude-Bau → Bau-Sound; Tagzyklus → Ambient-Sound (Vögel
       tagsüber, Wellen nachts); UI-Klicks → Select.wav
- **akzeptanzkriterien:** |
    - [ ] Beim Platzieren eines Gebäudes ist ein Sound hörbar
    - [ ] Umgebungssound wechselt bei Tag/Nacht-Übergang
    - [ ] UI-Klicks haben Klick-Sound
    - [ ] Kein Sound-Crash wenn Datei fehlt (graceful fallback, Konsolen-Warnung)
    - [ ] `npm run build` erzeugt fehlerfrei ein Bundle
- **kontext:** |
    Baut auf Task 7 (Bausystem) und Task 8 (Tag/Nacht) auf. sound-manager.ts
    gehört zu `src/render/` (Browser-API, nicht im Kern). Kern bleibt headless.
- **dateien:** |
    - NEU: `src/render/sound-manager.ts`, `src/content/sound-mapping.json`
    - NEU: `scripts/copy-sounds.ts` (oder vite.config.ts anpassen)
    - ÄNDERN: `src/main.ts`, `src/render/map-view.ts`, `src/i18n/de.json`

---

### Task 17–18: Einheiten-System & Defensive Gebäude (abgeschlossen)
- **prio:** 17–18
- **status:** done
- **beschreibung:** |
    Task 17: Einheiten (Rekrutierung, Kaserne, 4 Typen: Schwertkämpfer,
    Kavallerie, Musketier, Kanonier). Task 18: Mauern, Wachturm, Burgtor
    mit visueller Verbindungslogik (16 Mauer-Varianten).
    Details in Git-History (Commits a8909b0, 53edfee).

---

## Aktuelle Bugfixes — Visuelle Qualität

<!--
  Weitere Tasks (Terrain, Angriffswellen, Kampf etc.) sind parkiert in tasks-backlog.md.
  Erst dort rausholen wenn diese Fixes abgeschlossen sind.
-->

---

### Task 19: Sprite-Mapping korrigieren — richtige Anno 1602 Gebäude-Sprites
- **prio:** 19
- **status:** in_progress
- **beschreibung:** |
    Die aktuellen Gebäude-Sprites passen nicht zu den Gebäude-Typen:
    z. B. zeigt "Holzmauer" das Fischerei-Häuschen. Die Sprite-Indizes in
    sprite-mapping.json wurden geschätzt und sind falsch.

    1. Systematische Sichtprüfung der extrahierten Sprites:
       Der Agent öffnet dist/sprites/stadtfld/sprite_N.png für relevante
       Bereiche (z. B. 1100–1500 in 10er-Schritten) und identifiziert, welcher
       Index zu welchem Gebäude gehört. Anno 1602 hat erkennbare Gebäude:
       Rathaus (großes repräsentatives Gebäude), Sägewerk (mit Sägeblatt/Holz),
       Steinbruch (Fels/Steine), Gehöft/Farm (Scheune), Jägerhütte (kleines
       Waldhaus), Bäckerei (Ofen sichtbar), Kaserne (Militärgebäude), Wachturm
       (Turm mit Aussichtsplattform), Mauern/Tore (Steinmauer-Segmente).

    2. Für jedes Gebäude den visuell passenden Sprite-Index notieren und
       src/content/sprite-mapping.json aktualisieren.

    3. Besonders wichtig: Mauer-Varianten (wallVariants in sprite-mapping.json)
       — die 16 Verbindungs-Varianten (4-Bit-Mask) müssen ebenfalls alle
       auf die richtigen Mauer-Segment-Sprites zeigen.

    4. Kurzen Test-Screenshot-Kommentar in SESSION_NOTES.md: welcher Index
       für welches Gebäude gefunden wurde.

- **akzeptanzkriterien:** |
    - [ ] Jedes Gebäude zeigt seinen optisch passenden Anno 1602 Sprite
    - [ ] Keine offensichtlichen Verwechslungen mehr (kein Fischerei-Sprite
          für Mauer usw.)
    - [ ] Mauer-Segmente verbinden sich visuell korrekt (alle 16 Varianten geprüft)
    - [ ] npm run build fehlerfrei
    - [ ] Alle bestehenden Tests weiterhin grün
- **kontext:** |
    Die Sprites liegen fertig extrahiert unter dist/sprites/stadtfld/sprite_N.png.
    Der Agent muss nicht neu extrahieren — nur sichten und die JSON-Datei
    aktualisieren. Rendering-Agent-Aufgabe.
- **dateien:** |
    - ÄNDERN: src/content/sprite-mapping.json
    - ÄNDERN: SESSION_NOTES.md (Fundstellen dokumentieren)

---

### Task 20: Pixel-Schärfe und Zoom-Tiefe reparieren
- **prio:** 20
- **status:** todo
- **beschreibung:** |
    Zwei Rendering-Probleme in einem Task:

    A) UNSCHÄRFE: PixiJS verwendet standardmäßig "lineare" Textur-Filterung,
       die beim Hochskalieren von Pixel-Art weichzeichnet. Anno 1602 Sprites
       sind Pixel-Art und müssen pixel-genau scharf bleiben.
       Fix in src/render/sprite-atlas.ts: Nach dem Laden jedes Sheet-Textur
       die Quelle auf Nearest-Neighbor-Filterung umstellen:
         texture.source.scaleMode = 'nearest'
       Das muss direkt nach Assets.load() gesetzt werden, bevor Subtexturen
       daraus ausgeschnitten werden (da alle Subtexturen dieselbe Quelle teilen).

    B) ZOOM-LIMIT: Der maximale Zoom-Faktor liegt bei 3.0 (src/render/camera.ts,
       Konstante MAX_ZOOM). Das ist zu wenig — der Spieler kann nicht nah genug
       heranzoomen.
       Fix: MAX_ZOOM auf 8.0 erhöhen.
       Zusätzlich: ZOOM_FACTOR_IN von 1.1 auf 1.15 erhöhen, damit ein Scroll-
       Schritt subjektiv mehr Wirkung hat.

- **akzeptanzkriterien:** |
    - [ ] Gebäude-Sprites sind scharf und pixelig (keine Weichzeichnung)
    - [ ] Gras-Kacheln sind scharf (Kachelmuster klar erkennbar)
    - [ ] Zoom reicht bis mindestens Faktor 8 heran
    - [ ] Kein visueller Bruch beim Zoomen (Sprites bleiben scharf auf allen Zoom-Stufen)
    - [ ] npm run build fehlerfrei
    - [ ] Alle bestehenden Tests weiterhin grün
- **kontext:** |
    sprite-atlas.ts lädt Texturen via PixiJS Assets.load(). Die scaleMode-
    Eigenschaft muss auf der texture.source (nicht auf der Texture selbst) gesetzt
    werden, da alle ausgeschnittenen Frame-Texturen dieselbe GPU-Textur-Quelle teilen.
    camera.ts enthält MIN_ZOOM, MAX_ZOOM, ZOOM_FACTOR_IN, ZOOM_FACTOR_OUT als
    Konstanten ganz oben in der Datei.
- **dateien:** |
    - ÄNDERN: src/render/sprite-atlas.ts (scaleMode = 'nearest' nach Assets.load)
    - ÄNDERN: src/render/camera.ts (MAX_ZOOM = 8.0, ZOOM_FACTOR_IN = 1.15)

---

### Task 21: Terrain-System — Datenstruktur & Insel-Generator
- **prio:** 21
- **status:** todo
- **beschreibung:** |
    Die Karte ist derzeit ein einheitliches grünes Rechteck. Dieses Task fügt
    ein echtes Terrain-System ein: jede Kachel bekommt einen Typ, und ein
    prozeduraler Generator erzeugt eine Insel mit natürlich wirkender Landschaft.

    1. `src/sim/terrain.ts`: `TerrainType`-Enum exportieren:
       `ocean | coast | sand | grass | forest | mountain`
       Hilfsfunktionen: `isPassable(t: TerrainType): boolean` (ocean/mountain
       blockieren Gebäudebau), `isWater(t: TerrainType): boolean`

    2. `src/sim/map-gen.ts`: Funktion `generateIslandTerrain(cols: number,
       rows: number, seed: number): TerrainType[][]`
       Algorithmus (kein externes Noise-Paket — nur rng.ts):
       a. Distanzmaske: Wert 0–1 je nach Abstand vom Mittelpunkt. > 0.85 = ocean.
       b. Geseedetes Rauschen addieren damit Küste wellig wird.
       c. Terrain nach Distanz-Wert:
          - 0.00–0.25: mountain
          - 0.25–0.40: forest
          - 0.40–0.65: grass
          - 0.65–0.75: sand
          - 0.75–0.85: coast
          - > 0.85: ocean
       d. 3–5 Berggruppen + 4–7 Waldflecken zufällig per Seed platzieren.

    3. `GameState` um `terrain: TerrainType[][]` erweitern;
       `createInitialState()` ruft Generator auf.
       MAP_COLS / MAP_ROWS als Konstanten definieren (nicht hartkodiert).

    4. Bau-Logik: Gebäude nur auf grass/sand/forest erlaubt
       (ocean/coast/mountain ablehnen).

    5. Speichern/Laden: terrain ins Save-State aufnehmen.

- **akzeptanzkriterien:** |
    - [ ] GameState.terrain enthält 2D-Matrix mit unterschiedlichen Typen
    - [ ] Erkennbarer Insel-Umriss (ocean außen, land innen)
    - [ ] Gebäudebau auf ocean/mountain schlägt fehl (Befehl abgelehnt)
    - [ ] Speichern → Laden → terrain-Grid identisch
    - [ ] Vitest-Test: generateIslandTerrain produziert ≥ 4 Terrain-Typen
          und ≥ 20 % ocean-Felder
    - [ ] Alle bestehenden Tests weiterhin grün
- **kontext:** |
    Reine Sim-Kern-Erweiterung. Das Rendering folgt in Task 22.
    rng.ts (bereits vorhanden) für deterministischen Seed nutzen.
    Kein Rendering-Code in diesem Task.
- **dateien:** |
    - NEU: `src/sim/terrain.ts`, `src/sim/map-gen.ts`, `src/sim/map-gen.test.ts`
    - ÄNDERN: `src/sim/state.ts` (terrain-Feld, MAP_COLS/MAP_ROWS-Konstanten)
    - ÄNDERN: `src/sim/commands.ts` oder `src/sim/tick.ts` (Bau-Validierung)

---

### Task 22: Terrain-Rendering — Anno 1602 Kacheln & Ozean-Hintergrund
- **prio:** 22
- **status:** todo
- **beschreibung:** |
    Das in Task 21 aufgebaute Terrain-Grid sichtbar machen: jede Kachel erhält
    den passenden Anno 1602 Sprite, der Hintergrund wird zum Ozean, die Karte
    sieht aus wie eine Insel.

    1. Sprite-Indizes identifizieren: Auswahl von dist/sprites/stadtfld/sprite_N.png
       öffnen (z. B. 100–120, 200–220, 800–820) um die richtigen Kachel-Indizes
       für sand, coast, forest, mountain zu finden.
       Bekannte Startwerte: grass=0, water/ocean=800.

    2. `src/render/map-view.ts`: `buildBaseMap()` erhält terrain-Grid als
       Parameter. Pro Kachel: Terrain-Typ → Sprite-Index → Anno-Sprite.
       Fallback auf farbige Raute wenn Sprite nicht geladen.

    3. Ozean-Hintergrund: PixiJS-Graphics hinter dem tile-layer, füllt den
       Canvas in Ozean-Blau (0x1a6ea8). Ocean-Kacheln bekommen Wasser-Sprite.

    4. Neue Methode `MapView.updateTerrain(terrain: TerrainType[]): void` —
       einmalig nach State-Init und nach Save/Load aufgerufen.

    5. `src/content/sprite-mapping.json`: terrain-Sektion um alle 6 Typen
       erweitern.

- **akzeptanzkriterien:** |
    - [ ] Karte zeigt mindestens 4 optisch unterschiedliche Terrain-Sprites
    - [ ] Ocean-Felder erscheinen als Wasser (blau / Wasser-Sprite)
    - [ ] Hintergrund ist Ozean-Blau, nicht dunkel-navy
    - [ ] Kein einheitliches grünes Viereck mehr sichtbar
    - [ ] Gebäude stehen weiterhin korrekt über den Terrain-Kacheln
    - [ ] `npm run build` fehlerfrei
    - [ ] Alle bestehenden Tests weiterhin grün
- **kontext:** |
    Baut auf Task 21 (terrain im State) und Task 15 (sprite-atlas.ts) auf.
    Ausschließlich Rendering — kein Sim-Kern-Code.
    Übergangs-Kacheln folgen in Task 23.
- **dateien:** |
    - ÄNDERN: `src/render/map-view.ts`
    - ÄNDERN: `src/content/sprite-mapping.json`
    - ÄNDERN: `src/main.ts` (updateTerrain-Aufruf)

---

### Task 23: Terrain-Übergänge, Bäume & Berge
- **prio:** 23
- **status:** todo
- **beschreibung:** |
    Visueller Feinschliff der Karte: statt harter Kanten zwischen Terrain-Typen
    werden Übergangs-Kacheln eingesetzt, Waldfelder bekommen Baum-Sprites,
    Berge sehen wie echte Erhebungen aus.

    1. Übergangs-Kacheln: Für jede Kachel ein 4-Bit-Nachbarmask berechnen
       (analog Mauer-Varianten aus Task 18), passendes Übergangs-Sprite wählen.
       Priorität: grass↔sand und sand↔coast/ocean.
       Sprite-Indizes per Sichtprüfung der sprite_N.png-Dateien ermitteln
       (Bereich 1–50 für Gras-Varianten, 107–160 für Sand/Küste).

    2. Baum-Sprites auf ca. 70 % der Wald-Kacheln (deterministisch via Map-Seed).
       Baum-Sprite-Indizes per Sichtprüfung finden (wahrsch. Bereich 1600–2000).

    3. Berg-Sprites auf Bergkacheln (wahrsch. 107–160, per Inspektion bestätigen).

    4. Küsten-Animation (optional): Wasser-Frames als AnimatedSprite wenn
       Anno-Sprites dafür vorhanden.

- **akzeptanzkriterien:** |
    - [ ] Übergänge zwischen Gras und Sand sind weich (keine harten Kanten)
    - [ ] Waldfelder zeigen Baum-Sprites
    - [ ] Bergfelder zeigen Fels/Berg-Sprite
    - [ ] Karte wirkt insgesamt abwechslungsreich
    - [ ] Alle bestehenden Tests weiterhin grün
    - [ ] `npm run build` fehlerfrei
- **kontext:** |
    Baut auf Task 22 (Terrain-Rendering) auf. Ausschließlich Rendering.
    Transition-Logik analog zu Mauer-Varianten (Task 18): 4-Bit-Mask →
    Sprite-Index aus Lookup-Tabelle.
- **dateien:** |
    - ÄNDERN: `src/render/map-view.ts`
    - ÄNDERN: `src/content/sprite-mapping.json`
