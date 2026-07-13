# Tasks — Welle 1: MVP (Aufbau-Loop)

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

  Quelle: spielkonzept.md (Repo-Root) — Phase 1 (MVP) dieser Liste.
  Konkrete Namen für Ressourcen/Gebäude sind Vorschläge — der bearbeitende Agent
  darf sie sinnvoll anpassen, sofern die Struktur (Datenfile, i18n-Key, Typ) erhalten bleibt.
-->

## Aufgaben

---

### Task 1: Projekt-Setup — TypeScript + PixiJS + Vite-Grundgerüst
- **prio:** 1
- **status:** done
- **beschreibung:** |
    Leeres Repo (nur `spielkonzept.md`, `README.md`) in ein lauffähiges TypeScript/
    PixiJS-Projekt verwandeln. Build-Tool: Vite (schnelles Dev-Setup, Standard für
    PixiJS-Browser-Projekte, kein zusätzlicher Server nötig).

    Ordnerstruktur anlegen (leer, mit `.gitkeep` oder erstem Platzhalter-File):
    - `src/sim/` — Simulationskern (später: State, Tick, Commands)
    - `src/render/` — PixiJS-Rendering
    - `src/ui/` — HUD/Menüs
    - `src/i18n/` — Sprachdateien
    - `src/content/` — Daten (Gebäude, Fraktionen, Events, Ressourcen)
    - `src/save/` — Speicherstand-Serialisierung
    - `tests/` — für spätere Playwright-Specs (falls gebraucht)

    Basis-Setup:
    1. `npm create vite@latest . -- --template vanilla-ts` (oder gleichwertig manuell)
    2. `pixi.js` als Dependency installieren
    3. `vitest` als Dev-Dependency installieren, `vitest.config.ts` anlegen
    4. Minimaler Entry-Point (`src/main.ts`): PixiJS-Application erzeugen, leeren
       Canvas ins DOM einhängen, `npm run dev` startet ohne Fehler
    5. TypeScript strict mode aktivieren (`tsconfig.json`: `"strict": true`)
    6. `package.json` Scripts: `dev`, `build`, `test` (vitest run)

    Kein Spiel-Feature in diesem Task — nur die Grundlage, auf der alle folgenden
    Tasks aufbauen.
- **akzeptanzkriterien:** |
    - [ ] `npm install && npm run dev` startet lokalen Dev-Server ohne Fehler
    - [ ] Browser zeigt leeren PixiJS-Canvas (schwarzer oder farbiger Hintergrund reicht)
    - [ ] `npm run build` erzeugt ein `dist/`-Bundle ohne TypeScript-Fehler
    - [ ] `npm test` (vitest) läuft durch (auch wenn noch keine echten Tests existieren)
    - [ ] Ordnerstruktur `src/sim`, `src/render`, `src/ui`, `src/i18n`, `src/content`,
          `src/save` existiert
    - [ ] `tsconfig.json` hat `"strict": true`
- **kontext:** |
    Stack-Entscheidung aus `spielkonzept.md`: TypeScript im Browser, PixiJS, Vite
    ist die naheliegende Build-Tool-Wahl dafür (nicht explizit im Konzept genannt,
    aber Standardkombination — bei Bedarf im SESSION_NOTES.md begründen falls anders
    entschieden wird).
- **dateien:** |
    - NEU: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`
    - NEU: `src/main.ts`
    - NEU: `src/sim/.gitkeep`, `src/render/.gitkeep`, `src/ui/.gitkeep`,
      `src/i18n/.gitkeep`, `src/content/.gitkeep`, `src/save/.gitkeep`

---

### Task 2: i18n-Grundgerüst (Sprachdateien)
- **prio:** 2
- **status:** done
- **beschreibung:** |
    Sprachdatei-System aufbauen, BEVOR weitere Features Texte brauchen — Vorgabe aus
    `spielkonzept.md`: "alle Texte ab Tag 1 in Sprachdateien (de zuerst), keine
    Strings im Code."

    1. `src/i18n/de.json`: flache oder verschachtelte Struktur mit `dot.notation`-Keys,
       z. B. `{"ui": {"resources": {"wood": "Holz"}}}` oder `"ui.resources.wood"`
    2. `src/i18n/index.ts`: Funktion `t(key: string): string`, die einen Key aus der
       aktuell geladenen Sprachdatei auflöst. Fehlt ein Key: Key selbst zurückgeben
       UND in der Konsole warnen (kein Crash)
    3. Sprache aktuell fest auf `de` — Struktur muss aber weitere Sprachen später
       ohne Umbau zulassen (z. B. `loadLanguage(lang: string)`)
    4. Ein paar Beispiel-Keys anlegen (z. B. `app.title`, `ui.loading`), die in
       Task 1's `main.ts` oder einem einfachen Test genutzt werden, um das System
       zu verifizieren
- **akzeptanzkriterien:** |
    - [ ] `t("app.title")` liefert den Text aus `de.json`
    - [ ] `t("nicht.vorhanden")` liefert den Key zurück statt zu crashen, loggt Warnung
    - [ ] Kein Text ist direkt im Code hartkodiert, wo `t()` zum Einsatz kommt
    - [ ] Vitest-Test für `t()`: gefundener Key, fehlender Key, verschachtelter Key
- **kontext:** |
    Architekturregel (`.claude/context/arch.md`): Kern und Rendering referenzieren
    nur i18n-Keys, nie Klartext. Dieses Grundgerüst ist Voraussetzung für Task 6, 7,
    8, 10 (alle brauchen sichtbaren Text).
- **dateien:** |
    - NEU: `src/i18n/de.json`
    - NEU: `src/i18n/index.ts`
    - NEU: `src/i18n/index.test.ts`

---

### Task 3: Simulationskern-Grundgerüst (Tick-Loop, Commands, seeded RNG)
- **prio:** 3
- **status:** done
- **beschreibung:** |
    Deterministischen Kern anlegen: reine Funktionen, kein PixiJS/DOM-Import,
    lauffähig headless in Node (Voraussetzung für spätere Multiplayer-Server-Nutzung,
    siehe `.claude/context/history.md`).

    1. `src/sim/state.ts`: TypeScript-Typ `GameState` (zunächst minimal: `tick: number`,
       `resources: Record<string, number>`, `buildings: Building[]` — wird in
       späteren Tasks erweitert)
    2. `src/sim/rng.ts`: seeded RNG (z. B. einfacher Mulberry32- oder xorshift-
       Algorithmus, kein externes Package nötig). Signatur: `createRng(seed: number)
       => () => number`
    3. `src/sim/commands.ts`: Command-Typ (discriminated union, z. B.
       `{ type: "noop" }` als Platzhalter — echte Befehle wie `build` kommen in
       Task 7) und Funktion `applyCommand(state: GameState, command: Command):
       GameState` (reine Funktion, gibt NEUEN State zurück, mutiert nicht)
    4. `src/sim/tick.ts`: Funktion `tick(state: GameState, commands: Command[]):
       GameState` — verarbeitet alle Befehle eines Ticks, erhöht `state.tick`
    5. Determinismus-Test: gleicher Start-State + gleiche Seed + gleiche Befehlsfolge
       über N Ticks → exakt gleicher End-State (per `JSON.stringify`-Vergleich oder
       einfachem Hash)
- **akzeptanzkriterien:** |
    - [ ] `src/sim/**` importiert nichts aus `pixi.js`, kein `window`/`document`
    - [ ] `tick()` mutiert den übergebenen State NICHT (Referenzvergleich vorher/nachher
          unterschiedlich, altes Objekt unverändert)
    - [ ] Determinismus-Test: zwei Läufe mit identischem Seed + identischen Befehlen
          liefern identischen End-State
    - [ ] Kein `Math.random()`/`Date.now()` in `src/sim/` außerhalb von `rng.ts`
    - [ ] `npx vitest run src/sim` läuft fehlerfrei
- **kontext:** |
    Architekturregel: Zustand ändert sich NUR über Befehle pro Tick. Dieser Task
    legt das Muster fest, das Task 6 (Ressourcen), 7 (Bauen), 8 (Tag/Nacht) mit
    echten Befehlen füllen.
- **dateien:** |
    - NEU: `src/sim/state.ts`, `src/sim/rng.ts`, `src/sim/commands.ts`, `src/sim/tick.ts`
    - NEU: `src/sim/rng.test.ts`, `src/sim/tick.test.ts`

---

### Task 4: Speichersystem (Serialisierung, Versionierung, lokaler Export/Import)
- **prio:** 4
- **status:** done
- **beschreibung:** |
    Speicherstände-Format anlegen: "DB-ready, versioniert" laut `spielkonzept.md`,
    damit spätere Server-Accounts ohne Formatbruch möglich sind. Zunächst nur
    lokal (Datei-Export/Import im Browser), kein Server.

    1. `src/save/schema.ts`: Typ `SaveFile` mit Feldern `version: number`,
       `savedAt: string` (ISO-Datum), `state: GameState`
    2. `src/save/serialize.ts`: `serialize(state: GameState): SaveFile` und
       `deserialize(save: SaveFile): GameState`. Bei unbekannter/älterer `version`:
       einfache Migrationsfunktion vorbereiten (auch wenn aktuell nur Version 1
       existiert — Stub-Funktion `migrate(save: SaveFile): SaveFile` die bei
       `version === CURRENT_VERSION` einfach durchreicht)
    3. `src/save/local-file.ts`: `downloadSave(save: SaveFile): void` (erzeugt Blob,
       triggert Browser-Download als `.json`) und `readSaveFile(file: File):
       Promise<SaveFile>` (liest hochgeladene Datei)
    4. Validierung beim Laden: fehlerhafte/fremde JSON-Datei → klare Fehlermeldung
       (über i18n-Key), kein Crash der App
- **akzeptanzkriterien:** |
    - [ ] `serialize()` → `deserialize()` liefert einen zum Original äquivalenten
          `GameState` (Roundtrip-Test)
    - [ ] Speicherdatei enthält `version`-Feld
    - [ ] Ungültige Datei beim Laden: definierter Fehler (kein unbehandelter Crash),
          Fehlertext über `t()`
    - [ ] Vitest-Test für Serialisierung/Deserialisierung inkl. Roundtrip
- **kontext:** |
    Baut auf `src/sim/state.ts` (Task 3) auf. `local-file.ts` nutzt Browser-APIs
    (Blob, File) — das ist zulässig, da es in `src/save/`, nicht in `src/sim/`
    liegt (Kern bleibt headless-fähig).
- **dateien:** |
    - NEU: `src/save/schema.ts`, `src/save/serialize.ts`, `src/save/local-file.ts`
    - NEU: `src/save/serialize.test.ts`
    - ÄNDERN: `src/i18n/de.json` (Fehlertexte für ungültige Speicherdatei)

---

### Task 5: Isometrische Karten-Darstellung (Tile-Rendering, Kamera)
- **prio:** 5
- **status:** done
- **beschreibung:** |
    Erste sichtbare Spielwelt: eine isometrische Kachel-Karte, über die man per
    Maus/Touch schwenken (pannen) und zoomen kann.

    1. `src/render/iso.ts`: zentrale Koordinatentransformation zwischen Gitter-
       Koordinaten (Spalte/Zeile) und Bildschirm-Pixeln für isometrische
       Darstellung (`gridToScreen(col, row): {x, y}` und `screenToGrid(x, y):
       {col, row}`)
    2. `src/render/map-view.ts`: rendert ein Grid aus Platzhalter-Kacheln (z. B.
       einfarbige Rauten/Rechtecke, siehe Task 9 für echte Platzhalter-Assets) für
       eine konfigurierbare Kartengröße (z. B. 40×40 Kacheln zum Start)
    3. `src/render/camera.ts`: Kamera-Objekt mit Pan (Drag mit Maus/Touch) und Zoom
       (Mausrad/Pinch), begrenzt auf sinnvolle Min/Max-Zoomstufen und Kartengrenzen
       (nicht endlos rausscrollen)
    4. Karte und Kamera werden in `src/main.ts` eingebunden, Kachel unter dem
       Mauszeiger wird optisch hervorgehoben (Hover-Feedback, Grundlage für Task 7)
- **akzeptanzkriterien:** |
    - [ ] Karte aus mind. 40×40 Kacheln wird isometrisch dargestellt
    - [ ] Drag mit gedrückter Maustaste verschiebt die Kamera (Pan)
    - [ ] Mausrad zoomt rein/raus, innerhalb definierter Grenzen
    - [ ] Kamera lässt sich nicht beliebig weit über den Kartenrand hinausschieben
    - [ ] `gridToScreen`/`screenToGrid` sind zueinander invers (Test: Rundung
          tolerieren, aber Grid-Zelle muss übereinstimmen)
    - [ ] Kachel unter Mauszeiger wird optisch markiert
- **kontext:** |
    Reine Rendering-Aufgabe, kein Bezug zu `src/sim/` außer später über die
    Snapshot-Schicht. `iso.ts` ist DIE zentrale Stelle für die Transformation
    (Architekturregel: nicht duplizieren).
- **dateien:** |
    - NEU: `src/render/iso.ts`, `src/render/map-view.ts`, `src/render/camera.ts`
    - NEU: `src/render/iso.test.ts`
    - ÄNDERN: `src/main.ts`

---

### Task 6: Ressourcenwirtschaft (Typen, Produktion, Lagerung)
- **prio:** 6
- **status:** done
- **beschreibung:** |
    Erste echte Spiellogik im Kern: Ressourcen, die durch Gebäude produziert und
    verbraucht werden. Vorschlag für Basis-Ressourcen (Low-Fantasy-Siedlung):
    Holz, Stein, Nahrung, Gold — Agent darf Namen/Anzahl anpassen, Struktur
    (Datenfile + i18n-Key) muss aber erhalten bleiben.

    1. `src/content/resources.ts` (oder `.json`): Liste der Ressourcentypen mit
       `id`, i18n-Key für Anzeigename, optional Icon-Platzhalter-Referenz
    2. `GameState.resources` (aus Task 3) um alle Ressourcentypen erweitern,
       Startwerte definieren
    3. `src/sim/production.ts`: Funktion, die pro Tick basierend auf vorhandenen
       Produktionsgebäuden (Platzhalter-Liste, echte Gebäude kommen in Task 7)
       Ressourcen erzeugt bzw. verbraucht (z. B. Nahrung sinkt kontinuierlich durch
       Bevölkerung — auch Bevölkerung ist hier nur ein einfacher Platzhalterwert)
    4. Lagerkapazität: Ressourcen dürfen ein Maximum nicht überschreiten
       (Kappung im Tick), niemals negativ werden
    5. `tick()` (Task 3) ruft die Produktionslogik pro Durchlauf auf
- **akzeptanzkriterien:** |
    - [ ] Mind. 3 Ressourcentypen mit Startwert, Produktionsrate, Lagerkapazität
    - [ ] Ressourcen werden über mehrere Ticks korrekt akkumuliert/verbraucht
    - [ ] Ressourcen werden nie negativ (Test mit hohem Verbrauch, niedrigem Start)
    - [ ] Ressourcen überschreiten nie die Lagerkapazität (Test mit hoher Produktion)
    - [ ] Anzeigenamen der Ressourcen kommen aus i18n, nicht hartkodiert
    - [ ] Determinismus bleibt erhalten (Test aus Task 3 weiterhin grün)
- **kontext:** |
    Baut auf Task 3 (Tick/Command-Pattern) und Task 2 (i18n) auf. Gebäude, die
    Ressourcen produzieren, kommen erst in Task 7 — hier reicht ein einfacher
    Platzhaltermechanismus (z. B. feste Basis-Produktionsrate ohne Gebäudebezug),
    der in Task 7 durch echte Gebäude ersetzt/erweitert wird.
- **dateien:** |
    - NEU: `src/content/resources.ts`, `src/sim/production.ts`, `src/sim/production.test.ts`
    - ÄNDERN: `src/sim/state.ts`, `src/sim/tick.ts`, `src/i18n/de.json`

---

### Task 7: Bau-System (Gebäude platzieren, Kosten, Gebäude-Katalog)
- **prio:** 7
- **status:** done
- **beschreibung:** |
    Spieler kann Gebäude auf der Karte platzieren, die Ressourcen kosten und ab
    dann die Ressourcenproduktion (Task 6) beeinflussen.

    1. `src/content/buildings.ts` (oder `.json`): Gebäude-Katalog — je Gebäude:
       `id`, i18n-Key Name, Baukosten (Ressourcen-Mengen), Größe auf dem Grid
       (z. B. 1×1, 2×2), Produktions-/Verbrauchseffekt. Vorschlag für Start-Set:
       Rathaus (Startgebäude, bereits platziert), Holzfäller-Hütte, Steinbruch,
       Bauernhof — Agent darf anpassen
    2. `src/sim/commands.ts` (Task 3) erweitern: neuer Befehlstyp
       `{ type: "build", buildingId: string, col: number, row: number }`
    3. `applyCommand`: prüft Kollision (Feld schon belegt?), prüft ausreichende
       Ressourcen, zieht Kosten ab, fügt Gebäude zum State hinzu. Bei Fehlschlag:
       State unverändert zurückgeben (kein Crash, kein Teil-Effekt)
    4. `src/sim/production.ts` (Task 6): Produktionslogik liest jetzt echte
       platzierte Gebäude statt Platzhalterwert
    5. Rendering: Bau-Menü (Task 10 baut UI weiter aus, hier reicht Klick-Platzierung)
       — Klick auf Kachel + ausgewähltes Gebäude löst `build`-Befehl aus
- **akzeptanzkriterien:** |
    - [ ] Gebäude lässt sich nur auf freiem Feld platzieren (Kollision verhindert
          Überlappung)
    - [ ] Bau schlägt fehl (State unverändert) wenn Ressourcen nicht ausreichen
    - [ ] Bau zieht exakt die definierten Kosten ab bei Erfolg
    - [ ] Platziertes Gebäude beeinflusst ab dem nächsten Tick die Produktion
          (Task 6 Logik)
    - [ ] Gebäude-Katalog ist ein Datenfile, keine Werte im Command-Handler
          hartkodiert
    - [ ] Determinismus-Test weiterhin grün mit `build`-Befehlen in der Sequenz
- **kontext:** |
    Erweitert Task 3 (Commands) und Task 6 (Produktion). Rendering-seitig
    verbindet sich das mit Task 5 (Karte, `screenToGrid` für Klick-Zielfeld).
- **dateien:** |
    - NEU: `src/content/buildings.ts`, `src/sim/build.test.ts`
    - ÄNDERN: `src/sim/commands.ts`, `src/sim/state.ts`, `src/sim/production.ts`,
      `src/render/map-view.ts`, `src/i18n/de.json`

---

### Task 8: Tag/Nacht-Zyklus
- **prio:** 8
- **status:** done
- **beschreibung:** |
    Zeit-System: das Spiel läuft in einem wiederkehrenden Tag/Nacht-Zyklus (Kern-Loop
    laut `spielkonzept.md`), der später Grundlage für Verteidigungs-Ereignisse
    (Phase 2, NICHT Teil dieses Tasks) ist.

    1. `src/sim/time.ts`: Funktion, die aus `state.tick` die aktuelle Tageszeit
       ableitet (z. B. `getTimeOfDay(tick): "day" | "night"` plus Fortschritt
       0–1 innerhalb der aktuellen Phase), Ticks-pro-Tag als Konstante
    2. `src/render/day-night-overlay.ts`: visuelles Overlay über der Karte, das
       sich abhängig von Tageszeit einfärbt/abdunkelt (weicher Übergang, kein
       harter Schnitt zwischen Tag und Nacht)
    3. UI-Anzeige der aktuellen Tageszeit (Grundlage für Task 10, hier nur die
       Kern-Daten dafür bereitstellen)
- **akzeptanzkriterien:** |
    - [ ] `getTimeOfDay()` liefert über einen vollen Zyklus abwechselnd Tag/Nacht
    - [ ] Übergang Tag→Nacht visuell weich (kein sprunghafter Farbwechsel)
    - [ ] Zyklus-Länge ist eine benannte Konstante, kein Magic Number im Code verstreut
    - [ ] Determinismus bleibt erhalten (Zeit ist reine Funktion von `tick`)
- **kontext:** |
    Reine Erweiterung von `src/sim/tick.ts` (Task 3) um eine abgeleitete Größe —
    kein neuer State nötig, `tick` ist bereits vorhanden.
- **dateien:** |
    - NEU: `src/sim/time.ts`, `src/sim/time.test.ts`, `src/render/day-night-overlay.ts`
    - ÄNDERN: `src/main.ts`

---

### Task 9: Platzhalter-Asset-Pipeline
- **prio:** 9
- **status:** done
- **beschreibung:** |
    Laut `spielkonzept.md` ist eine KI-Asset-Pipeline angestrebt, aber noch nicht
    umgesetzt — bis dahin mit Platzhaltern arbeiten, damit der Aufbau-Loop nicht
    blockiert. Dieser Task ersetzt die einfarbigen Platzhalter aus Task 5/7 durch
    ein einheitliches, leicht austauschbares Platzhalter-System.

    1. `src/render/placeholder-sprites.ts`: generiert einfache, unterscheidbare
       Platzhalter-Grafiken PROGRAMMATISCH mit PixiJS-Graphics (Rauten für Kacheln,
       einfache Formen mit Farbe + Buchstabe/Symbol für Gebäudetypen) — KEINE
       externen Bilddateien aus dem Internet laden (Arbeitsregel: nichts ohne
       Rückfrage herunterladen)
    2. Jedes Gebäude aus dem Katalog (Task 7) bekommt eine unterscheidbare
       Platzhalter-Darstellung (z. B. Farbe pro Gebäudetyp)
    3. Struktur so anlegen, dass ein späterer Ersatz durch echte Sprites nur den
       Inhalt von `placeholder-sprites.ts` (oder eine zentrale Asset-Zuordnung)
       ändern muss, nicht die aufrufenden Stellen in `map-view.ts`
- **akzeptanzkriterien:** |
    - [ ] Jeder Gebäudetyp aus dem Katalog ist visuell unterscheidbar
    - [ ] Keine Bilddatei wird aus dem Internet nachgeladen
    - [ ] Austausch gegen echte Assets würde nur eine Datei/Zuordnungsstelle betreffen
          (kurz in SESSION_NOTES.md begründen, welche)
- **kontext:** |
    Bewusst spät im MVP platziert (nach Task 5 und 7), damit erst die Struktur
    steht, die die Platzhalter befüllen.
- **dateien:** |
    - NEU: `src/render/placeholder-sprites.ts`
    - ÄNDERN: `src/render/map-view.ts`

---

### Task 10: HUD/UI-Grundgerüst
- **prio:** 10
- **status:** todo
- **beschreibung:** |
    Sichtbare Oberfläche über der Karte: Ressourcenanzeige, Bau-Menü, Zeit-Anzeige.

    1. `src/ui/hud.ts`: Leiste mit aktuellem Bestand jeder Ressource (Task 6),
       aktualisiert sich live pro Tick
    2. `src/ui/build-menu.ts`: Liste der verfügbaren Gebäude aus dem Katalog
       (Task 7) mit Kosten-Anzeige, Auswahl eines Gebäudes aktiviert den
       Platzierungsmodus auf der Karte
    3. `src/ui/time-display.ts`: zeigt aktuelle Tageszeit (Task 8) an, z. B. als
       Symbol/Text, das sich mit dem Zyklus ändert
    4. Alle sichtbaren UI-Texte über `t()` (Task 2), kein hartkodierter String
    5. UI liest Daten NUR über eine Snapshot-Funktion aus `src/sim/`, löst bei
       Interaktion Befehle aus (kein direktes State-Schreiben aus der UI)
- **akzeptanzkriterien:** |
    - [ ] Ressourcenanzeige aktualisiert sich sichtbar nach jedem Tick
    - [ ] Bau-Menü zeigt alle Gebäude aus dem Katalog mit korrekten Kosten
    - [ ] Auswahl eines Gebäudes im Menü + Klick auf Karte platziert es (Task 7)
    - [ ] Tageszeit-Anzeige ändert sich im Zyklus sichtbar
    - [ ] Kein hartkodierter sichtbarer Text in `src/ui/`
- **kontext:** |
    Verbindet Task 2 (i18n), 5 (Karte/Klick), 6 (Ressourcen), 7 (Bauen), 8 (Zeit)
    zu einer benutzbaren Oberfläche — größtenteils Verdrahtung bestehender Bausteine.
- **dateien:** |
    - NEU: `src/ui/hud.ts`, `src/ui/build-menu.ts`, `src/ui/time-display.ts`
    - ÄNDERN: `src/main.ts`, `src/i18n/de.json`

---

### Task 11: Save/Load-UI
- **prio:** 11
- **status:** todo
- **beschreibung:** |
    Sichtbare Bedienung für das Speichersystem aus Task 4: Speichern-Button
    (löst Datei-Download aus) und Laden-Button (öffnet Datei-Auswahl, lädt
    State, ersetzt aktuellen Spielstand).

    1. `src/ui/save-load-menu.ts`: zwei Aktionen — "Speichern" ruft
       `serialize()` + `downloadSave()` (Task 4) auf; "Laden" öffnet einen
       Datei-Dialog, ruft `readSaveFile()` + `deserialize()` auf und ersetzt
       den laufenden `GameState`
    2. Erfolgreiches Laden setzt Kamera/UI korrekt auf den neuen State zurück
       (kein Mischzustand aus altem und neuem Spielstand)
    3. Fehler beim Laden (Task 4 Validierung) zeigt eine Nutzer-verständliche
       Meldung über `t()`, Spiel läuft mit dem vorherigen Stand normal weiter
- **akzeptanzkriterien:** |
    - [ ] Speichern-Button erzeugt eine herunterladbare `.json`-Datei
    - [ ] Laden einer zuvor gespeicherten Datei stellt exakt den gespeicherten
          Zustand wieder her (Ressourcen, Gebäude, Tick-Stand)
    - [ ] Laden einer ungültigen Datei zeigt Fehlermeldung, Spiel bleibt nutzbar
    - [ ] Kein hartkodierter Text (alles über `t()`)
- **kontext:** |
    Reine UI-Schicht über Task 4 (Speichersystem) — keine neue Logik im Kern nötig.
- **dateien:** |
    - NEU: `src/ui/save-load-menu.ts`
    - ÄNDERN: `src/main.ts`, `src/i18n/de.json`

---

### Task 12: Integrationstest MVP-Loop
- **prio:** 12
- **status:** todo
- **beschreibung:** |
    Abschluss der MVP-Phase: Prüfen, dass der komplette Aufbau-Loop end-to-end
    funktioniert und zusammenspielt — Abnahme für "der Aufbau-Loop macht allein
    schon Spaß" (Ziel aus `spielkonzept.md`).

    1. Automatisierter Integrationstest auf Kern-Ebene (Vitest, kein Browser
       nötig): Start-State → mehrere Ticks vergehen lassen → Gebäude bauen →
       weitere Ticks → Ressourcenstand plausibel prüfen → serialisieren →
       deserialisieren → Zustand muss identisch sein
    2. Falls im Projekt zu dem Zeitpunkt Playwright eingerichtet ist: ein
       Smoke-Test, der im Browser klickt (Kamera pannen, Gebäude bauen, Speichern-
       Button klicken) — NUR anlegen, wenn es den Aufwand wert ist, sonst reicht
       Punkt 1 (Entscheidung dem Agenten überlassen, in SESSION_NOTES.md begründen)
    3. Kurzer manueller Testbericht in SESSION_NOTES.md: Was wurde geprüft, was
       funktioniert, was ist bekannt unvollständig (z. B. Balancing nicht final)
- **akzeptanzkriterien:** |
    - [ ] Integrationstest deckt den vollen Loop ab: Tick → Bauen → Tick →
          Speichern → Laden → Zustand konsistent
    - [ ] Alle bisherigen Vitest-Tests (Task 1–11) laufen weiterhin grün
    - [ ] `npm run build` erzeugt weiterhin ein fehlerfreies Bundle
    - [ ] SESSION_NOTES.md enthält kurzen Abnahme-Bericht für die MVP-Phase
- **kontext:** |
    Letzter Task der Welle 1 (MVP). Nach `done` ist Phase 1 aus `spielkonzept.md`
    abgeschlossen — Phase 2 (Verteidigung/Autobattle) folgt in einer neuen Welle,
    sobald Prioritäten/Feedback dazu vorliegen.
- **dateien:** |
    - NEU: `src/sim/mvp-loop.test.ts`
    - ÄNDERN: `SESSION_NOTES.md`
