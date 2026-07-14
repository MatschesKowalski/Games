import { t } from '../i18n/index'
import type { GameState } from '../sim/state'
import { serialize, deserialize } from '../save/serialize'
import { downloadSave, readSaveFile } from '../save/local-file'

const STYLE_BTN: Partial<CSSStyleDeclaration> = {
  background: 'rgba(255,255,255,0.1)',
  color: '#eee',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: '4px',
  padding: '4px 10px',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: '13px',
}

/**
 * DOM-Leiste mit Speichern- und Laden-Button.
 *
 * Schreibt NIEMALS direkt in den GameState — Änderungen werden über Callbacks
 * an main.ts delegiert.
 */
export class SaveLoadMenu {
  private readonly el: HTMLElement
  private readonly errorEl: HTMLElement
  private readonly onSave: () => GameState
  private readonly onLoad: (state: GameState) => void
  private errorTimer: ReturnType<typeof setTimeout> | null = null

  constructor(onSave: () => GameState, onLoad: (state: GameState) => void) {
    this.onSave = onSave
    this.onLoad = onLoad

    this.el = document.createElement('div')
    this.el.id = 'save-load-menu'
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
      zIndex: '10',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      minWidth: '160px',
    })

    const saveBtn = document.createElement('button')
    saveBtn.textContent = t('ui.menu.save_game')
    Object.assign(saveBtn.style, STYLE_BTN)
    saveBtn.addEventListener('click', () => this.handleSave())

    const loadBtn = document.createElement('button')
    loadBtn.textContent = t('ui.menu.load_game')
    Object.assign(loadBtn.style, STYLE_BTN)
    loadBtn.addEventListener('click', () => this.handleLoad())

    this.errorEl = document.createElement('div')
    Object.assign(this.errorEl.style, {
      display: 'none',
      color: '#f87171',
      fontSize: '11px',
      lineHeight: '1.4',
    })

    this.el.appendChild(saveBtn)
    this.el.appendChild(loadBtn)
    this.el.appendChild(this.errorEl)
    document.body.appendChild(this.el)
  }

  private handleSave(): void {
    const save = serialize(this.onSave())
    downloadSave(save)
  }

  private handleLoad(): void {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const saveFile = await readSaveFile(file)
        const state = deserialize(saveFile)
        this.onLoad(state)
        this.hideError()
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('errors.save.invalid')
        this.showError(msg)
      }
    })
    input.click()
  }

  private showError(msg: string): void {
    if (this.errorTimer !== null) {
      clearTimeout(this.errorTimer)
    }
    this.errorEl.textContent = msg
    this.errorEl.style.display = 'block'
    this.errorTimer = setTimeout(() => this.hideError(), 4000)
  }

  private hideError(): void {
    this.errorEl.style.display = 'none'
    this.errorTimer = null
  }

  destroy(): void {
    if (this.errorTimer !== null) clearTimeout(this.errorTimer)
    this.el.remove()
  }
}
