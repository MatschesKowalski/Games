import type { GameState } from './state'
import { getBuildingDef } from '../content/buildings'

/**
 * Command — describes a player or game action for one tick.
 */
export type BuildCommand = { type: 'build'; buildingId: string; col: number; row: number }
export type Command = { type: 'noop' } | BuildCommand

/**
 * Pure function: applies a single command and returns a new GameState.
 * The input state is never mutated.
 *
 * 'build' rules:
 *   1. Unknown buildingId → state unchanged
 *   2. Collision (any occupied cell of new building overlaps existing) → state unchanged
 *   3. Insufficient resources for cost → state unchanged
 *   4. Otherwise: deduct costs, add building with deterministic id
 */
export function applyCommand(state: GameState, command: Command): GameState {
  switch (command.type) {
    case 'noop':
      return state

    case 'build': {
      const def = getBuildingDef(command.buildingId)
      if (!def) return state

      // All cells the new building would occupy
      const newCells: Array<{ col: number; row: number }> = []
      for (let dc = 0; dc < def.size.cols; dc++) {
        for (let dr = 0; dr < def.size.rows; dr++) {
          newCells.push({ col: command.col + dc, row: command.row + dr })
        }
      }

      // Collision check against every cell of every existing building
      for (const existing of state.buildings) {
        const eDef = getBuildingDef(existing.buildingId)
        const eCols = eDef?.size.cols ?? 1
        const eRows = eDef?.size.rows ?? 1
        for (let dc = 0; dc < eCols; dc++) {
          for (let dr = 0; dr < eRows; dr++) {
            const ec = existing.col + dc
            const er = existing.row + dr
            if (newCells.some(c => c.col === ec && c.row === er)) {
              return state // Collision — placement denied
            }
          }
        }
      }

      // Resource check
      for (const [resourceId, required] of Object.entries(def.cost)) {
        if ((state.resources[resourceId] ?? 0) < required) {
          return state // Insufficient resources
        }
      }

      // Deduct costs
      const nextResources = { ...state.resources }
      for (const [resourceId, amount] of Object.entries(def.cost)) {
        nextResources[resourceId] = (nextResources[resourceId] ?? 0) - amount
      }

      // Add building with deterministic id (no crypto.randomUUID)
      const newBuilding = {
        id: `${command.buildingId}-${command.col}-${command.row}`,
        buildingId: command.buildingId,
        col: command.col,
        row: command.row,
      }

      return {
        ...state,
        resources: nextResources,
        buildings: [...state.buildings, newBuilding],
      }
    }

    default: {
      // Exhaustiveness guard — TypeScript will catch unhandled command types here.
      const unhandled: never = command
      throw new Error(`Unbekannter Befehlstyp: ${JSON.stringify(unhandled)}`)
    }
  }
}
