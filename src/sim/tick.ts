import type { GameState } from './state'
import type { Command } from './commands'
import { applyCommand } from './commands'
import { applyProduction } from './production'

/**
 * Pure function: processes all commands for one tick and returns a new GameState.
 * The input state is never mutated.
 * Order per tick:
 *   1. Apply all commands in sequence.
 *   2. Apply passive production (resources gained/consumed).
 *   3. Increment tick counter.
 */
export function tick(state: GameState, commands: Command[]): GameState {
  let next: GameState = state
  for (const command of commands) {
    next = applyCommand(next, command)
  }
  next = applyProduction(next)
  return { ...next, buildings: [...next.buildings], tick: next.tick + 1 }
}
