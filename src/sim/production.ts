import type { GameState } from './state'
import { RESOURCES } from '../content/resources'
import { getBuildingDef } from '../content/buildings'

/**
 * Base rates that apply regardless of buildings.
 * food: -0.2  (population consumption — not produced by any building)
 */
const BASE_RATES: Record<string, number> = {
  food: -0.2,
}

/**
 * Pure function: applies one tick of production to the given state.
 * Returns a new GameState with updated resources.
 *
 * Production = base rates (e.g. food consumption) + sum of building effects.
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

  // Accumulate total rates: base rates + effects from all placed buildings
  const totalRates: Record<string, number> = { ...BASE_RATES }
  for (const building of state.buildings) {
    const def = getBuildingDef(building.buildingId)
    if (!def) continue
    for (const effect of def.effects) {
      totalRates[effect.resourceId] = (totalRates[effect.resourceId] ?? 0) + effect.ratePerTick
    }
  }

  const nextResources: Record<string, number> = { ...state.resources }

  for (const def of RESOURCES) {
    const rate = totalRates[def.id] ?? 0
    if (rate === 0) continue

    const current = nextResources[def.id] ?? 0
    const raw = current + rate
    const capped = Math.min(capacityMap[def.id], Math.max(0, raw))
    nextResources[def.id] = capped
  }

  return { ...state, resources: nextResources }
}
