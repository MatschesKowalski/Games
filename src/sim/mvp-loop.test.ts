import { describe, it, expect } from 'vitest'
import { createInitialState } from './state'
import type { GameState } from './state'
import { tick } from './tick'
import { serialize, deserialize } from '../save/serialize'

describe('MVP-Loop Integration', () => {
  it('vollständiger Loop: Start → Ticks → Bauen → Ticks → Save → Load → identischer State', () => {
    // 1. Neues Spiel
    let state = createInitialState()
    expect(state.tick).toBe(0)
    expect(state.buildings).toHaveLength(0)

    // 2. 10 Ticks ohne Befehle — food sinkt durch Basis-Verbrauch (-0.2/Tick)
    const foodStart = state.resources['food']
    for (let i = 0; i < 10; i++) {
      state = tick(state, [])
    }
    expect(state.tick).toBe(10)
    expect(state.resources['food']).toBeLessThan(foodStart)

    // 3. Rathaus platzieren (kostenlos, 2×2)
    state = tick(state, [{ type: 'build', buildingId: 'townhall', col: 5, row: 5 }])
    expect(state.tick).toBe(11)
    expect(state.buildings).toHaveLength(1)
    expect(state.buildings[0].buildingId).toBe('townhall')

    // 4. 5 weitere Ticks — Gold steigt durch Rathaus (+0.5/Tick)
    const goldBeforeLoop = state.resources['gold']
    for (let i = 0; i < 5; i++) {
      state = tick(state, [])
    }
    expect(state.tick).toBe(16)
    expect(state.resources['gold']).toBeGreaterThan(goldBeforeLoop)

    // 5. Sägewerk bauen (Kosten: Holz 20, Stein 5)
    state = tick(state, [{ type: 'build', buildingId: 'lumbermill', col: 0, row: 0 }])
    expect(state.tick).toBe(17)
    expect(state.buildings).toHaveLength(2)

    // 6. 5 weitere Ticks — Holzproduktion durch Sägewerk (+2.0/Tick)
    for (let i = 0; i < 5; i++) {
      state = tick(state, [])
    }
    expect(state.tick).toBe(22)

    // 7. Serialisieren → Deserialisieren → identischer Zustand
    const saveFile = serialize(state)
    expect(typeof saveFile.version).toBe('number')
    expect(typeof saveFile.savedAt).toBe('string')

    const restoredState = deserialize(saveFile)
    expect(restoredState).toEqual(state)

    // 8. Simulation nach dem Laden deterministisch identisch
    const nextOriginal = tick(state, [])
    const nextRestored = tick(restoredState, [])
    expect(JSON.stringify(nextOriginal)).toBe(JSON.stringify(nextRestored))
  })

  it('Ressourcen werden nie negativ (auch nach vielen Ticks ohne Nahrungsproduktion)', () => {
    let state = createInitialState()
    // food startet bei 100, BASE_RATE -0.2/Tick → nach 500 Ticks bereits bei 0
    for (let i = 0; i < 700; i++) {
      state = tick(state, [])
    }
    for (const [, val] of Object.entries(state.resources)) {
      expect(val).toBeGreaterThanOrEqual(0)
    }
  })

  it('Kollisionserkennung: zweites Gebäude auf belegtem Feld schlägt fehl', () => {
    let state = createInitialState()
    // Rathaus belegt 2×2 ab (5,5)
    state = tick(state, [{ type: 'build', buildingId: 'townhall', col: 5, row: 5 }])
    expect(state.buildings).toHaveLength(1)

    // Sägewerk auf (5,5) versuchen → Kollision
    state = tick(state, [{ type: 'build', buildingId: 'lumbermill', col: 5, row: 5 }])
    expect(state.buildings).toHaveLength(1)
  })

  it('Bau schlägt fehl wenn Ressourcen fehlen, State bleibt unverändert', () => {
    const state: GameState = {
      tick: 0,
      resources: { wood: 0, stone: 0, food: 0, gold: 0 },
      buildings: [],
    }
    // Sägewerk kostet wood:20, stone:5 — muss fehlschlagen
    const nextState = tick(state, [{ type: 'build', buildingId: 'lumbermill', col: 0, row: 0 }])
    expect(nextState.buildings).toHaveLength(0)
  })

  it('Determinismus: zwei identische Läufe mit build-Befehlen ergeben identischen End-State', () => {
    const buildCommands = [{ type: 'build' as const, buildingId: 'townhall', col: 5, row: 5 }]

    function runSimulation(): GameState {
      let s = createInitialState()
      // 5 Ticks ohne Gebäude
      for (let i = 0; i < 5; i++) {
        s = tick(s, [])
      }
      // Rathaus bauen
      s = tick(s, buildCommands)
      // 10 weitere Ticks
      for (let i = 0; i < 10; i++) {
        s = tick(s, [])
      }
      // Farm bauen (2×2, kostet Holz:15)
      s = tick(s, [{ type: 'build', buildingId: 'farm', col: 10, row: 10 }])
      // 10 abschließende Ticks
      for (let i = 0; i < 10; i++) {
        s = tick(s, [])
      }
      return s
    }

    const state1 = runSimulation()
    const state2 = runSimulation()

    expect(JSON.stringify(state1)).toBe(JSON.stringify(state2))
  })

  it('Ressourcen überschreiten nie die Lagerkapazität', () => {
    // Alle Gebäude bauen und lange simulieren → Kapazitätsgrenzen müssen halten
    let state = createInitialState()
    // Rathaus platzieren (2×2)
    state = tick(state, [{ type: 'build', buildingId: 'townhall', col: 0, row: 0 }])
    // Sägewerk (1×1)
    state = tick(state, [{ type: 'build', buildingId: 'lumbermill', col: 3, row: 0 }])
    // Steinbruch (1×1)
    state = tick(state, [{ type: 'build', buildingId: 'quarry', col: 5, row: 0 }])

    for (let i = 0; i < 1000; i++) {
      state = tick(state, [])
    }

    // Kapazitätsgrenzen: wood≤500, stone≤300, food≤400, gold≤1000
    expect(state.resources['wood']).toBeLessThanOrEqual(500)
    expect(state.resources['stone']).toBeLessThanOrEqual(300)
    expect(state.resources['food']).toBeLessThanOrEqual(400)
    expect(state.resources['gold']).toBeLessThanOrEqual(1000)
  })
})
