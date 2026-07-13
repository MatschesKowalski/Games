import type { GameState } from './state'

/**
 * Command — describes a player or game action for one tick.
 * Will be extended in Task 7 (build, move, etc.).
 */
export type Command = { type: 'noop' }

/**
 * Pure function: applies a single command and returns a new GameState.
 * The input state is never mutated.
 */
export function applyCommand(state: GameState, command: Command): GameState {
  switch (command.type) {
    case 'noop':
      return state
    default: {
      // Exhaustiveness guard — TypeScript will catch unhandled command types here.
      const unhandled: never = command
      throw new Error(`Unbekannter Befehlstyp: ${JSON.stringify(unhandled)}`)
    }
  }
}
