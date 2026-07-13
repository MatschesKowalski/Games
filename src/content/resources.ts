export type ResourceDef = {
  id: string
  i18nKey: string
  startValue: number
  capacity: number
}

export const RESOURCES: ResourceDef[] = [
  { id: 'wood',  i18nKey: 'ui.resources.wood',  startValue: 50,  capacity: 500 },
  { id: 'stone', i18nKey: 'ui.resources.stone', startValue: 30,  capacity: 300 },
  { id: 'food',  i18nKey: 'ui.resources.food',  startValue: 100, capacity: 400 },
  { id: 'gold',  i18nKey: 'ui.resources.gold',  startValue: 20,  capacity: 1000 },
]

/**
 * Creates the initial resources Record for a new GameState.
 * Values are taken from RESOURCES[].startValue.
 */
export function createInitialResources(): Record<string, number> {
  const result: Record<string, number> = {}
  for (const def of RESOURCES) {
    result[def.id] = def.startValue
  }
  return result
}
