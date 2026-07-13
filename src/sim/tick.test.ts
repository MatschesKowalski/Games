import { describe, it, expect } from 'vitest'
import { tick } from './tick'
import type { GameState } from './state'
import type { Command } from './commands'

// Hinweis: Math.random() darf in src/sim/ NIRGENDWO außerhalb von rng.ts verwendet werden.
// Diese Regel wird im Code-Review und per Architektur-Konvention durchgesetzt.

function makeState(tickNum = 0): GameState {
  return {
    tick: tickNum,
    resources: { wood: 10, stone: 5 },
    buildings: [],
  }
}

describe('tick', () => {
  it('mutiert den übergebenen State NICHT', () => {
    const state = makeState(3)
    const before = JSON.stringify(state)

    tick(state, [])

    expect(JSON.stringify(state)).toBe(before)
  })

  it('gibt ein neues Objekt zurück, nicht dasselbe', () => {
    const state = makeState()
    const next = tick(state, [])
    expect(next).not.toBe(state)
  })

  it('erhöht den tick-Zähler um 1', () => {
    const state = makeState(5)
    const next = tick(state, [])
    expect(next.tick).toBe(6)
  })

  it('erhöht den tick-Zähler über mehrere Ticks korrekt', () => {
    let state = makeState(0)
    for (let i = 0; i < 10; i++) {
      state = tick(state, [])
    }
    expect(state.tick).toBe(10)
  })

  it('verarbeitet noop-Befehle ohne Gebäude-Änderung (Ressourcen ändern sich durch Produktion)', () => {
    // Lumbermill und Quarry geben Holz/Stein, Basisrate verbraucht Nahrung
    const state: GameState = {
      tick: 0,
      resources: { wood: 10, stone: 5, food: 20, gold: 0 },
      buildings: [
        { id: 'lumbermill-0-0', buildingId: 'lumbermill', col: 0, row: 0 },
        { id: 'quarry-1-0', buildingId: 'quarry', col: 1, row: 0 },
      ],
    }
    const commands: Command[] = [{ type: 'noop' }, { type: 'noop' }]
    const next = tick(state, commands)
    expect(next.tick).toBe(1)
    // noop-Befehle dürfen keine Gebäude verändern
    expect(next.buildings).toEqual(state.buildings)
    // Ressourcen ändern sich durch passive Produktion (applyProduction läuft jeden Tick)
    expect(next.resources['wood']).toBe(12)    // 10 + 2.0 (lumbermill)
    expect(next.resources['stone']).toBe(6.5)  // 5 + 1.5 (quarry)
  })

  it('Determinismus: identischer Start + identische Befehle → identischer End-State', () => {
    const N = 50
    const commands: Command[] = [{ type: 'noop' }]

    let state1 = makeState(0)
    let state2 = makeState(0)

    for (let i = 0; i < N; i++) {
      state1 = tick(state1, commands)
      state2 = tick(state2, commands)
    }

    expect(JSON.stringify(state1)).toBe(JSON.stringify(state2))
  })
})
