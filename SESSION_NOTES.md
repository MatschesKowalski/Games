## Task 3: Simulationskern-Grundgerüst (Tick-Loop, Commands, seeded RNG)
**Status:** in_progress
**Start:** 2026-07-13

### Plan
1. src/sim/state.ts — GameState Typ (tick, resources, buildings)
2. src/sim/rng.ts — seeded RNG (Mulberry32)
3. src/sim/commands.ts — Command discriminated union + applyCommand()
4. src/sim/tick.ts — tick()-Funktion
5. Tests: rng.test.ts, tick.test.ts (inkl. Determinismus-Test)

### Entscheidungen
- Reine Funktionen, kein DOM/pixi.js Import in src/sim/
- applyCommand gibt neuen State zurück (immutabel)
