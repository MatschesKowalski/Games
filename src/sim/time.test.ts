import { describe, it, expect } from 'vitest'
import { getTimeOfDay, TICKS_PER_DAY, TICKS_PER_PHASE } from './time'

describe('getTimeOfDay', () => {
  it('Tick 0 ist Tag', () => {
    expect(getTimeOfDay(0).phase).toBe('day')
  })

  it('Mitte des Tages ist noch Tag', () => {
    expect(getTimeOfDay(TICKS_PER_PHASE - 1).phase).toBe('day')
  })

  it('Beginn der Nacht', () => {
    expect(getTimeOfDay(TICKS_PER_PHASE).phase).toBe('night')
  })

  it('Ende der Nacht, vor neuem Tag', () => {
    expect(getTimeOfDay(TICKS_PER_DAY - 1).phase).toBe('night')
  })

  it('Zyklus wiederholt sich nach TICKS_PER_DAY', () => {
    expect(getTimeOfDay(TICKS_PER_DAY).phase).toBe('day')
    expect(getTimeOfDay(TICKS_PER_DAY + TICKS_PER_PHASE).phase).toBe('night')
  })

  it('progress liegt immer zwischen 0 und 1', () => {
    for (let tick = 0; tick < TICKS_PER_DAY * 2; tick++) {
      const { progress } = getTimeOfDay(tick)
      expect(progress).toBeGreaterThanOrEqual(0)
      expect(progress).toBeLessThan(1)
    }
  })

  it('progress am Beginn einer Phase ist 0', () => {
    expect(getTimeOfDay(0).progress).toBe(0)
    expect(getTimeOfDay(TICKS_PER_PHASE).progress).toBe(0)
  })

  it('funktioniert auch mit negativen Ticks (Determinismus)', () => {
    const info = getTimeOfDay(-TICKS_PER_DAY)
    expect(info.phase).toBe('day')
    expect(info.progress).toBe(0)
  })
})
