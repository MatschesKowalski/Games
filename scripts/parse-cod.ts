/**
 * COD parser for Anno 1602's haeuser.cod and figuren.cod.
 *
 * Anno 1602 COD format: every byte is negated — decoded = (256 - byte) & 0xFF.
 * The result is a latin1-encoded text DSL with sections like:
 *   Objekt: HAUS
 *     Nummer: +1
 *     Id: IDFARM+2
 *     ...
 *     Objekt: HAUS_BAUKOST
 *       Holz: 5
 *       Werkzeug: 2
 *       Money: 100
 *     EndObj;
 *   EndObj;
 *
 * We extract only the fields relevant to our game.
 */

import * as fs from 'fs'

export interface RawBuildingCost {
  Holz?: number
  Ziegel?: number
  Steine?: number
  Werkzeug?: number
  Kanon?: number
  Money?: number
}

export interface RawBuildingProduction {
  ware: string | null
  rohstoff: string | null
  interval: number
  rohmenge: number
  radius: number
  maxlager: number
}

export interface RawBuilding {
  annoId: string
  name: string
  kind: string
  size: [number, number]
  production: RawBuildingProduction
  baukost: RawBuildingCost
}

export interface RawUnit {
  id: string
  name: string
  figurNr: string
  speed: number
  maxenergy: number
  hitpoint: number
  shotradius: number
  shottime: number
  worktime: number
  rohstoff: string
  rohmenge: number
  monthlyCost: number
  price: number
  combatType: 'melee' | 'ranged'
}

export function decodeCod(filePath: string): string {
  const data = fs.readFileSync(filePath)
  const decoded = Buffer.alloc(data.length)
  for (let i = 0; i < data.length; i++) {
    decoded[i] = (256 - data[i]) & 0xff
  }
  return decoded.toString('latin1')
}

function parseNum(s: string): number {
  const n = parseFloat(s.trim())
  return isNaN(n) ? 0 : n
}

function parseKeyValue(block: string, key: string): string | null {
  const re = new RegExp(`^\\s*${key}:\\s*([^;\\n]+)`, 'm')
  const m = re.exec(block)
  return m ? m[1].trim() : null
}

/** Extract inner Objekt: <name> ... EndObj; blocks from a text block */
function extractSubBlock(text: string, objName: string): string | null {
  const start = text.indexOf(`Objekt:     ${objName}`)
  if (start === -1) return null
  const end = text.indexOf('EndObj;', start)
  if (end === -1) return null
  return text.substring(start, end)
}

/** Parse all section blocks delimited by ;--- ... ---; */
function parseSectionBlocks(text: string): Array<{ header: string; body: string }> {
  const sections: Array<{ header: string; body: string }> = []
  const headerRe = /;---([^;-]+)---[;*]/g
  let m: RegExpExecArray | null
  const headerPositions: Array<{ pos: number; header: string }> = []

  while ((m = headerRe.exec(text)) !== null) {
    headerPositions.push({ pos: m.index, header: m[1].trim() })
  }

  for (let i = 0; i < headerPositions.length; i++) {
    const start = headerPositions[i].pos
    const end = i + 1 < headerPositions.length ? headerPositions[i + 1].pos : text.length
    sections.push({ header: headerPositions[i].header, body: text.substring(start, end) })
  }
  return sections
}

export function parseHaeuserCod(filePath: string): RawBuilding[] {
  const text = decodeCod(filePath)
  const sections = parseSectionBlocks(text)
  const buildings: RawBuilding[] = []

  const interestingSections: Record<string, string> = {
    'Försterhaus': 'IDFORST+0',
    'Steinbruch': 'IDMINE+6',
    'Getreide-Farm': 'IDFARM+2',
    'Jagdhuette': 'IDFORST+2',
    'Bäckereien': 'IDHANDW+2',
    'Werkzeug-Schmiede': 'IDHANDW+14',
    'Wachturm Stein Normal+Strand': 'IDMIL+4',
    'Festungen': 'IDMIL+10',
    'Mauern - Holz': 'IDMAUER+20',
    'Mauern - Stein': 'IDMAUER+0',
  }

  const nameMap: Record<string, string> = {
    'Försterhaus': 'Försterhaus',
    'Steinbruch': 'Steinbruch',
    'Getreide-Farm': 'Getreide-Farm',
    'Jagdhuette': 'Jagdhütte',
    'Bäckereien': 'Bäckerei',
    'Werkzeug-Schmiede': 'Werkzeug-Schmiede',
    'Wachturm Stein Normal+Strand': 'Wachturm',
    'Festungen': 'Festung',
    'Mauern - Holz': 'Holzmauer',
    'Mauern - Stein': 'Steinmauer',
  }

  const kindMap: Record<string, string> = {
    'Wachturm Stein Normal+Strand': 'TURM',
    'Mauern - Holz': 'MAUER',
    'Mauern - Stein': 'MAUER',
    'Steinbruch': 'MINE',
    'Festungen': 'GEBAEUDE',
  }

  for (const section of sections) {
    const annoId = interestingSections[section.header]
    if (!annoId) continue

    const body = section.body

    // Parse Size
    const sizeRaw = parseKeyValue(body, 'Size')
    let size: [number, number] = [1, 1]
    if (sizeRaw) {
      const parts = sizeRaw.split(',').map(s => parseInt(s.trim(), 10))
      if (parts.length >= 2) size = [parts[0], parts[1]]
    }

    // Determine kind
    let kind = kindMap[section.header] ?? parseKeyValue(body, 'Kind') ?? 'GEBAEUDE'

    // Parse HAUS_BAUKOST
    const baukostBlock = extractSubBlock(body, 'HAUS_BAUKOST')
    const baukost: RawBuildingCost = {}
    if (baukostBlock) {
      const fields: Array<keyof RawBuildingCost> = ['Holz', 'Ziegel', 'Steine', 'Werkzeug', 'Kanon', 'Money']
      for (const f of fields) {
        const v = parseKeyValue(baukostBlock, f)
        if (v !== null) (baukost as Record<string, number>)[f] = parseNum(v)
      }
    }

    // Parse HAUS_PRODTYP
    const prodBlock = extractSubBlock(body, 'HAUS_PRODTYP')
    const production: RawBuildingProduction = {
      ware: null, rohstoff: null, interval: 0, rohmenge: 1, radius: 0, maxlager: 4,
    }
    if (prodBlock) {
      const ware = parseKeyValue(prodBlock, 'Ware')
      if (ware && ware !== 'NOWARE') production.ware = ware
      const rohstoff = parseKeyValue(prodBlock, 'Rohstoff')
      if (rohstoff && rohstoff !== 'NOWARE') production.rohstoff = rohstoff
      const interval = parseKeyValue(prodBlock, 'Interval')
      if (interval) production.interval = parseNum(interval)
      const rohmenge = parseKeyValue(prodBlock, 'Rohmenge')
      if (rohmenge) production.rohmenge = parseNum(rohmenge)
      const radius = parseKeyValue(prodBlock, 'Radius')
      if (radius) production.radius = parseNum(radius)
      const maxlager = parseKeyValue(prodBlock, 'Maxlager')
      if (maxlager) production.maxlager = parseNum(maxlager)
    }

    buildings.push({ annoId, name: nameMap[section.header], kind, size, production, baukost })
  }

  return buildings
}

export function parseFigurenCod(filePath: string): RawUnit[] {
  const text = decodeCod(filePath)

  // Parse top-level Soldat cost entries: "Soldat: FIGTYP_X, monthlyCost, price"
  const soldatCosts: Record<string, { monthlyCost: number; price: number }> = {}
  const costRe = /Soldat:\s+(\w+),\s*(\d+),\s*(\d+)/g
  let m: RegExpExecArray | null
  while ((m = costRe.exec(text)) !== null) {
    soldatCosts[m[1]] = { monthlyCost: parseInt(m[2], 10), price: parseInt(m[3], 10) }
  }

  // Parse SOLDATEN sections
  const soldatenIdx = text.indexOf(';===================SOLDATEN====================;')
  if (soldatenIdx === -1) return []

  const soldatenText = text.substring(soldatenIdx)
  const sections = parseSectionBlocks(soldatenText)

  const unitSections: Record<string, string> = {
    'Schwertkämpfer': 'FIGTYP_SCHWERT',
    'Kavalarie': 'FIGTYP_KAVALERIE',
    'Kanoniere': 'FIGTYP_KANONIER',
    'Musketiere': 'FIGTYP_MUSKETIER',
  }

  const units: RawUnit[] = []

  for (const section of sections) {
    const figtyp = unitSections[section.header]
    if (!figtyp) continue

    const body = section.body
    const figurNr = parseKeyValue(body, 'Nummer') ?? figtyp
    const speed = parseNum(parseKeyValue(body, 'Speed') ?? '0')
    const maxenergy = parseNum(parseKeyValue(body, 'Maxenergy') ?? '0')
    const hitpoint = parseNum(parseKeyValue(body, 'Hitpoint') ?? '0')
    const shotradius = parseNum(parseKeyValue(body, 'Shotradius') ?? '0')
    const shottime = parseNum(parseKeyValue(body, 'Shottime') ?? '0')
    const worktime = parseNum(parseKeyValue(body, 'Worktime') ?? '0')
    const rohstoff = parseKeyValue(body, 'Rohstoff') ?? 'SCHWERTER'
    const rohmenge = parseNum(parseKeyValue(body, 'Rohmenge') ?? '1')
    const costs = soldatCosts[figtyp] ?? { monthlyCost: 0, price: 0 }
    const combatType: 'melee' | 'ranged' = shotradius > 1 ? 'ranged' : 'melee'

    const nameMap: Record<string, string> = {
      'Schwertkämpfer': 'Schwertkämpfer',
      'Kavalarie': 'Kavallerie',
      'Kanoniere': 'Kanonier',
      'Musketiere': 'Musketier',
    }

    units.push({
      id: figtyp,
      name: nameMap[section.header],
      figurNr,
      speed,
      maxenergy,
      hitpoint,
      shotradius,
      shottime,
      worktime,
      rohstoff,
      rohmenge,
      monthlyCost: costs.monthlyCost,
      price: costs.price,
      combatType,
    })
  }

  return units
}
