import { Graphics, Container } from 'pixi.js'
import type { DayTimeInfo } from '../sim/time'

const NIGHT_COLOR = 0x000033
const MAX_NIGHT_ALPHA = 0.6

export class DayNightOverlay {
  readonly container: Container
  private readonly overlay: Graphics

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container()
    this.overlay = new Graphics()
    this.overlay
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: NIGHT_COLOR })
    this.overlay.alpha = 0
    this.container.addChild(this.overlay)
  }

  update(timeInfo: DayTimeInfo): void {
    // Weicher Übergang: Sinus-Interpolation für sanften Tag/Nacht-Wechsel
    let nightIntensity: number
    if (timeInfo.phase === 'day') {
      // Morgen (0→0.2): hell, Mittag (0.2→0.8): hell, Abend (0.8→1): wird dunkler
      nightIntensity = timeInfo.progress > 0.8
        ? (timeInfo.progress - 0.8) / 0.2
        : 0
    } else {
      // Nacht: dunkel, mit weichem Ein- und Ausblenden
      nightIntensity = timeInfo.progress < 0.2
        ? 1.0
        : timeInfo.progress > 0.8
          ? (1 - timeInfo.progress) / 0.2
          : 1.0
    }
    this.overlay.alpha = nightIntensity * MAX_NIGHT_ALPHA
  }

  resize(screenWidth: number, screenHeight: number): void {
    this.overlay.clear()
    this.overlay
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: NIGHT_COLOR })
  }
}
