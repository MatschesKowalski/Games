import { describe, it, expect } from 'vitest'
import { applyProduction } from './production'
import { tick } from './tick'
import type { GameState } from './state'
import type { Command } from './commands'
import { RESOURCES } from '../content/resources'

function makeState(overrides: Record<string, number> = {}): GameState {
  const resources: Record<string, number> = {}
  for (const def of RESOURCES) {
    resources[def.id] = def.startValue
  }
  return {
    tick: 0,
    resources: { ...resources, ...overrides },
    buildings: [],
  }
}

describe('applyProduction', () => {
  it('Holz steigt pro Tick um 1', () => {
    const state = makeState({ wood: 50 })
    const next = applyProduction(state)
    expect(next.resources['wood']).toBe(51)
  })

  it('Stein steigt pro Tick um 0.5', () => {
    const state = makeState({ stone: 30 })
    const next = applyProduction(state)
    expect(next.resources['stone']).toBe(30.5)
  })

  it('Nahrung sinkt pro Tick um 0.2 (Bevölkerungsverbrauch)', () => {
    const state = makeState({ food: 100 })
    const next = applyProduction(state)
    expect(next.resources['food']).toBeCloseTo(99.8)
  })

  it('Gold steigt pro Tick um 0.1', () => {
    const state = makeState({ gold: 20 })
    const next = applyProduction(state)
    expect(next.resources['gold']).toBeCloseTo(20.1)
  })

  it('Ressourcen akkumulieren sich korrekt über mehrere Ticks', () => {
    let state = makeState({ wood: 50 })
    for (let i = 0; i < 10; i++) {
      state = applyProduction(state)
    }
    expect(state.resources['wood']).toBe(60) // 50 + 10 * 1
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
    let state = makeState({ wood: woodCapacity })
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
    let state = makeState(overrides)
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
})

describe('Produktion in tick()', () => {
  const noopCommands: Command[] = [{ type: 'noop' }]

  it('Holz wächst wenn tick() aufgerufen wird', () => {
    const state = makeState({ wood: 50 })
    const next = tick(state, noopCommands)
    expect(next.resources['wood']).toBe(51)
  })

  it('Nahrung sinkt wenn tick() aufgerufen wird', () => {
    const state = makeState({ food: 10 })
    const next = tick(state, noopCommands)
    expect(next.resources['food']).toBeCloseTo(9.8)
  })

  it('Determinismus: gleicher Start + gleiche Befehle → gleicher End-State nach N Ticks', () => {
    const N = 50
    const commands: Command[] = [{ type: 'noop' }]

    let state1 = makeState()
    let state2 = makeState()

    for (let i = 0; i < N; i++) {
      state1 = tick(state1, commands)
      state2 = tick(state2, commands)
    }

    expect(JSON.stringify(state1)).toBe(JSON.stringify(state2))
  })
})
