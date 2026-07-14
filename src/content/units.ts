// Unit definitions derived from Anno 1602 figuren.cod (via assets/data/units-raw.json).
// speedTicks = Math.round(1000 / annoSpeed) — ticks to move one tile (lower = faster).
export type UnitDef = {
  id: string
  i18nKey: string
  hp: number
  damage: number
  range: number
  speedTicks: number
  cost: Record<string, number>
  combatType: 'melee' | 'ranged'
}

export const UNITS: UnitDef[] = [
  {
    // Anno: FIGTYP_SCHWERT — HP 20, Schaden 1.0, Reichweite 0.75, Speed 260, Preis 80
    id: 'swordsman',
    i18nKey: 'unit.swordsman.name',
    hp: 20,
    damage: 1.0,
    range: 1,
    speedTicks: 4,
    cost: { gold: 80 },
    combatType: 'melee',
  },
  {
    // Anno: FIGTYP_KAVALERIE — HP 18, Schaden 1.6, Reichweite 0.75, Speed 400, Preis 130
    id: 'cavalry',
    i18nKey: 'unit.cavalry.name',
    hp: 18,
    damage: 1.6,
    range: 1,
    speedTicks: 3,
    cost: { gold: 130 },
    combatType: 'melee',
  },
  {
    // Anno: FIGTYP_MUSKETIER — HP 15, Schaden 2.4, Reichweite 4, Speed 210, Preis 160
    id: 'musketeer',
    i18nKey: 'unit.musketeer.name',
    hp: 15,
    damage: 2.4,
    range: 4,
    speedTicks: 5,
    cost: { gold: 160 },
    combatType: 'ranged',
  },
  {
    // Anno: FIGTYP_KANONIER — HP 12, Schaden 7.0, Reichweite 7, Speed 230, Preis 220
    id: 'cannoneer',
    i18nKey: 'unit.cannoneer.name',
    hp: 12,
    damage: 7.0,
    range: 7,
    speedTicks: 4,
    cost: { gold: 220 },
    combatType: 'ranged',
  },
]

export function getUnitDef(id: string): UnitDef | undefined {
  return UNITS.find(u => u.id === id)
}
