import { Container, Graphics } from 'pixi.js'
import { gridToScreen, TILE_WIDTH, TILE_HEIGHT } from './iso'
import { createBuildingSprite } from './placeholder-sprites'
import type { Building } from '../sim/state'

const TILE_COLOR = 0x4a7c59
const HOVER_COLOR = 0x72b583
const OUTLINE_COLOR = 0x2a4a35

function drawDiamond(g: Graphics, col: number, row: number, fillColor: number): void {
  const { x, y } = gridToScreen(col, row)
  g.moveTo(x, y - TILE_HEIGHT / 2)
    .lineTo(x + TILE_WIDTH / 2, y)
    .lineTo(x, y + TILE_HEIGHT / 2)
    .lineTo(x - TILE_WIDTH / 2, y)
    .closePath()
    .fill({ color: fillColor })
    .stroke({ color: OUTLINE_COLOR, width: 1 })
}

export class MapView {
  readonly container: Container
  private readonly baseGraphics: Graphics
  private readonly buildingLayer: Container
  private readonly hoverGraphics: Graphics
  private readonly cols: number
  private readonly rows: number
  private hoveredCol: number = -1
  private hoveredRow: number = -1

  constructor(cols: number, rows: number) {
    this.cols = cols
    this.rows = rows
    this.container = new Container()
    this.baseGraphics = new Graphics()
    this.buildingLayer = new Container()
    this.hoverGraphics = new Graphics()

    this.container.addChild(this.baseGraphics)
    this.container.addChild(this.buildingLayer)
    this.container.addChild(this.hoverGraphics)

    this.buildBaseMap()
  }

  private buildBaseMap(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        drawDiamond(this.baseGraphics, col, row, TILE_COLOR)
      }
    }
  }

  updateBuildings(buildings: Building[]): void {
    this.buildingLayer.removeChildren()
    for (const b of buildings) {
      const sprite = createBuildingSprite(b.buildingId, b.col, b.row)
      this.buildingLayer.addChild(sprite)
    }
  }

  setHoveredTile(col: number, row: number): void {
    if (col === this.hoveredCol && row === this.hoveredRow) return
    this.hoveredCol = col
    this.hoveredRow = row
    this.hoverGraphics.clear()
    drawDiamond(this.hoverGraphics, col, row, HOVER_COLOR)
  }

  clearHover(): void {
    if (this.hoveredCol === -1) return
    this.hoveredCol = -1
    this.hoveredRow = -1
    this.hoverGraphics.clear()
  }

  destroy(): void {
    this.baseGraphics.destroy()
    this.buildingLayer.destroy({ children: true })
    this.hoverGraphics.destroy()
    this.container.destroy()
  }
}
