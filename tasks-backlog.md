# Tasks — Backlog (parkiert)

<!--
  Diese Aufgaben sind PARKIERT und werden NICHT automatisch vom Workflow aufgegriffen.
  Erst in tasks.md eintragen, wenn sie dran sind.
-->

---

## Terrain & Karten-Optik

<!-- Tasks B1–B3 sind zurück in tasks.md (Task 21–23) -->

### Task B1–B3: zurück in tasks.md als Task 21–23

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
