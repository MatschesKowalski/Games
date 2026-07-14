import { Application, TextureStyle } from 'pixi.js'
import { MapView } from './render/map-view'
import { Camera } from './render/camera'
import { initSpriteAtlas } from './render/sprite-atlas'
import { DayNightOverlay } from './render/day-night-overlay'
import { screenToGrid } from './render/iso'
import { soundManager } from './render/sound-manager'
import { createInitialState } from './sim/state'
import { applyCommand } from './sim/commands'
import { tick } from './sim/tick'
import { getTimeOfDay } from './sim/time'
import type { TimeOfDay } from './sim/time'
import { Hud } from './ui/hud'
import { BuildMenu } from './ui/build-menu'
import { TimeDisplay } from './ui/time-display'
import { SaveLoadMenu } from './ui/save-load-menu'

const MAP_SIZE = 40
const DRAG_THRESHOLD = 5
const MS_PER_TICK = 500

async function main() {
  // Pixel-Art-Sprites scharf skalieren statt weichzeichnen
  TextureStyle.defaultOptions.scaleMode = 'nearest'

  const app = new Application()

  await app.init({
    background: '#1a1a2e',
    resizeTo: window,
    roundPixels: true,
  })

  document.body.appendChild(app.canvas)

  let gameState = createInitialState()
  gameState = applyCommand(gameState, { type: 'build', buildingId: 'townhall', col: 5, row: 5 })

  let selectedBuildingId: string | null = null
  let selectedUnitTypeId: string | null = null

  let prevPhase: TimeOfDay | null = null

  const hud = new Hud()
  const timeDisplay = new TimeDisplay()

  const buildMenu = new BuildMenu(
    (id) => { selectedBuildingId = id },
    (unitTypeId) => { selectedUnitTypeId = unitTypeId },
  )

  const mapView = new MapView(MAP_SIZE, MAP_SIZE)
  const overlay = new DayNightOverlay(window.innerWidth, window.innerHeight)

  new SaveLoadMenu(
    () => gameState,
    (loadedState) => {
      gameState = loadedState
      mapView.updateBuildings(gameState.buildings)
      mapView.updateUnits(gameState.units)
      const timeInfo = getTimeOfDay(gameState.tick)
      overlay.update(timeInfo)
      hud.update(gameState.resources)
      timeDisplay.update(timeInfo)
      buildMenu.setBarracksAvailable(gameState.buildings.some(b => b.buildingId === 'barracks'))
    },
  )

  app.stage.addChild(mapView.container)
  app.stage.addChild(overlay.container)

  mapView.updateBuildings(gameState.buildings)
  mapView.updateUnits(gameState.units)
  overlay.update(getTimeOfDay(gameState.tick))
  hud.update(gameState.resources)
  timeDisplay.update(getTimeOfDay(gameState.tick))

  initSpriteAtlas(['stadtfld', 'soldat']).then(() => {
    mapView.enableRealSprites()
    mapView.updateBuildings(gameState.buildings)
    mapView.updateUnits(gameState.units)
  }).catch((err: unknown) => {
    console.warn('Sprite-Atlas konnte nicht geladen werden, Platzhalter bleiben aktiv:', err)
  })

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
    if (hasDragged) return
    const worldX = (e.clientX - camera.x) / camera.zoom
    const worldY = (e.clientY - camera.y) / camera.zoom
    const { col, row } = screenToGrid(worldX, worldY)
    if (col < 0 || col >= MAP_SIZE || row < 0 || row >= MAP_SIZE) return

    if (selectedBuildingId) {
      const prevCount = gameState.buildings.length
      gameState = applyCommand(gameState, { type: 'build', buildingId: selectedBuildingId, col, row })
      if (gameState.buildings.length > prevCount) {
        soundManager.playSound('building.built')
        buildMenu.setBarracksAvailable(gameState.buildings.some(b => b.buildingId === 'barracks'))
      }
      mapView.updateBuildings(gameState.buildings)
    } else if (selectedUnitTypeId) {
      const prevCount = gameState.units.length
      gameState = applyCommand(gameState, { type: 'recruit', unitTypeId: selectedUnitTypeId, col, row })
      if (gameState.units.length > prevCount) {
        soundManager.playSound('building.built')
      }
      mapView.updateUnits(gameState.units)
    }
  })

  // Simulations-Tick: alle MS_PER_TICK Millisekunden
  let lastTickTime = performance.now()
  app.ticker.add(() => {
    mapView.container.x = camera.x
    mapView.container.y = camera.y
    mapView.container.scale.set(camera.zoom)

    const now = performance.now()
    if (now - lastTickTime >= MS_PER_TICK) {
      gameState = tick(gameState, [])
      const timeInfo = getTimeOfDay(gameState.tick)
      overlay.update(timeInfo)
      hud.update(gameState.resources)
      timeDisplay.update(timeInfo)
      lastTickTime = now

      // Ambient-Sound bei Tag/Nacht-Wechsel (oder beim ersten Tick).
      if (timeInfo.phase !== prevPhase) {
        prevPhase = timeInfo.phase
        soundManager.playAmbient(timeInfo.phase === 'day' ? 'ambient.day' : 'ambient.night')
      }
    }
  })
}

main().catch(console.error)
