import { describe, it, expect } from 'vitest'
import { applyCommand } from './commands'
import { BUILDINGS } from '../content/buildings'
import type { GameState } from './state'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 0,
    resources: { wood: 500, stone: 200, food: 100, gold: 1000 },
    buildings: [],
    units: [],
    ...overrides,
  }
}

const barracks = { id: 'barracks-5-5', buildingId: 'barracks', col: 5, row: 5 }

describe('Defensive Gebäude — Katalog', () => {
  it('wall (Holzmauer) ist im Gebäude-Katalog', () => {
    expect(BUILDINGS.some(b => b.id === 'wall')).toBe(true)
  })

  it('stone_wall (Steinmauer) ist im Gebäude-Katalog', () => {
    expect(BUILDINGS.some(b => b.id === 'stone_wall')).toBe(true)
  })

  it('watchtower (Wachturm) ist im Gebäude-Katalog', () => {
    expect(BUILDINGS.some(b => b.id === 'watchtower')).toBe(true)
  })

  it('gate (Burgtor) ist im Gebäude-Katalog', () => {
    expect(BUILDINGS.some(b => b.id === 'gate')).toBe(true)
  })

  it('Burgtor hat Baukosten (Holz + Stein + Gold)', () => {
    const gate = BUILDINGS.find(b => b.id === 'gate')!
    expect(gate.cost['wood']).toBeGreaterThan(0)
    expect(gate.cost['stone']).toBeGreaterThan(0)
    expect(gate.cost['gold']).toBeGreaterThan(0)
  })
})

describe('Defensive Gebäude — Bau', () => {
  it('Holzmauer lässt sich bauen', () => {
    const next = applyCommand(makeState(), { type: 'build', buildingId: 'wall', col: 3, row: 3 })
    expect(next.buildings.some(b => b.buildingId === 'wall')).toBe(true)
  })

  it('Steinmauer lässt sich bauen', () => {
    const next = applyCommand(makeState(), { type: 'build', buildingId: 'stone_wall', col: 3, row: 3 })
    expect(next.buildings.some(b => b.buildingId === 'stone_wall')).toBe(true)
  })

  it('Wachturm lässt sich bauen', () => {
    const next = applyCommand(makeState(), { type: 'build', buildingId: 'watchtower', col: 4, row: 4 })
    expect(next.buildings.some(b => b.buildingId === 'watchtower')).toBe(true)
  })

  it('Burgtor lässt sich bauen', () => {
    const next = applyCommand(makeState(), { type: 'build', buildingId: 'gate', col: 3, row: 3 })
    expect(next.buildings.some(b => b.buildingId === 'gate')).toBe(true)
  })

  it('Mauern können in einer Reihe nebeneinander stehen', () => {
    let s = makeState()
    s = applyCommand(s, { type: 'build', buildingId: 'wall', col: 2, row: 4 })
    s = applyCommand(s, { type: 'build', buildingId: 'wall', col: 3, row: 4 })
    s = applyCommand(s, { type: 'build', buildingId: 'wall', col: 4, row: 4 })
    expect(s.buildings.filter(b => b.buildingId === 'wall')).toHaveLength(3)
  })

  it('Mauer + Burgtor können nebeneinander gebaut werden', () => {
    let s = makeState()
    s = applyCommand(s, { type: 'build', buildingId: 'wall', col: 2, row: 4 })
    s = applyCommand(s, { type: 'build', buildingId: 'gate', col: 3, row: 4 })
    s = applyCommand(s, { type: 'build', buildingId: 'wall', col: 4, row: 4 })
    expect(s.buildings).toHaveLength(3)
  })
})

describe('Mauern blockieren Felder', () => {
  it('Einheit kann nicht auf Holzmauer-Feld platziert werden', () => {
    let s = makeState({ buildings: [barracks] })
    s = applyCommand(s, { type: 'build', buildingId: 'wall', col: 3, row: 3 })
    const result = applyCommand(s, { type: 'recruit', unitTypeId: 'swordsman', col: 3, row: 3 })
    expect(result.units).toHaveLength(0)
  })

  it('Einheit kann nicht auf Steinmauer-Feld platziert werden', () => {
    let s = makeState({ buildings: [barracks] })
    s = applyCommand(s, { type: 'build', buildingId: 'stone_wall', col: 3, row: 3 })
    const result = applyCommand(s, { type: 'recruit', unitTypeId: 'swordsman', col: 3, row: 3 })
    expect(result.units).toHaveLength(0)
  })

  it('Einheit kann nicht auf Burgtor-Feld platziert werden', () => {
    let s = makeState({ buildings: [barracks] })
    s = applyCommand(s, { type: 'build', buildingId: 'gate', col: 3, row: 3 })
    const result = applyCommand(s, { type: 'recruit', unitTypeId: 'swordsman', col: 3, row: 3 })
    expect(result.units).toHaveLength(0)
  })

  it('Einheit kann neben einer Mauer platziert werden', () => {
    let s = makeState({ buildings: [barracks] })
    s = applyCommand(s, { type: 'build', buildingId: 'wall', col: 3, row: 3 })
    const result = applyCommand(s, { type: 'recruit', unitTypeId: 'swordsman', col: 4, row: 3 })
    expect(result.units).toHaveLength(1)
  })

  it('Mauer kann nicht auf belegtem Feld gebaut werden', () => {
    const s = makeState()
    const withMill = applyCommand(s, { type: 'build', buildingId: 'lumbermill', col: 2, row: 2 })
    const blocked = applyCommand(withMill, { type: 'build', buildingId: 'wall', col: 2, row: 2 })
    expect(blocked.buildings).toHaveLength(1)
  })
})

describe('Determinismus', () => {
  it('Mauer-Befehlsfolge ist deterministisch', () => {
    function run(): GameState {
      let s = makeState()
      s = applyCommand(s, { type: 'build', buildingId: 'wall', col: 1, row: 5 })
      s = applyCommand(s, { type: 'build', buildingId: 'wall', col: 2, row: 5 })
      s = applyCommand(s, { type: 'build', buildingId: 'gate', col: 3, row: 5 })
      s = applyCommand(s, { type: 'build', buildingId: 'watchtower', col: 0, row: 4 })
      return s
    }
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()))
  })
})
