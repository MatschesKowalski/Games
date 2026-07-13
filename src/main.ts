import { Application } from 'pixi.js'
import { MapView } from './render/map-view'
import { Camera } from './render/camera'
import { screenToGrid } from './render/iso'

const MAP_SIZE = 40

async function main() {
  const app = new Application()

  await app.init({
    background: '#1a1a2e',
    resizeTo: window,
  })

  document.body.appendChild(app.canvas)

  const mapView = new MapView(MAP_SIZE, MAP_SIZE)
  app.stage.addChild(mapView.container)

  const camera = new Camera()
  camera.attachTo(app.stage, mapView.container, window.innerWidth, window.innerHeight)

  // Hover-Highlight: Mausposition in Welt-Koordinaten umrechnen → Kachel bestimmen
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

  // Render-Loop: Kamera-Transform auf den Map-Container anwenden
  app.ticker.add(() => {
    mapView.container.x = camera.x
    mapView.container.y = camera.y
    mapView.container.scale.set(camera.zoom)
  })
}

main().catch(console.error)
