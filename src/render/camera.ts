import { Container, FederatedPointerEvent, Rectangle } from 'pixi.js'

const MIN_ZOOM = 0.3
const MAX_ZOOM = 3.0
const ZOOM_FACTOR_IN = 1.1
const ZOOM_FACTOR_OUT = 0.9

/**
 * Kamera-Controller — verwaltet Position (Pan) und Zoom der isometrischen Karte.
 * Liest und schreibt nur camera.x / camera.y / camera.zoom;
 * der Render-Loop überträgt diese Werte auf den Map-Container.
 */
export class Camera {
  x: number = 0
  y: number = 0
  zoom: number = 1

  private isDragging: boolean = false
  private lastPointerX: number = 0
  private lastPointerY: number = 0

  /** Wird aufgerufen, wenn der Zeiger gedrückt wird — startet Drag. */
  onPointerDown(screenX: number, screenY: number): void {
    this.isDragging = true
    this.lastPointerX = screenX
    this.lastPointerY = screenY
  }

  /** Bewegt die Kamera entsprechend der Zeigerbewegung. */
  onPointerMove(screenX: number, screenY: number): void {
    if (!this.isDragging) return
    this.x += screenX - this.lastPointerX
    this.y += screenY - this.lastPointerY
    this.lastPointerX = screenX
    this.lastPointerY = screenY
  }

  /** Beendet den Drag. */
  onPointerUp(): void {
    this.isDragging = false
  }

  /**
   * Zoomt um den Mauszeiger-Pivotpunkt.
   * @param deltaY - positiv = rauszoomen, negativ = reinzoomen
   * @param pivotX - Mausposition X in Screen-Space
   * @param pivotY - Mausposition Y in Screen-Space
   */
  onWheel(deltaY: number, pivotX: number, pivotY: number): void {
    const factor = deltaY > 0 ? ZOOM_FACTOR_OUT : ZOOM_FACTOR_IN
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.zoom * factor))
    const scale = newZoom / this.zoom
    this.x = pivotX + (this.x - pivotX) * scale
    this.y = pivotY + (this.y - pivotY) * scale
    this.zoom = newZoom
  }

  /**
   * Registriert Event-Listener an der PixiJS Stage (Drag) und am window (Wheel).
   * Setzt die initiale Kameraposition so, dass die Karte zentriert sichtbar ist.
   */
  attachTo(
    stage: Container,
    _mapContainer: Container,
    screenWidth: number,
    screenHeight: number,
  ): void {
    // Karte zentrieren: Ursprung (0,0) der iso-Projektion liegt am oberen Eck
    this.x = screenWidth / 2
    this.y = screenHeight * 0.1

    // Interaktionsfläche: gesamter Bildschirm
    stage.eventMode = 'static'
    stage.hitArea = new Rectangle(-screenWidth, -screenHeight, screenWidth * 3, screenHeight * 3)

    stage.on('pointerdown', (e: FederatedPointerEvent) => {
      this.onPointerDown(e.global.x, e.global.y)
    })
    stage.on('pointermove', (e: FederatedPointerEvent) => {
      this.onPointerMove(e.global.x, e.global.y)
    })
    stage.on('pointerup', () => this.onPointerUp())
    stage.on('pointerupoutside', () => this.onPointerUp())

    window.addEventListener('wheel', (e: WheelEvent) => {
      this.onWheel(e.deltaY, e.clientX, e.clientY)
    })
  }

  /**
   * Begrenzt die Kamera-Verschiebung, damit die Karte nie komplett
   * aus dem Bildschirm scrollt.
   * @param mapWidth - Breite der Karte in Pixeln (Screen-Space, ohne Zoom)
   * @param mapHeight - Höhe der Karte in Pixeln (Screen-Space, ohne Zoom)
   */
  clampToBounds(
    mapWidth: number,
    mapHeight: number,
    screenWidth: number,
    screenHeight: number,
  ): void {
    const margin = 50
    const scaledW = mapWidth * this.zoom
    const scaledH = mapHeight * this.zoom
    this.x = Math.max(this.x, -(scaledW - margin))
    this.x = Math.min(this.x, screenWidth - margin)
    this.y = Math.max(this.y, -(scaledH - margin))
    this.y = Math.min(this.y, screenHeight - margin)
  }
}
