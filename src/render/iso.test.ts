import { describe, it, expect } from 'vitest'
import { gridToScreen, screenToGrid, TILE_WIDTH, TILE_HEIGHT } from './iso'

describe('iso: gridToScreen', () => {
  it('Ursprung (0,0) liefert (0,0)', () => {
    expect(gridToScreen(0, 0)).toEqual({ x: 0, y: 0 })
  })

  it('col=1, row=0 → x=TILE_WIDTH/2, y=TILE_HEIGHT/2', () => {
    expect(gridToScreen(1, 0)).toEqual({ x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 })
  })

  it('col=0, row=1 → x=-TILE_WIDTH/2, y=TILE_HEIGHT/2', () => {
    expect(gridToScreen(0, 1)).toEqual({ x: -(TILE_WIDTH / 2), y: TILE_HEIGHT / 2 })
  })

  it('negative Koordinaten', () => {
    const { x, y } = gridToScreen(-3, -3)
    expect(x).toBe(0)
    expect(y).toBe(-3 * TILE_HEIGHT)
  })
})

describe('iso: screenToGrid (Rundtrip-Test)', () => {
  const cases: [number, number][] = [
    [0, 0],
    [1, 0],
    [0, 1],
    [3, 5],
    [10, 10],
    [-2, 3],
    [-5, -5],
    [1000, 500],
    [39, 39],
  ]

  for (const [col, row] of cases) {
    it(`screenToGrid(gridToScreen(${col}, ${row})) = (${col}, ${row})`, () => {
      const screen = gridToScreen(col, row)
      const grid = screenToGrid(screen.x, screen.y)
      expect(grid.col).toBe(col)
      expect(grid.row).toBe(row)
    })
  }
})

describe('iso: Konstanten', () => {
  it('TILE_WIDTH ist positiv', () => {
    expect(TILE_WIDTH).toBeGreaterThan(0)
  })

  it('TILE_HEIGHT ist positiv', () => {
    expect(TILE_HEIGHT).toBeGreaterThan(0)
  })

  it('TILE_HEIGHT ist halb so groß wie TILE_WIDTH (Standard-Iso-Verhältnis 2:1)', () => {
    expect(TILE_WIDTH / TILE_HEIGHT).toBe(2)
  })
})
