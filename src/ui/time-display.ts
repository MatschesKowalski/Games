import { t } from '../i18n/index'
import type { DayTimeInfo, TimeOfDay } from '../sim/time'

const PHASE_I18N: Record<TimeOfDay, string> = {
  day: 'ui.hud.day',
  night: 'ui.hud.night',
}

const PHASE_ICON: Record<TimeOfDay, string> = {
  day: '☀', // ☀
  night: '☾', // ☾
}

const PHASE_BAR_COLOR: Record<TimeOfDay, string> = {
  day: '#f0c040',
  night: '#6080c0',
}

/**
 * DOM-basierte Tageszeit-Anzeige (oben rechts).
 *
 * Zeigt Phase (Tag/Nacht) als Symbol + Text und einen Fortschrittsbalken
 * für den Verlauf innerhalb der Phase.
 *
 * Schreibt NIEMALS in den GameState — nur lesend über DayTimeInfo.
 */
export class TimeDisplay {
  private readonly el: HTMLElement
  private readonly iconEl: HTMLSpanElement
  private readonly labelEl: HTMLSpanElement
  private readonly progressBar: HTMLElement

  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'time-display'
    Object.assign(this.el.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.75)',
      color: '#eee',
      padding: '8px 12px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '13px',
      pointerEvents: 'none',
      zIndex: '10',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    })

    this.iconEl = document.createElement('span')
    this.iconEl.style.fontSize = '18px'
    this.iconEl.style.lineHeight = '1'

    this.labelEl = document.createElement('span')

    const progressTrack = document.createElement('div')
    Object.assign(progressTrack.style, {
      width: '60px',
      height: '6px',
      background: 'rgba(255,255,255,0.2)',
      borderRadius: '3px',
      overflow: 'hidden',
    })

    this.progressBar = document.createElement('div')
    Object.assign(this.progressBar.style, {
      height: '100%',
      width: '0%',
      background: PHASE_BAR_COLOR.day,
      borderRadius: '3px',
    })

    progressTrack.appendChild(this.progressBar)
    this.el.appendChild(this.iconEl)
    this.el.appendChild(this.labelEl)
    this.el.appendChild(progressTrack)

    document.body.appendChild(this.el)
  }

  update(info: DayTimeInfo): void {
    this.iconEl.textContent = PHASE_ICON[info.phase]
    this.labelEl.textContent = t(PHASE_I18N[info.phase])
    this.progressBar.style.width = `${Math.round(info.progress * 100)}%`
    this.progressBar.style.background = PHASE_BAR_COLOR[info.phase]
  }

  destroy(): void {
    this.el.remove()
  }
}
