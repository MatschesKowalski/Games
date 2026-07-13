import { Application } from 'pixi.js'
import { MapView } from './render/map-view'
import { Camera } from './render/camera'
import { screenToGrid } from './render/iso'
import { createInitialState } from './sim/state'
import { applyCommand } from './sim/commands'

const MAP_SIZE = 40
const DRAG_THRESHOLD = 5

async function main() {
  const app = new Application()

  await app.init({
    background: '#1a1a2e',
    resizeTo: window,
  })

  document.body.appendChild(app.canvas)

  let gameState = createInitialState()
  // Rathaus beim Start platzieren (kostet nichts)
  gameState = applyCommand(gameState, { type: 'build', buildingId: 'townhall', col: 5, row: 5 })

  const selectedBuildingId: string | null = 'lumbermill'

  const mapView = new MapView(MAP_SIZE, MAP_SIZE)
  app.stage.addChild(mapView.container)
  mapView.updateBuildings(gameState.buildings)

  const camera = new Camera()
  camera.attachTo(app.stage, mapView.container, window.innerWidth, window.innerHeight)

  // Hover-Highlight
  app.canvas.addEventListener('pointermove', (e: PointerEvent) => {
    const worldX = (e.clientX - camera.x) / camera.zoom
    const worldY = (e.clientY - camera.y) / camera.zoom
    const { col, row } = screenToGrid(worldX, worldY)
    if (col >= 0 && col < MAP_SIZE && row >= 0 && row < MAP_SIZE) {
      mapView.setHoveredTile(col, row)
    } else {
      mapView.clearHover()
    }
  })

  app.canvas.addEventListener('pointerleave', () => {
    mapView.clearHover()
  })

  // Klick-Platzierung mit Drag-Erkennung
  let pointerDownX = 0
  let pointerDownY = 0
  let hasDragged = false

  app.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    pointerDownX = e.clientX
    pointerDownY = e.clientY
    hasDragged = false
  })

  app.canvas.addEventListener('pointermove', (e: PointerEvent) => {
    const dx = e.clientX - pointerDownX
    const dy = e.clientY - pointerDownY
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
      hasDragged = true
    }
  })

  app.canvas.addEventListener('pointerup', (e: PointerEvent) => {
    if (hasDragged || !selectedBuildingId) return
    const worldX = (e.clientX - camera.x) / camera.zoom
    const worldY = (e.clientY - camera.y) / camera.zoom
    const { col, row } = screenToGrid(worldX, worldY)
    if (col >= 0 && col < MAP_SIZE && row >= 0 && row < MAP_SIZE) {
      gameState = applyCommand(gameState, { type: 'build', buildingId: selectedBuildingId, col, row })
      mapView.updateBuildings(gameState.buildings)
    }
  })

  // Render-Loop
  app.ticker.add(() => {
    mapView.container.x = camera.x
    mapView.container.y = camera.y
    mapView.container.scale.set(camera.zoom)
  })
}

main().catch(console.error)
