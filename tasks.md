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
- **status:** todo
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
- **status:** todo
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
- **status:** todo
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

## Welle 3: Phase 2 — Verteidigung

---

### Task 17: Einheiten-System (Truppen-Typen, Rekrutierung)
- **prio:** 17
- **status:** todo
- **beschreibung:** |
    Grundlage für das Kampfsystem: Truppen, die der Spieler rekrutieren und
    positionieren kann. Einheitenwerte aus Task 14 (COD-Parser).

    1. `src/sim/state.ts` erweitern: `units: Unit[]` pro Spieler;
       `Unit`: `id, typeId, col, row, hp, maxHp, side: "player" | "enemy"`
    2. `src/content/units.ts`: Einheitentypen mit `id`, i18n-Key, HP, Schaden,
       Reichweite (Nahkampf/Fernkampf), Bewegungsgeschwindigkeit (Ticks/Feld),
       Rekrutierungskosten. Start-Set: Soldat (Nahkampf), Bogenschütze (Fernkampf),
       Ritter (Nahkampf, stark). Werte aus `assets/data/units-raw.json` (Task 14).
    3. Neue Befehle in `src/sim/commands.ts`:
       - `{ type: "recruit", unitTypeId, col, row }` — rekrutiert Einheit,
         kostet Ressourcen, platziert auf Karte
    4. Neues Gebäude `Kaserne` in `src/content/buildings.ts` — Voraussetzung
       für Rekrutierung (nur wenn Kaserne vorhanden)
    5. UI: Kaserne-Gebäude auswählen → Einheiten-Menü zeigt verfügbare Typen
       mit Kosten; Klick auf Feld platziert Einheit
- **akzeptanzkriterien:** |
    - [ ] Mindestens 3 Einheitentypen mit unterschiedlichen Werten
    - [ ] Rekrutierung schlägt fehl ohne Kaserne (State unverändert)
    - [ ] Rekrutierung schlägt fehl ohne Ressourcen (State unverändert)
    - [ ] Einheiten-Sprites aus Soldat.bsh (Task 13/15) auf der Karte sichtbar
    - [ ] Determinismus-Test weiterhin grün
    - [ ] Einheitenwerte aus `src/content/units.ts`, nichts hartkodiert im Handler
- **kontext:** |
    Baut auf Task 3 (Commands/State), Task 6 (Ressourcen), Task 7 (Bausystem),
    Task 14 (Einheitendaten), Task 15 (Sprites) auf. Kampflogik kommt erst
    in Task 20/21 — hier nur Rekrutierung und Platzierung.
- **dateien:** |
    - ÄNDERN: `src/sim/state.ts`, `src/sim/commands.ts`, `src/content/buildings.ts`
    - ÄNDERN: `src/content/units.ts` (aus Task 14 ergänzt)
    - NEU: `src/sim/units.test.ts`
    - ÄNDERN: `src/ui/hud.ts`, `src/ui/build-menu.ts`, `src/i18n/de.json`

---

### Task 18: Defensive Gebäude (Mauern, Türme, Tore)
- **prio:** 18
- **status:** todo
- **beschreibung:** |
    Verteidigungsinfrastruktur: der Spieler kann Mauern, Türme und Tore bauen,
    die feindliche Einheiten aufhalten oder verlangsamen.

    1. Neue Gebäudetypen in `src/content/buildings.ts`:
       - `Stadtmauer` (1×1, kettenfähig — verbindet sich visuell mit Nachbar-
         Mauern auf angrenzenden Feldern)
       - `Wachturm` (1×1, gibt Bogenschützen-Reichweite im Autobattle)
       - `Burgtor` (2×1, Durchlass für eigene Einheiten, blockiert Feinde)
    2. Mauer-Rendering: `src/render/map-view.ts` prüft, welche Nachbarfelder
       ebenfalls Mauer haben und wählt den passenden Mauer-Sprite
       (Anno 1602 Stadtfld.bsh enthält Mauer-Segmente für alle Richtungen)
    3. Im Kampfsystem (Task 21): Mauer erhöht Verteidigungswert, Türme feuern
       automatisch auf Feinde in Reichweite. Hier nur: Gebäude existieren im State.
    4. Neue Befehlstypen nicht nötig — `build`-Befehl aus Task 7 reicht.
- **akzeptanzkriterien:** |
    - [ ] Stadtmauer, Wachturm, Burgtor sind im Bau-Menü verfügbar
    - [ ] Mauern verbinden sich visuell mit benachbarten Mauern
    - [ ] Mauern blockieren das Feld (Einheiten können nicht dort platziert werden)
    - [ ] Alle bestehenden Tests weiterhin grün
- **kontext:** |
    Baut auf Task 7 (Bausystem) und Task 15 (Sprites) auf. Das Kampfverhalten
    der Mauern/Türme folgt in Task 21 (Autobattle). Hier nur Bau und Darstellung.
- **dateien:** |
    - ÄNDERN: `src/content/buildings.ts`, `src/render/map-view.ts`
    - ÄNDERN: `src/content/sprite-mapping.json`, `src/i18n/de.json`

---

### Task 19: Angriffs-Ereignisse
- **prio:** 19
- **status:** todo
- **beschreibung:** |
    Feindliche Angriffswellen als Kern-Spielereignis: Nach einer konfigurierten
    Anzahl Spieltage kündigt sich ein Angriff an; bei Nacht beginnt das Gefecht.

    1. `src/sim/events.ts`: Event-System — `GameEvent` Union-Type mit mindestens:
       - `{ type: "attack-warning", waveTick: number, strength: number }`
         (erscheint N Ticks vor dem Angriff)
       - `{ type: "attack-start", enemies: EnemyGroup[] }` (Angriff beginnt)
       - `{ type: "attack-result", won: boolean, losses: number }`
    2. `GameState` um `pendingEvents: GameEvent[]` und `attackWave: number`
       (Angriffswellen-Zähler) erweitern
    3. `src/sim/tick.ts`: nach X Tagen (Konstante `TICKS_PER_ATTACK_CYCLE`)
       `attack-warning` erzeugen, nach weiteren Y Ticks `attack-start`
    4. Angriffs-Stärke skaliert mit `attackWave` (jede Welle stärker)
    5. Gegnergruppen: Typen aus `units.ts`, aber mit `side: "enemy"`
    6. UI: Event-Anzeige als Modal oder HUD-Banner ("Angriff in X Tagen!",
       "Die Feinde kommen!"), Text über i18n
- **akzeptanzkriterien:** |
    - [ ] Nach konfigurierten Ticks erscheint `attack-warning` im State
    - [ ] Warnung wird sichtbar in der UI angezeigt (Text, kein roher JSON-Dump)
    - [ ] `attack-start` folgt nach weiterem Ablauf, enthält Gegnergruppe
    - [ ] Angriffsstärke steigt mit `attackWave`
    - [ ] Determinismus bleibt erhalten (Angriff-Timing rein aus `tick` abgeleitet)
    - [ ] Vitest-Test: nach N Ticks sind erwartete Events im State
- **kontext:** |
    Reine Sim-Kern-Erweiterung. Kampfauflösung folgt in Task 20/21.
    Events sind im State — kein Seiteneffekt, keine Callbacks.
- **dateien:** |
    - NEU: `src/sim/events.ts`, `src/sim/events.test.ts`
    - ÄNDERN: `src/sim/state.ts`, `src/sim/tick.ts`
    - ÄNDERN: `src/ui/hud.ts`, `src/i18n/de.json`

---

### Task 20: Aufstellungs-Phase
- **prio:** 20
- **status:** todo
- **beschreibung:** |
    Nach `attack-warning` hat der Spieler Zeit, Truppen auf Verteidigungspos-
    itionen zu platzieren. Ein separater Modus (Phase) trennt Aufbau und Kampf.

    1. Neuer State: `GameState.phase: "build" | "deployment" | "combat" | "result"`
    2. Bei `attack-warning`: automatisch in `"deployment"` wechseln
    3. Im Deployment-Modus:
       - Spieler kann Einheiten aus der Kaserne auf Felder hinter der Mauerlinie
         verschieben (neuer Befehl: `{ type: "move-unit", unitId, col, row }`)
       - Bau neuer Gebäude/Einheiten weiterhin möglich
       - Keine Ressourcenproduktion in dieser Phase (Kampfvorbereitung pausiert
         den normalen Tick — oder Tick läuft weiter, beide Varianten akzeptabel,
         in SESSION_NOTES.md begründen)
    4. UI: visueller Hinweis auf Deployment-Phase; Bestätigen-Button ("Bereit!")
       → Befehl `{ type: "deployment-ready" }` → Phase wechselt zu `"combat"`
    5. Zeitlimit (optional): nach X Ticks automatisch zu Combat wechseln
- **akzeptanzkriterien:** |
    - [ ] Phase wechselt korrekt: build → deployment → combat
    - [ ] Im Deployment-Modus können Einheiten umpositioniert werden
    - [ ] "Bereit!"-Button löst Combat-Phase aus
    - [ ] Phasenwechsel wird im HUD sichtbar angezeigt
    - [ ] Determinismus: Phasenwechsel rein aus State/Commands ableitbar
- **kontext:** |
    Baut auf Task 17 (Einheiten), Task 19 (Events) auf. Die eigentliche
    Kampfauflösung folgt in Task 21. Rendering-seitig: evtl. Einfärbung des
    Deployment-Bereichs (grün = erlaubte Zone).
- **dateien:** |
    - ÄNDERN: `src/sim/state.ts`, `src/sim/commands.ts`, `src/sim/tick.ts`
    - ÄNDERN: `src/ui/hud.ts`, `src/main.ts`, `src/i18n/de.json`
    - NEU: `src/sim/phase.test.ts`

---

### Task 21: Autobattle-Kern
- **prio:** 21
- **status:** todo
- **beschreibung:** |
    Das Herzstück von Phase 2: deterministisches Kampfsystem, das pro Tick
    automatisch abläuft, sobald die Combat-Phase beginnt.

    1. `src/sim/combat.ts`: Funktion `resolveCombatTick(state: GameState):
       GameState` — reiner State-In/State-Out, kein Seiteneffekt
       Logik pro Tick:
       a. Feinde bewegen sich auf nächste Spieler-Einheit oder Mauer zu
          (einfacher A*-Pfadfinder oder Manhattan-Greedy reicht)
       b. Einheiten in Reichweite greifen an (Schaden = Einheitenwert ± kleine
          RNG-Variation via `rng.ts`)
       c. Türme (Wachturm-Gebäude) feuern automatisch auf Feinde in Reichweite
       d. HP ≤ 0 → Einheit aus State entfernen
       e. Feinde erreichen Basis-Gebäude (Rathaus) → Schaden an Gebäude-HP
       f. Alle Feinde tot → `attack-result` mit `won: true`
       g. Rathaus-HP = 0 → `attack-result` mit `won: false` (Game-Over-Zustand)
    2. `tick()` ruft in Combat-Phase `resolveCombatTick()` statt normaler
       Ressourcen-Produktion auf
    3. Einheiten-HP wird im State getrackt (bereits in Task 17 vorbereitet)
    4. Nach Kampfende → Phase wechselt zu `"result"`, dann zurück zu `"build"`
- **akzeptanzkriterien:** |
    - [ ] Feinde bewegen sich pro Tick auf die Spieler-Basis zu
    - [ ] Kampf endet mit Sieg wenn alle Feinde besiegt
    - [ ] Kampf endet mit Niederlage wenn Rathaus-HP auf 0 fällt
    - [ ] Türme greifen Feinde in Reichweite automatisch an
    - [ ] Determinismus: gleicher Start-State + Seed → gleicher Kampfverlauf
    - [ ] Vitest-Test: kleines Szenario (5 Feinde vs. 3 Soldaten) → erwartetes
          Ergebnis nach N Ticks
- **kontext:** |
    Baut auf Task 3 (RNG, Determinismus), Task 17 (Einheiten), Task 18 (Türme/Mauern),
    Task 19 (Events), Task 20 (Phasen) auf. Rendering des Kampfes folgt in Task 22.
- **dateien:** |
    - NEU: `src/sim/combat.ts`, `src/sim/combat.test.ts`
    - ÄNDERN: `src/sim/tick.ts`, `src/sim/state.ts`

---

### Task 22: Kampf-Rendering & Audio
- **prio:** 22
- **status:** todo
- **beschreibung:** |
    Den in Task 21 berechneten Kampf sichtbar und hörbar machen.

    1. Einheiten-Sprites auf der Karte: Soldat-Sprites aus `Soldat.bsh`
       (Task 13/15), die sich je nach Bewegungsrichtung drehen (Anno 1602
       Sprites haben 8 Richtungen × Animation-Frames)
    2. Bewegungs-Animation: Einheiten gleiten flüssig zwischen Grid-Feldern
       (Interpolation zwischen zwei Positionen über mehrere Render-Frames,
       unabhängig vom Sim-Tick)
    3. Angriffs-Animation: kurzer Ausschlag in Angriffsrichtung, dann zurück
    4. Tod-Effekt: `Effekte.bsh` oder einfaches Ausblenden
    5. Kampf-Sounds (Task 16): `sdtattk1-6.wav` bei Soldat-Angriff,
       `Schwert1-5.wav` oder `Muskete1-3.wav` je Einheitentyp,
       `Kanone5-8.wav` bei Turm-Beschuss
    6. Ergebnis-Screen: nach Kampfende Modal mit Sieg/Niederlage-Text,
       Verluste-Übersicht, "Weiter"-Button zurück in Build-Phase
       (`Triumph.wav` bei Sieg)
- **akzeptanzkriterien:** |
    - [ ] Einheiten sind als Sprites sichtbar auf der Karte
    - [ ] Bewegung zwischen Feldern ist animiert (kein Teleportieren)
    - [ ] Kampfgeräusche ertönen bei Angriffen
    - [ ] Nach Kampf erscheint Ergebnis-Screen
    - [ ] Alle bestehenden Tests weiterhin grün
- **kontext:** |
    Reine Render-/Audio-Aufgabe über den Kern aus Task 21. Die Kampf-Animation
    liest nur den State (Snapshots pro Tick) — schreibt nie in den Kern.
- **dateien:** |
    - ÄNDERN: `src/render/map-view.ts`, `src/render/sound-manager.ts`
    - NEU: `src/render/unit-sprites.ts`, `src/ui/combat-result.ts`
    - ÄNDERN: `src/main.ts`, `src/i18n/de.json`

---

### Task 23: Integrationstest Phase 2
- **prio:** 23
- **status:** todo
- **beschreibung:** |
    Abschluss der Verteidigungs-Phase: vollständiger Loop end-to-end getestet.

    1. Vitest-Integrationstest: Aufbau-Phase → Kaserne bauen → Truppen rekrutieren
       → Mauern bauen → Angriffswelle ausgelöst → Deployment → Kampf → Sieg/
       Niederlage → Phase zurück auf Build → Speichern → Laden → State konsistent
    2. Alle Phase-1-Tests (Task 12) weiterhin grün
    3. Manueller Testbericht in SESSION_NOTES.md: was funktioniert, was ist
       bekanntes WIP (z. B. Balancing nicht final, Animation-Timing)
    4. Vorbereitung Phase 3 (Welt/Fog of War): kurze Notiz in SESSION_NOTES.md
       welche State-Felder Phase 3 brauchen wird (Erkundungs-Grid, Nachbar-Fraktionen)
- **akzeptanzkriterien:** |
    - [ ] Integrationstest deckt den vollen Phase-2-Loop ab
    - [ ] Alle Vitest-Tests (Tasks 1–22) laufen grün
    - [ ] `npm run build` erzeugt fehlerfreies Bundle
    - [ ] SESSION_NOTES.md enthält Abnahme-Bericht Phase 2
- **kontext:** |
    Entspricht Task 12 für Phase 2. Nach `done` ist Phase 2 aus `spielkonzept.md`
    abgeschlossen — Phase 3 (Fog of War, Erkundung) folgt in Welle 4.
- **dateien:** |
    - NEU: `src/sim/phase2-loop.test.ts`
    - ÄNDERN: `SESSION_NOTES.md`
