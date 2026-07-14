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

// Costs derived from Anno 1602 haeuser.cod (via assets/data/buildings-raw.json).
// Anno resource mapping: Holz→wood, Steine→stone, Money→gold, Werkzeug/Ziegel→gold (no tool resource).
// Production rates: Anno interval N → ratePerTick = 1/N * 8 (scaled for game balance).
export const BUILDINGS: BuildingDef[] = [
  {
    id: 'townhall',
    i18nKey: 'building.townhall.name',
    cost: {}, // Starting building — placed at game start, costs nothing
    size: { cols: 2, rows: 2 },
    effects: [{ resourceId: 'gold', ratePerTick: 0.5 }],
  },
  {
    // Anno: Försterhaus — Holz-Produktion, Werkzeug 2, Money 50
    id: 'lumbermill',
    i18nKey: 'building.lumbermill.name',
    cost: { wood: 5, gold: 15 },
    size: { cols: 1, rows: 1 },
    effects: [{ resourceId: 'wood', ratePerTick: 1.0 }],
  },
  {
    // Anno: Steinbruch — Stein-Produktion, Werkzeug 6, Holz 2, Money 150
    id: 'quarry',
    i18nKey: 'building.quarry.name',
    cost: { wood: 5, gold: 30 },
    size: { cols: 1, rows: 1 },
    effects: [{ resourceId: 'stone', ratePerTick: 0.8 }],
  },
  {
    // Anno: Getreide-Farm — Korn-Produktion, Werkzeug 2, Holz 5, Money 100
    id: 'farm',
    i18nKey: 'building.farm.name',
    cost: { wood: 5, gold: 20 },
    size: { cols: 2, rows: 2 },
    effects: [{ resourceId: 'food', ratePerTick: 1.0 }],
  },
  {
    // Anno: Jagdhütte — Nahrung (Fleisch), Werkzeug 2, Holz 2, Money 50
    id: 'hunters_hut',
    i18nKey: 'building.hunters_hut.name',
    cost: { wood: 3, gold: 40 },
    size: { cols: 1, rows: 1 },
    effects: [{ resourceId: 'food', ratePerTick: 0.5 }],
  },
  {
    // Anno: Bäckerei — Nahrungsverarbeitung (Korn→Brot), Werkzeug 2, Holz 6, Money 150
    id: 'bakery',
    i18nKey: 'building.bakery.name',
    cost: { wood: 6, stone: 2, gold: 60 },
    size: { cols: 2, rows: 2 },
    effects: [{ resourceId: 'food', ratePerTick: 0.8 }],
  },
  {
    // Anno: Wachturm — Verteidigung Radius 8, Werkzeug 2, Holz 1, Ziegel 6, Kanon 2, Money 300
    id: 'watchtower',
    i18nKey: 'building.tower.name',
    cost: { wood: 3, stone: 6, gold: 80 },
    size: { cols: 1, rows: 1 },
    effects: [],
  },
  {
    // Anno: Holzmauer — Holz 2, Money 10
    id: 'wall',
    i18nKey: 'building.wall.name',
    cost: { wood: 2, gold: 10 },
    size: { cols: 1, rows: 1 },
    effects: [],
  },
  {
    // Anno: Steinmauer — Ziegel 2, Money 18
    id: 'stone_wall',
    i18nKey: 'building.stone_wall.name',
    cost: { stone: 2, gold: 18 },
    size: { cols: 1, rows: 1 },
    effects: [],
  },
  {
    // Anno: Festung — Militärgebäude, Werkzeug 4, Holz 3, Ziegel 10, Money 600
    id: 'barracks',
    i18nKey: 'building.barracks.name',
    cost: { wood: 5, stone: 8, gold: 150 },
    size: { cols: 2, rows: 2 },
    effects: [],
  },
]

export function getBuildingDef(id: string): BuildingDef | undefined {
  return BUILDINGS.find(b => b.id === id)
}
