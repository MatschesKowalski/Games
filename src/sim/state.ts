import { createInitialResources } from '../content/resources'

export type Building = {
  id: string
  buildingId: string
  col: number
  row: number
}

export type Unit = {
  id: string
  typeId: string
  col: number
  row: number
  hp: number
  maxHp: number
  side: 'player' | 'enemy'
}

export type GameState = {
  tick: number
  resources: Record<string, number>
  buildings: Building[]
  units: Unit[]
}

export function createInitialState(): GameState {
  return { tick: 0, resources: createInitialResources(), buildings: [], units: [] }
}
