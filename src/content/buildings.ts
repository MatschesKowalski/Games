export type BuildingEffect = {
  resourceId: string
  ratePerTick: number // positive = production, negative = consumption
}

export type BuildingDef = {
  id: string
  i18nKey: string
  cost: Record<string, number>
  size: { cols: number; rows: number }
  effects: BuildingEffect[]
}

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'townhall',
    i18nKey: 'building.townhall.name',
    cost: {}, // Starting building — placed at game start, costs nothing
    size: { cols: 2, rows: 2 },
    effects: [{ resourceId: 'gold', ratePerTick: 0.5 }],
  },
  {
    id: 'lumbermill',
    i18nKey: 'building.lumbermill.name',
    cost: { wood: 20, stone: 5 },
    size: { cols: 1, rows: 1 },
    effects: [{ resourceId: 'wood', ratePerTick: 2.0 }],
  },
  {
    id: 'quarry',
    i18nKey: 'building.quarry.name',
    cost: { wood: 10, stone: 10 },
    size: { cols: 1, rows: 1 },
    effects: [{ resourceId: 'stone', ratePerTick: 1.5 }],
  },
  {
    id: 'farm',
    i18nKey: 'building.farm.name',
    cost: { wood: 15 },
    size: { cols: 2, rows: 2 },
    effects: [{ resourceId: 'food', ratePerTick: 1.0 }],
  },
]

export function getBuildingDef(id: string): BuildingDef | undefined {
  return BUILDINGS.find(b => b.id === id)
}
