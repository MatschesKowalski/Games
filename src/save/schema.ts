import type { GameState } from '../sim/state'

export const CURRENT_VERSION = 1

export type SaveFile = {
  version: number
  savedAt: string // ISO-Datum, z.B. "2024-01-01T12:00:00.000Z"
  state: GameState
}
