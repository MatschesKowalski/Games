import { Graphics, Text, Container, TextStyle } from 'pixi.js'
import { gridToScreen, TILE_WIDTH, TILE_HEIGHT } from './iso'

export type BuildingVisual = {
  color: number
  label: string  // Kurz-Label (1–2 Zeichen) für die Kachel
}

const BUILDING_VISUALS: Record<string, BuildingVisual> = {
  townhall:  { color: 0xcc4444, label: 'R' },
  lumbermill: { color: 0x44aa44, label: 'H' },
  quarry:    { color: 0x888888, label: 'S' },
  farm:      { color: 0xddaa22, label: 'G' },
}

const FALLBACK_VISUAL: BuildingVisual = { color: 0x6666cc, label: '?' }

export function getBuildingVisual(buildingId: string): BuildingVisual {
  return BUILDING_VISUALS[buildingId] ?? FALLBACK_VISUAL
}

const LABEL_STYLE = new TextStyle({
  fontSize: 10,
  fill: 0xffffff,
  fontFamily: 'monospace',
  fontWeight: 'bold',
})

export function createBuildingSprite(buildingId: string, col: number, row: number): Container {
  const visual = getBuildingVisual(buildingId)
  const { x, y } = gridToScreen(col, row)

  const container = new Container()

  const g = new Graphics()
  g.moveTo(x, y - TILE_HEIGHT / 2 + 2)
    .lineTo(x + TILE_WIDTH / 2 - 2, y)
    .lineTo(x, y + TILE_HEIGHT / 2 - 2)
    .lineTo(x - TILE_WIDTH / 2 + 2, y)
    .closePath()
    .fill({ color: visual.color, alpha: 0.85 })
    .stroke({ color: 0xffffff, width: 1.5, alpha: 0.6 })

  const label = new Text({ text: visual.label, style: LABEL_STYLE })
  label.anchor.set(0.5)
  label.x = x
  label.y = y

  container.addChild(g)
  container.addChild(label)
  return container
}
