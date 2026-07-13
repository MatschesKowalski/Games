import { createInitialResources } from '../content/resources'

export type Building = {
  id: string
  buildingId: string
  col: number
  row: number
}

export type GameState = {
  tick: number
  resources: Record<string, number>
  buildings: Building[]
}

/**
 * Creates a fresh GameState for a new game.
 * Resource start values come from src/content/resources.ts.
 */
export function createInitialState(): GameState {
  return { tick: 0, resources: createInitialResources(), buildings: [] }
}
