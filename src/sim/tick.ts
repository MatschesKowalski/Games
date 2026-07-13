import type { GameState } from './state'
import type { Command } from './commands'
import { applyCommand } from './commands'

/**
 * Pure function: processes all commands for one tick and returns a new GameState.
 * The input state is never mutated.
 * Guarantees: tick counter increments by 1; resources are never negative (enforced
 * per command in later tasks).
 */
export function tick(state: GameState, commands: Command[]): GameState {
  let next: GameState = state
  for (const command of commands) {
    next = applyCommand(next, command)
  }
  return { ...next, buildings: [...next.buildings], tick: next.tick + 1 }
}
