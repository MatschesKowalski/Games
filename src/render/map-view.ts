import { Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js'
import { gridToScreen, TILE_WIDTH, TILE_HEIGHT } from './iso'
import { createBuildingSprite } from './placeholder-sprites'
import { getSprite, isAtlasReady, SPRITE_SCALE } from './sprite-atlas'
import type { Building, Unit } from '../sim/state'
import spriteMapping from '../content/sprite-mapping.json'

type SpriteRef = { sheet: string; index: number }

const TERRAIN = spriteMapping.terrain as Record<string, SpriteRef>
const BUILDINGS = spriteMapping.buildings as Record<string, SpriteRef>

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

const UNIT_LABEL_STYLE = new TextStyle({ fontSize: 9, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' })
const UNIT_COLOR_PLAYER = 0x3399ff
const UNIT_COLOR_ENEMY = 0xff4444
const UNIT_RADIUS = TILE_WIDTH / 5

const UNITS_MAP = spriteMapping.units as Record<string, { sheet: string; index: number }>

function createUnitSprite(unit: Unit): Container {
  const { x, y } = gridToScreen(unit.col, unit.row)
  const c = new Container()

  const ref = UNITS_MAP[unit.typeId]
  if (ref != null && isAtlasReady(ref.sheet)) {
    const tex = getSprite(ref.sheet, ref.index)
    if (tex !== Texture.EMPTY) {
      const sprite = new Sprite(tex)
      sprite.scale.set(SPRITE_SCALE)
      sprite.anchor.set(0.5, 1.0)
      sprite.x = x
      sprite.y = y + TILE_HEIGHT / 2
      // Blaue/rote Tönung je Seite
      sprite.tint = unit.side === 'player' ? 0x88aaff : 0xff8888
      c.addChild(sprite)
      return c
    }
  }

  // Platzhalter: farbiger Kreis mit Buchstabe
  const g = new Graphics()
  const color = unit.side === 'player' ? UNIT_COLOR_PLAYER : UNIT_COLOR_ENEMY
  g.circle(x, y, UNIT_RADIUS).fill({ color, alpha: 0.9 }).stroke({ color: 0xffffff, width: 1 })
  const label = new Text({ text: unit.typeId[0].toUpperCase(), style: UNIT_LABEL_STYLE })
  label.anchor.set(0.5)
  label.x = x
  label.y = y
  c.addChild(g)
  c.addChild(label)
  return c
}

export class MapView {
  readonly container: Container
  private readonly tileLayer: Container
  private readonly buildingLayer: Container
  private readonly unitLayer: Container
  private readonly hoverGraphics: Graphics
  private readonly cols: number
  private readonly rows: number
  private hoveredCol = -1
  private hoveredRow = -1

  constructor(cols: number, rows: number) {
    this.cols = cols
    this.rows = rows
    this.container = new Container()
    this.tileLayer = new Container()
    this.buildingLayer = new Container()
    this.unitLayer = new Container()
    this.hoverGraphics = new Graphics()

    this.container.addChild(this.tileLayer)
    this.container.addChild(this.buildingLayer)
    this.container.addChild(this.unitLayer)
    this.container.addChild(this.hoverGraphics)

    this.buildBaseMap()
  }

  private buildBaseMap(): void {
    this.tileLayer.removeChildren()
    const grassRef = TERRAIN['grass']
    const useSprites = grassRef != null && isAtlasReady(grassRef.sheet)

    if (useSprites) {
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const { x, y } = gridToScreen(col, row)
          const sprite = new Sprite(getSprite(grassRef.sheet, grassRef.index))
          sprite.scale.set(SPRITE_SCALE)
          sprite.anchor.set(0.5, 0.5)
          sprite.x = x
          sprite.y = y
          this.tileLayer.addChild(sprite)
        }
      }
    } else {
      const g = new Graphics()
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          drawDiamond(g, col, row, TILE_COLOR)
        }
      }
      this.tileLayer.addChild(g)
    }
  }

  /** Call once sprite atlas has finished loading to switch to real tiles. */
  enableRealSprites(): void {
    this.buildBaseMap()
  }

  updateBuildings(buildings: Building[]): void {
    this.buildingLayer.removeChildren()
    for (const b of buildings) {
      const ref = BUILDINGS[b.buildingId]
      if (ref != null && isAtlasReady(ref.sheet)) {
        const { x, y } = gridToScreen(b.col, b.row)
        const sprite = new Sprite(getSprite(ref.sheet, ref.index))
        sprite.scale.set(SPRITE_SCALE)
        sprite.anchor.set(0.5, 1.0)
        sprite.x = x
        sprite.y = y + TILE_HEIGHT / 2
        this.buildingLayer.addChild(sprite)
      } else {
        this.buildingLayer.addChild(createBuildingSprite(b.buildingId, b.col, b.row))
      }
    }
  }

  updateUnits(units: Unit[]): void {
    this.unitLayer.removeChildren()
    for (const unit of units) {
      this.unitLayer.addChild(createUnitSprite(unit))
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
    this.tileLayer.destroy({ children: true })
    this.buildingLayer.destroy({ children: true })
    this.unitLayer.destroy({ children: true })
    this.hoverGraphics.destroy()
    this.container.destroy()
  }
}
