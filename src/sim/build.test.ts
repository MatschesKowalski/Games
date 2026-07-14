import { describe, it, expect } from 'vitest'
import { applyCommand } from './commands'
import { applyProduction } from './production'
import { tick } from './tick'
import type { GameState } from './state'
import type { Command } from './commands'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 0,
    resources: { wood: 200, stone: 100, food: 100, gold: 50 },
    buildings: [],
    units: [],
    ...overrides,
  }
}

describe('build command — Platzierung', () => {
  it('Gebäude lässt sich auf freiem Feld platzieren', () => {
    const state = makeState()
    const cmd: Command = { type: 'build', buildingId: 'lumbermill', col: 3, row: 4 }
    const next = applyCommand(state, cmd)
    expect(next.buildings).toHaveLength(1)
    expect(next.buildings[0].buildingId).toBe('lumbermill')
    expect(next.buildings[0].col).toBe(3)
    expect(next.buildings[0].row).toBe(4)
  })

  it('Gebäude-ID ist deterministisch (kein crypto.randomUUID)', () => {
    const state = makeState()
    const cmd: Command = { type: 'build', buildingId: 'lumbermill', col: 5, row: 2 }
    const next = applyCommand(state, cmd)
    expect(next.buildings[0].id).toBe('lumbermill-5-2')
  })

  it('Baukosten werden korrekt abgezogen', () => {
    // lumbermill costs: wood 5, gold 15
    const state = makeState({ resources: { wood: 50, stone: 0, food: 100, gold: 50 } })
    const cmd: Command = { type: 'build', buildingId: 'lumbermill', col: 0, row: 0 }
    const next = applyCommand(state, cmd)
    expect(next.resources['wood']).toBe(45)   // 50 - 5
    expect(next.resources['gold']).toBe(35)   // 50 - 15
    expect(next.resources['food']).toBe(100)  // unverändert
  })

  it('unbekannte buildingId → State unverändert', () => {
    const state = makeState()
    const before = JSON.stringify(state)
    const cmd: Command = { type: 'build', buildingId: 'nonexistent', col: 0, row: 0 }
    const next = applyCommand(state, cmd)
    expect(JSON.stringify(next)).toBe(before)
  })

  it('mutiert den Eingabe-State NICHT', () => {
    const state = makeState()
    const before = JSON.stringify(state)
    applyCommand(state, { type: 'build', buildingId: 'lumbermill', col: 0, row: 0 })
    expect(JSON.stringify(state)).toBe(before)
  })
})

describe('build command — Kollisionsprüfung', () => {
  it('Kollision verhindert Platzierung auf belegtem Feld', () => {
    const state = makeState()
    // Erst ein Gebäude platzieren
    const first = applyCommand(state, { type: 'build', buildingId: 'lumbermill', col: 2, row: 2 })
    expect(first.buildings).toHaveLength(1)
    // Zweites Gebäude an exakt derselben Stelle
    const second = applyCommand(first, { type: 'build', buildingId: 'quarry', col: 2, row: 2 })
    expect(second.buildings).toHaveLength(1) // State unverändert
  })

  it('zwei Gebäude können nebeneinander stehen (keine Kollision)', () => {
    const state = makeState()
    const after1 = applyCommand(state, { type: 'build', buildingId: 'lumbermill', col: 0, row: 0 })
    const after2 = applyCommand(after1, { type: 'build', buildingId: 'quarry', col: 1, row: 0 })
    expect(after2.buildings).toHaveLength(2)
  })

  it('2×2-Gebäude (farm) belegt korrekt 4 Felder — Kollision mit einzelner Kachel davon', () => {
    const state = makeState()
    // Farm bei (0,0) belegt Felder (0,0), (1,0), (0,1), (1,1)
    const withFarm = applyCommand(state, { type: 'build', buildingId: 'farm', col: 0, row: 0 })
    expect(withFarm.buildings).toHaveLength(1)

    // Lumbermill auf (1,1) — liegt innerhalb des farm-Footprints
    const overlap = applyCommand(withFarm, { type: 'build', buildingId: 'lumbermill', col: 1, row: 1 })
    expect(overlap.buildings).toHaveLength(1) // geblockt

    // Lumbermill auf (2,0) — liegt außerhalb
    const noOverlap = applyCommand(withFarm, { type: 'build', buildingId: 'lumbermill', col: 2, row: 0 })
    expect(noOverlap.buildings).toHaveLength(2) // erlaubt
  })

  it('2×2-Gebäude kann nicht auf ein bestehendes 1×1-Gebäude platziert werden', () => {
    const state = makeState()
    // Lumbermill bei (1,1)
    const withLumber = applyCommand(state, { type: 'build', buildingId: 'lumbermill', col: 1, row: 1 })
    // Farm bei (0,0) würde Felder (0,0),(1,0),(0,1),(1,1) belegen → Kollision bei (1,1)
    const blocked = applyCommand(withLumber, { type: 'build', buildingId: 'farm', col: 0, row: 0 })
    expect(blocked.buildings).toHaveLength(1) // geblockt
  })
})

describe('build command — Ressourcenprüfung', () => {
  it('zu wenig Ressourcen → State unverändert', () => {
    // lumbermill costs wood 5, gold 15 — wir haben nur gold 0
    const state = makeState({ resources: { wood: 50, stone: 0, food: 0, gold: 0 } })
    const before = JSON.stringify(state)
    const next = applyCommand(state, { type: 'build', buildingId: 'lumbermill', col: 0, row: 0 })
    expect(JSON.stringify(next)).toBe(before)
  })

  it('exakt genug Ressourcen → Platzierung erfolgreich', () => {
    // lumbermill: wood 5, gold 15
    const state = makeState({ resources: { wood: 5, stone: 0, food: 0, gold: 15 } })
    const next = applyCommand(state, { type: 'build', buildingId: 'lumbermill', col: 0, row: 0 })
    expect(next.buildings).toHaveLength(1)
    expect(next.resources['wood']).toBe(0)
    expect(next.resources['gold']).toBe(0)
  })

  it('kostenloses Gebäude (townhall) wird ohne Ressourcenabzug platziert', () => {
    const state = makeState({ resources: { wood: 0, stone: 0, food: 0, gold: 0 } })
    const next = applyCommand(state, { type: 'build', buildingId: 'townhall', col: 0, row: 0 })
    expect(next.buildings).toHaveLength(1)
    expect(next.resources['wood']).toBe(0)
  })
})

describe('build command — Produktionsintegration', () => {
  it('Gebäude beeinflusst ab nächstem Tick die Produktion', () => {
    const state = makeState({ resources: { wood: 50, stone: 0, food: 100, gold: 50 } })
    // Ohne Gebäude: Holz bleibt bei 50
    const noBuilding = applyProduction(state)
    expect(noBuilding.resources['wood']).toBe(50)

    // Mit Sägewerk: Holz steigt um 1.0
    const withLumber = applyCommand(state, { type: 'build', buildingId: 'lumbermill', col: 0, row: 0 })
    const afterProd = applyProduction(withLumber)
    expect(afterProd.resources['wood']).toBe(46) // (50 - 5) + 1.0
  })

  it('mehrere Gebäude addieren ihre Effekte', () => {
    const state = makeState({ resources: { wood: 100, stone: 0, food: 100, gold: 100 } })
    const after1 = applyCommand(state, { type: 'build', buildingId: 'lumbermill', col: 0, row: 0 })
    const after2 = applyCommand(after1, { type: 'build', buildingId: 'lumbermill', col: 1, row: 0 })
    // 2 Sägewerke: wood -= 5 + 5 = 10 Kosten → 90 verbleibend, dann +2.0/Tick
    const afterProd = applyProduction(after2)
    expect(afterProd.resources['wood']).toBe(92) // (100 - 10) + 2.0
  })
})

describe('Determinismus', () => {
  it('identische build-Befehlsfolge → identischer End-State', () => {
    function runSequence(): GameState {
      const cmds: Command[] = [
        { type: 'build', buildingId: 'townhall', col: 0, row: 0 },
        { type: 'build', buildingId: 'lumbermill', col: 2, row: 0 },
        { type: 'build', buildingId: 'quarry', col: 3, row: 0 },
        { type: 'build', buildingId: 'farm', col: 0, row: 2 },
        { type: 'noop' },
      ]
      let state = makeState()
      for (const cmd of cmds) {
        state = tick(state, [cmd])
      }
      return state
    }

    const result1 = runSequence()
    const result2 = runSequence()
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('verschiedene Reihenfolge bei nicht-überlappenden Gebäuden → gleiche Gebäudeliste (nach Sortierung)', () => {
    const base = makeState()
    const order1 = applyCommand(
      applyCommand(base, { type: 'build', buildingId: 'lumbermill', col: 0, row: 0 }),
      { type: 'build', buildingId: 'quarry', col: 1, row: 0 },
    )
    const order2 = applyCommand(
      applyCommand(base, { type: 'build', buildingId: 'quarry', col: 1, row: 0 }),
      { type: 'build', buildingId: 'lumbermill', col: 0, row: 0 },
    )
    // Gleiche Gebäude, möglicherweise unterschiedliche Reihenfolge in buildings[]
    const sort = (s: GameState) => [...s.buildings].sort((a, b) => a.id.localeCompare(b.id))
    expect(sort(order1)).toEqual(sort(order2))
  })
})
