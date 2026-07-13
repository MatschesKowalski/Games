import { describe, it, expect } from 'vitest'
import { createRng } from './rng'

describe('createRng (Mulberry32)', () => {
  it('gleicher Seed liefert immer dieselbe Zahlenfolge', () => {
    const rng1 = createRng(42)
    const rng2 = createRng(42)
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2())
    }
  })

  it('verschiedene Seeds liefern verschiedene Sequenzen', () => {
    const rng1 = createRng(1)
    const rng2 = createRng(2)
    const seq1 = Array.from({ length: 20 }, () => rng1())
    const seq2 = Array.from({ length: 20 }, () => rng2())
    expect(seq1).not.toEqual(seq2)
  })

  it('alle Werte liegen in [0, 1)', () => {
    const rng = createRng(99999)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('Sequenz-Zustand schreitet fort (keine konstante Ausgabe)', () => {
    const rng = createRng(7)
    const values = new Set(Array.from({ length: 50 }, () => rng()))
    // Bei 50 Werten in [0,1) aus einem guten PRNG sind Duplikate extrem unwahrscheinlich
    expect(values.size).toBeGreaterThan(40)
  })
})
