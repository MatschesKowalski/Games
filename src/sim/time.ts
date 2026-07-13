export const TICKS_PER_DAY = 240
export const TICKS_PER_PHASE = TICKS_PER_DAY / 2

export type TimeOfDay = 'day' | 'night'

export type DayTimeInfo = {
  phase: TimeOfDay
  progress: number  // 0–1 innerhalb der aktuellen Phase
}

export function getTimeOfDay(tick: number): DayTimeInfo {
  const dayTick = ((tick % TICKS_PER_DAY) + TICKS_PER_DAY) % TICKS_PER_DAY
  const phase: TimeOfDay = dayTick < TICKS_PER_PHASE ? 'day' : 'night'
  const progress = (dayTick % TICKS_PER_PHASE) / TICKS_PER_PHASE
  return { phase, progress }
}
