import type { GameState } from './state'
import { RESOURCES } from '../content/resources'

/**
 * Placeholder production rates per tick.
 * Real per-building rates will be introduced in Task 7.
 *
 * wood  +1.0  (lumberjack placeholder)
 * stone +0.5  (quarry placeholder)
 * food  -0.2  (population consumption)
 * gold  +0.1  (trade placeholder)
 */
const PRODUCTION_RATES: Record<string, number> = {
  wood: 1.0,
  stone: 0.5,
  food: -0.2,
  gold: 0.1,
}

/**
 * Pure function: applies one tick of production to the given state.
 * Returns a new GameState with updated resources.
 *
 * Invariants:
 *   - resources are never below 0
 *   - resources never exceed the capacity defined in src/content/resources.ts
 *   - input state is never mutated
 */
export function applyProduction(state: GameState): GameState {
  const capacityMap: Record<string, number> = {}
  for (const def of RESOURCES) {
    capacityMap[def.id] = def.capacity
  }

  const nextResources: Record<string, number> = { ...state.resources }

  for (const def of RESOURCES) {
    const rate = PRODUCTION_RATES[def.id] ?? 0
    if (rate === 0) continue

    const current = nextResources[def.id] ?? 0
    const raw = current + rate
    const capped = Math.min(capacityMap[def.id], Math.max(0, raw))
    nextResources[def.id] = capped
  }

  return { ...state, resources: nextResources }
}
