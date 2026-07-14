import { describe, it, expect } from 'vitest'
import { serialize, deserialize } from './serialize'
import { CURRENT_VERSION } from './schema'
import type { GameState } from '../sim/state'

function makeState(): GameState {
  return {
    tick: 42,
    resources: { wood: 10, stone: 5, gold: 100 },
    buildings: [
      { id: 'b1', buildingId: 'townhall', col: 5, row: 3 },
    ],
    units: [],
  }
}

describe('serialize / deserialize', () => {
  it('Roundtrip: serialize → deserialize liefert äquivalenten GameState', () => {
    const state = makeState()
    const saveFile = serialize(state)
    const restored = deserialize(saveFile)
    expect(restored).toEqual(state)
  })

  it('SaveFile enthält version-Feld mit CURRENT_VERSION', () => {
    const saveFile = serialize(makeState())
    expect(saveFile.version).toBe(CURRENT_VERSION)
  })

  it('SaveFile enthält savedAt als gültigen ISO-String', () => {
    const saveFile = serialize(makeState())
    expect(typeof saveFile.savedAt).toBe('string')
    // ISO-Format muss reparseierbar sein und identisch zurückgeliefert werden
    expect(new Date(saveFile.savedAt).toISOString()).toBe(saveFile.savedAt)
  })

  it('deserialize mit leerem Objekt ({}) wirft Error', () => {
    expect(() => deserialize({})).toThrow()
  })

  it('deserialize mit null wirft Error', () => {
    expect(() => deserialize(null)).toThrow()
  })

  it('deserialize mit undefined wirft Error', () => {
    expect(() => deserialize(undefined)).toThrow()
  })

  it('deserialize mit Zahl (42) wirft Error', () => {
    expect(() => deserialize(42)).toThrow()
  })

  it('deserialize mit fehlendem state-Feld wirft Error', () => {
    expect(() => deserialize({ version: CURRENT_VERSION })).toThrow()
  })

  it('migrate() mit CURRENT_VERSION reicht State unverändert durch', () => {
    const state = makeState()
    const saveFile = serialize(state)
    // version === CURRENT_VERSION → migrate gibt SaveFile unverändert zurück
    // → deserialize liefert denselben State
    expect(saveFile.version).toBe(CURRENT_VERSION)
    const restored = deserialize(saveFile)
    expect(restored).toEqual(state)
  })
})
