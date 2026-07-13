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
