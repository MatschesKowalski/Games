import { describe, it, expect } from 'vitest'
import { applyProduction } from './production'
import { tick } from './tick'
import type { GameState } from './state'
import type { Command } from './commands'
import { RESOURCES } from '../content/resources'

type PartialBuilding = { id: string; buildingId: string; col: number; row: number }

function makeState(
  overrides: Record<string, number> = {},
  buildings: PartialBuilding[] = [],
): GameState {
  const resources: Record<string, number> = {}
  for (const def of RESOURCES) {
    resources[def.id] = def.startValue
  }
  return {
    tick: 0,
    resources: { ...resources, ...overrides },
    buildings,
  }
}

/** Helper: single placed building without caring about collision */
function placed(buildingId: string, col = 0, row = 0): PartialBuilding {
  return { id: `${buildingId}-${col}-${row}`, buildingId, col, row }
}

describe('applyProduction', () => {
  it('Holz steigt pro Tick durch Sägewerk (lumbermill = +2.0/Tick)', () => {
    const state = makeState({ wood: 50 }, [placed('lumbermill')])
    const next = applyProduction(state)
    expect(next.resources['wood']).toBe(52)
  })

  it('Stein steigt pro Tick durch Steinbruch (quarry = +1.5/Tick)', () => {
    const state = makeState({ stone: 30 }, [placed('quarry')])
    const next = applyProduction(state)
    expect(next.resources['stone']).toBe(31.5)
  })

  it('Nahrung sinkt pro Tick um 0.2 (Bevölkerungsverbrauch — kein Gebäude nötig)', () => {
    const state = makeState({ food: 100 })
    const next = applyProduction(state)
    expect(next.resources['food']).toBeCloseTo(99.8)
  })

  it('Gold steigt pro Tick durch Rathaus (townhall = +0.5/Tick)', () => {
    const state = makeState({ gold: 20 }, [placed('townhall')])
    const next = applyProduction(state)
    expect(next.resources['gold']).toBeCloseTo(20.5)
  })

  it('Ressourcen akkumulieren sich korrekt über mehrere Ticks', () => {
    let state = makeState({ wood: 50 }, [placed('lumbermill')])
    for (let i = 0; i < 10; i++) {
      state = applyProduction(state)
    }
    expect(state.resources['wood']).toBe(70) // 50 + 10 * 2.0
  })

  it('Nahrung wird NICHT negativ — bleibt bei 0', () => {
    let state = makeState({ food: 0 })
    for (let i = 0; i < 100; i++) {
      state = applyProduction(state)
    }
    expect(state.resources['food']).toBe(0)
  })

  it('Holz überschreitet NICHT die Kapazität', () => {
    const woodCapacity = RESOURCES.find(r => r.id === 'wood')!.capacity // 500
    let state = makeState({ wood: woodCapacity }, [placed('lumbermill')])
    for (let i = 0; i < 50; i++) {
      state = applyProduction(state)
    }
    expect(state.resources['wood']).toBe(woodCapacity)
    expect(state.resources['wood']).toBeLessThanOrEqual(woodCapacity)
  })

  it('Kapazitäts-Kappung gilt für alle Ressourcen', () => {
    // Alle Ressourcen auf Maximum setzen, danach mehrere Ticks laufen lassen
    const overrides: Record<string, number> = {}
    for (const def of RESOURCES) {
      overrides[def.id] = def.capacity
    }
    // Gebäude würden produzieren, aber alles ist schon voll
    let state = makeState(overrides, [placed('lumbermill'), placed('quarry', 2, 0)])
    for (let i = 0; i < 10; i++) {
      state = applyProduction(state)
    }
    for (const def of RESOURCES) {
      expect(state.resources[def.id]).toBeLessThanOrEqual(def.capacity)
    }
  })

  it('mutiert den Eingabe-State NICHT', () => {
    const state = makeState()
    const before = JSON.stringify(state)
    applyProduction(state)
    expect(JSON.stringify(state)).toBe(before)
  })

  it('ohne Gebäude ändert sich nur die Nahrung (Basisverbrauch)', () => {
    const state = makeState({ wood: 50, stone: 30, gold: 20, food: 100 })
    const next = applyProduction(state)
    expect(next.resources['wood']).toBe(50)   // kein Gebäude → kein Zuwachs
    expect(next.resources['stone']).toBe(30)  // kein Gebäude → kein Zuwachs
    expect(next.resources['gold']).toBe(20)   // kein Gebäude → kein Zuwachs
    expect(next.resources['food']).toBeCloseTo(99.8) // Basisverbrauch bleibt
  })
})

describe('Produktion in tick()', () => {
  const noopCommands: Command[] = [{ type: 'noop' }]

  it('Holz wächst wenn tick() mit Sägewerk aufgerufen wird', () => {
    const state = makeState({ wood: 50 }, [placed('lumbermill')])
    const next = tick(state, noopCommands)
    expect(next.resources['wood']).toBe(52)
  })

  it('Nahrung sinkt wenn tick() aufgerufen wird (auch ohne Gebäude)', () => {
    const state = makeState({ food: 10 })
    const next = tick(state, noopCommands)
    expect(next.resources['food']).toBeCloseTo(9.8)
  })

  it('Determinismus: gleicher Start + gleiche Befehle → gleicher End-State nach N Ticks', () => {
    const N = 50
    const commands: Command[] = [{ type: 'noop' }]

    let state1 = makeState({}, [placed('lumbermill')])
    let state2 = makeState({}, [placed('lumbermill')])

    for (let i = 0; i < N; i++) {
      state1 = tick(state1, commands)
      state2 = tick(state2, commands)
    }

    expect(JSON.stringify(state1)).toBe(JSON.stringify(state2))
  })
})
