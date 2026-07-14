/**
 * map-to-game.ts — Mappt Anno 1602 Rohdaten auf das Spielsystem.
 *
 * Liest assets/data/buildings-raw.json + units-raw.json und schreibt
 * assets/data/buildings-game.json + assets/data/units-game.json.
 *
 * Ressourcen-Mapping (Anno → Spiel):
 *   Holz     → wood   (1:1)
 *   Steine   → stone  (1:1)
 *   Money    → gold   (1:1)
 *   Ziegel   → stone  (1:2, Ziegel = verarbeiteter Stein)
 *   Werkzeug → gold   (1:8, kein Werkzeug-Resource im Spiel)
 *   Kanon    → gold   (1:20)
 *
 * Produktions-Skalierung: ratePerTick = (rohmenge / interval) * 8
 */

import * as fs from 'fs'
import * as path from 'path'

const ROOT = path.resolve(__dirname, '..')
const DATA = path.join(ROOT, 'assets', 'data')

interface AnnoBuilding {
  annoId: string
  name: string
  kind: string
  size: [number, number]
  production: {
    ware: string | null
    interval: number
    rohmenge: number
    radius: number
    maxlager: number
  }
  baukost: Record<string, number>
}

interface AnnoUnit {
  id: string
  name: string
  speed: number
  maxenergy: number
  hitpoint: number
  shotradius: number
  price: number
  combatType: string
}

interface GameBuilding {
  id: string
  annoId: string
  name: string
  cost: Record<string, number>
  size: [number, number]
  production: { resourceId: string; ratePerTick: number } | null
}

interface GameUnit {
  id: string
  annoId: string
  name: string
  hp: number
  damage: number
  range: number
  speedTicks: number
  cost: Record<string, number>
  combatType: 'melee' | 'ranged'
}

// Anno Gebäude-ID → Spiel-ID
const BUILDING_ID_MAP: Record<string, string> = {
  'IDFORST+0':  'lumbermill',
  'IDMINE+6':   'quarry',
  'IDFARM+2':   'farm',
  'IDFORST+2':  'hunters_hut',
  'IDHANDW+2':  'bakery',
  'IDHANDW+14': 'toolsmith',
  'IDMIL+4':    'watchtower',
  'IDMIL+10':   'barracks',
  'IDMAUER+20': 'wall',
  'IDMAUER+0':  'stone_wall',
}

// Anno Ware-ID → Spiel-Ressource-ID
const WARE_MAP: Record<string, string> = {
  HOLZ:     'wood',
  STEINE:   'stone',
  KORN:     'food',
  NAHRUNG:  'food',
  WERKZEUG: 'wood', // tools → approximated as wood production chain
}

function mapCost(baukost: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [k, v] of Object.entries(baukost)) {
    if (k === 'Money')    result['gold']  = (result['gold']  ?? 0) + v
    else if (k === 'Holz')     result['wood']  = (result['wood']  ?? 0) + v
    else if (k === 'Steine')   result['stone'] = (result['stone'] ?? 0) + v
    else if (k === 'Ziegel')   result['stone'] = (result['stone'] ?? 0) + Math.round(v * 2)
    else if (k === 'Werkzeug') result['gold']  = (result['gold']  ?? 0) + v * 8
    else if (k === 'Kanon')    result['gold']  = (result['gold']  ?? 0) + v * 20
  }
  return result
}

function mapProduction(prod: AnnoBuilding['production']): { resourceId: string; ratePerTick: number } | null {
  if (!prod.ware || prod.interval === 0) return null
  const resourceId = WARE_MAP[prod.ware]
  if (!resourceId) return null
  const ratePerTick = Math.round((prod.rohmenge / prod.interval) * 8 * 10) / 10
  return { resourceId, ratePerTick }
}

function mapBuildings(raw: AnnoBuilding[]): GameBuilding[] {
  return raw.map(b => ({
    id: BUILDING_ID_MAP[b.annoId] ?? b.annoId.toLowerCase().replace(/\+/, '_'),
    annoId: b.annoId,
    name: b.name,
    cost: mapCost(b.baukost),
    size: b.size,
    production: mapProduction(b.production),
  }))
}

function mapUnits(raw: AnnoUnit[]): GameUnit[] {
  const ID_MAP: Record<string, string> = {
    FIGTYP_SCHWERT:   'swordsman',
    FIGTYP_KAVALERIE: 'cavalry',
    FIGTYP_MUSKETIER: 'musketeer',
    FIGTYP_KANONIER:  'cannoneer',
  }
  return raw.map(u => ({
    id: ID_MAP[u.id] ?? u.id.toLowerCase(),
    annoId: u.id,
    name: u.name,
    hp: u.maxenergy,
    damage: u.hitpoint,
    range: Math.round(u.shotradius),
    speedTicks: Math.round(1000 / u.speed),
    cost: { gold: u.price },
    combatType: u.combatType as 'melee' | 'ranged',
  }))
}

const rawBuildings: AnnoBuilding[] = JSON.parse(fs.readFileSync(path.join(DATA, 'buildings-raw.json'), 'utf8'))
const rawUnits: AnnoUnit[] = JSON.parse(fs.readFileSync(path.join(DATA, 'units-raw.json'), 'utf8'))

const gameBuildings = mapBuildings(rawBuildings)
const gameUnits = mapUnits(rawUnits)

fs.writeFileSync(path.join(DATA, 'buildings-game.json'), JSON.stringify(gameBuildings, null, 2))
fs.writeFileSync(path.join(DATA, 'units-game.json'), JSON.stringify(gameUnits, null, 2))

console.log(`buildings-game.json: ${gameBuildings.length} Gebäude`)
console.log(`units-game.json: ${gameUnits.length} Einheiten`)
