import { describe, it, expect } from 'vitest'
import { applyCommand } from './commands'
import type { GameState } from './state'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 0,
    resources: { wood: 200, stone: 100, food: 100, gold: 500 },
    buildings: [],
    units: [],
    ...overrides,
  }
}

const barracks = { id: 'barracks-0-0', buildingId: 'barracks', col: 0, row: 0 }

describe('recruit command — Grundlagen', () => {
  it('Einheit wird ohne Kaserne NICHT rekrutiert', () => {
    const state = makeState()
    const next = applyCommand(state, { type: 'recruit', unitTypeId: 'swordsman', col: 5, row: 5 })
    expect(next.units).toHaveLength(0)
    expect(JSON.stringify(next)).toBe(JSON.stringify(state))
  })

  it('unbekannte unitTypeId → State unverändert', () => {
    const state = makeState({ buildings: [barracks] })
    const before = JSON.stringify(state)
    const next = applyCommand(state, { type: 'recruit', unitTypeId: 'dragon', col: 5, row: 5 })
    expect(JSON.stringify(next)).toBe(before)
  })

  it('zu wenig Ressourcen → State unverändert (swordsman kostet 80 Gold)', () => {
    const state = makeState({ resources: { wood: 10, stone: 10, food: 10, gold: 0 }, buildings: [barracks] })
    const before = JSON.stringify(state)
    const next = applyCommand(state, { type: 'recruit', unitTypeId: 'swordsman', col: 5, row: 5 })
    expect(JSON.stringify(next)).toBe(before)
  })

  it('Einheit wird mit Kaserne und genug Ressourcen platziert', () => {
    const state = makeState({ buildings: [barracks] })
    const next = applyCommand(state, { type: 'recruit', unitTypeId: 'swordsman', col: 5, row: 5 })
    expect(next.units).toHaveLength(1)
    expect(next.units[0].typeId).toBe('swordsman')
    expect(next.units[0].col).toBe(5)
    expect(next.units[0].row).toBe(5)
    expect(next.units[0].side).toBe('player')
    expect(next.units[0].hp).toBeGreaterThan(0)
    expect(next.units[0].hp).toBe(next.units[0].maxHp)
  })

  it('Rekrutierungskosten werden abgezogen (swordsman: 80 Gold)', () => {
    const state = makeState({ resources: { wood: 10, stone: 10, food: 10, gold: 100 }, buildings: [barracks] })
    const next = applyCommand(state, { type: 'recruit', unitTypeId: 'swordsman', col: 5, row: 5 })
    expect(next.resources['gold']).toBe(20)
  })

  it('Einheit kann nicht auf belegtes Gebäude-Feld platziert werden', () => {
    const state = makeState({ buildings: [barracks] })
    // barracks belegt (0,0) — eigentlich 2×2, also auch (1,0), (0,1), (1,1)
    const next = applyCommand(state, { type: 'recruit', unitTypeId: 'swordsman', col: 0, row: 0 })
    expect(next.units).toHaveLength(0)
  })

  it('zwei Einheiten können nicht auf dasselbe Feld', () => {
    const state = makeState({ buildings: [barracks] })
    const after1 = applyCommand(state, { type: 'recruit', unitTypeId: 'swordsman', col: 5, row: 5 })
    expect(after1.units).toHaveLength(1)
    const after2 = applyCommand(after1, { type: 'recruit', unitTypeId: 'swordsman', col: 5, row: 5 })
    expect(after2.units).toHaveLength(1)
  })

  it('mehrere Einheiten auf verschiedenen Feldern möglich', () => {
    const state = makeState({ buildings: [barracks] })
    const after1 = applyCommand(state, { type: 'recruit', unitTypeId: 'swordsman', col: 5, row: 5 })
    const after2 = applyCommand(after1, { type: 'recruit', unitTypeId: 'musketeer', col: 6, row: 5 })
    expect(after2.units).toHaveLength(2)
  })

  it('Einheiten-ID ist deterministisch', () => {
    const state = makeState({ buildings: [barracks] })
    const next = applyCommand(state, { type: 'recruit', unitTypeId: 'swordsman', col: 3, row: 7 })
    expect(next.units[0].id).toBe('unit-swordsman-3-7-0')
  })
})

describe('recruit command — alle Einheitentypen', () => {
  const types = ['swordsman', 'cavalry', 'musketeer', 'cannoneer']
  for (const typeId of types) {
    it(`${typeId} rekrutierbar wenn Kaserne und Gold vorhanden`, () => {
      const state = makeState({ resources: { wood: 0, stone: 0, food: 0, gold: 1000 }, buildings: [barracks] })
      const next = applyCommand(state, { type: 'recruit', unitTypeId: typeId, col: 5, row: 5 })
      expect(next.units).toHaveLength(1)
      expect(next.units[0].typeId).toBe(typeId)
    })
  }
})

describe('Determinismus', () => {
  it('gleiche Befehlsfolge → gleicher State', () => {
    function run(): GameState {
      let s = makeState({ buildings: [barracks] })
      s = applyCommand(s, { type: 'recruit', unitTypeId: 'swordsman', col: 5, row: 5 })
      s = applyCommand(s, { type: 'recruit', unitTypeId: 'musketeer', col: 6, row: 5 })
      return s
    }
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()))
  })
})
