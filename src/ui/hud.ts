import { t } from '../i18n/index'
import { RESOURCES } from '../content/resources'

export class Hud {
  private readonly el: HTMLElement
  private readonly rows: Map<string, HTMLElement> = new Map()

  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'hud'
    Object.assign(this.el.style, {
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.75)',
      color: '#eee',
      padding: '8px 12px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '13px',
      pointerEvents: 'none',
      zIndex: '10',
      lineHeight: '1.6',
    })

    for (const res of RESOURCES) {
      const row = document.createElement('div')
      row.dataset['resourceId'] = res.id
      this.rows.set(res.id, row)
      this.el.appendChild(row)
    }

    document.body.appendChild(this.el)
  }

  update(resources: Record<string, number>): void {
    for (const res of RESOURCES) {
      const row = this.rows.get(res.id)
      if (!row) continue
      const current = Math.floor(resources[res.id] ?? 0)
      row.textContent = `${t(res.i18nKey)}: ${current} / ${res.capacity}`
    }
  }

  destroy(): void {
    this.el.remove()
  }
}
