/**
 * Isometrische Koordinatentransformation — kein PixiJS, reine Mathematik.
 * Zentrale Stelle für alle iso-Berechnungen im Projekt.
 */

export const TILE_WIDTH = 64
export const TILE_HEIGHT = 32

/**
 * Raster-Koordinaten (Spalte/Zeile) → Bildschirm-Pixel (isometrische Projektion).
 * Ursprung (0,0) liegt am oberen Eck der Karte.
 */
export function gridToScreen(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_WIDTH / 2),
    y: (col + row) * (TILE_HEIGHT / 2),
  }
}

/**
 * Bildschirm-Pixel → Raster-Koordinaten (inverse Transformation).
 * Ergebnis wird auf die nächste ganze Kachel gerundet.
 */
export function screenToGrid(x: number, y: number): { col: number; row: number } {
  return {
    col: Math.round(x / TILE_WIDTH + y / TILE_HEIGHT),
    row: Math.round(y / TILE_HEIGHT - x / TILE_WIDTH),
  }
}
