import { t } from '../i18n/index'
import { BUILDINGS } from '../content/buildings'
import { UNITS } from '../content/units'
import { RESOURCES } from '../content/resources'
import { soundManager } from '../render/sound-manager'

const STYLE_BTN_DEFAULT = 'rgba(255,255,255,0.1)'
const STYLE_BTN_SELECTED = 'rgba(114,181,131,0.35)'
const STYLE_BORDER_DEFAULT = 'rgba(255,255,255,0.3)'
const STYLE_BORDER_SELECTED = '#72b583'

/** Builds a resource-id → i18n-key lookup from the RESOURCES catalog. */
function buildResKeyMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const res of RESOURCES) {
    map[res.id] = res.i18nKey
  }
  return map
}

/**
 * DOM-basiertes Bau-Menü.
 *
 * Zeigt alle Gebäude aus dem Katalog mit Kosten an.
 * Klick auf ein Gebäude ruft onSelect(buildingId) auf.
 * Erneuter Klick auf das bereits ausgewählte Gebäude ruft onSelect(null) auf
 * (Platzierungsmodus deaktivieren).
 *
 * Schreibt NIEMALS direkt in den GameState — Selektion wird über den Callback
 * nach main.ts delegiert.
 */
export class BuildMenu {
  private readonly el: HTMLElement
  private readonly buttons: Map<string, HTMLButtonElement> = new Map()
  private readonly unitButtons: Map<string, HTMLButtonElement> = new Map()
  private readonly unitSectionTitle: HTMLElement
  private selectedId: string | null = null
  private selectedUnitId: string | null = null
  private readonly onSelect: (buildingId: string | null) => void
  private readonly onUnitSelect: (unitTypeId: string | null) => void

  constructor(
    onSelect: (buildingId: string | null) => void,
    onUnitSelect: (unitTypeId: string | null) => void,
  ) {
    this.onSelect = onSelect
    this.onUnitSelect = onUnitSelect

    this.el = document.createElement('div')
    this.el.id = 'build-menu'
    Object.assign(this.el.style, {
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.80)',
      color: '#eee',
      padding: '8px 12px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '13px',
      zIndex: '10',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: '200px',
    })

    const title = document.createElement('div')
    title.textContent = t('ui.buildMenu.title')
    Object.assign(title.style, {
      fontWeight: 'bold',
      marginBottom: '4px',
      borderBottom: '1px solid rgba(255,255,255,0.3)',
      paddingBottom: '4px',
    })
    this.el.appendChild(title)

    const resKeyMap = buildResKeyMap()

    for (const building of BUILDINGS) {
      const costEntries = Object.entries(building.cost)
      const costText =
        costEntries.length === 0
          ? t('ui.buildMenu.free')
          : costEntries
              .map(([resId, amount]) => {
                const key = resKeyMap[resId] ?? resId
                return `${t(key)}: ${amount}`
              })
              .join(', ')

      const btn = document.createElement('button')
      btn.textContent = `${t(building.i18nKey)} (${costText})`

      Object.assign(btn.style, {
        background: STYLE_BTN_DEFAULT,
        color: '#eee',
        border: `1px solid ${STYLE_BORDER_DEFAULT}`,
        borderRadius: '4px',
        padding: '4px 8px',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: '13px',
        textAlign: 'left',
      })

      const buildingId = building.id
      btn.addEventListener('click', () => {
        soundManager.playSound('ui.click')
        // Einheiten-Selektion aufheben
        this.applyUnitSelectionInternal(null)
        this.onUnitSelect(null)
        const next = buildingId === this.selectedId ? null : buildingId
        this.applySelection(next)
        this.onSelect(this.selectedId)
      })

      this.buttons.set(buildingId, btn)
      this.el.appendChild(btn)
    }

    // ---- Einheiten-Sektion ----
    const divider = document.createElement('div')
    Object.assign(divider.style, { borderTop: '1px solid rgba(255,255,255,0.3)', margin: '4px 0' })
    this.el.appendChild(divider)

    this.unitSectionTitle = document.createElement('div')
    this.unitSectionTitle.textContent = t('ui.recruitMenu.title')
    Object.assign(this.unitSectionTitle.style, { fontWeight: 'bold', marginBottom: '4px' })
    this.el.appendChild(this.unitSectionTitle)

    for (const unit of UNITS) {
      const costEntries = Object.entries(unit.cost)
      const costText =
        costEntries.length === 0
          ? t('ui.buildMenu.free')
          : costEntries.map(([resId, amount]) => {
              const key = resKeyMap[resId] ?? resId
              return `${t(key)}: ${amount}`
            }).join(', ')

      const btn = document.createElement('button')
      btn.textContent = `${t(unit.i18nKey)} (${costText})`
      btn.disabled = true
      Object.assign(btn.style, {
        background: STYLE_BTN_DEFAULT,
        color: '#aaa',
        border: `1px solid ${STYLE_BORDER_DEFAULT}`,
        borderRadius: '4px',
        padding: '4px 8px',
        cursor: 'not-allowed',
        fontFamily: 'monospace',
        fontSize: '13px',
        textAlign: 'left',
        opacity: '0.5',
      })

      const unitTypeId = unit.id
      btn.addEventListener('click', () => {
        if (btn.disabled) return
        soundManager.playSound('ui.click')
        const next = unitTypeId === this.selectedUnitId ? null : unitTypeId
        this.applyUnitSelection(next) // hebt Gebäude-Selektion auf wenn next !== null
        this.onUnitSelect(this.selectedUnitId)
      })

      this.unitButtons.set(unitTypeId, btn)
      this.el.appendChild(btn)
    }

    document.body.appendChild(this.el)
  }

  /** Aktiviert oder deaktiviert die Einheiten-Buttons je nach Kaserne-Verfügbarkeit. */
  setBarracksAvailable(available: boolean): void {
    for (const btn of this.unitButtons.values()) {
      btn.disabled = !available
      btn.style.color = available ? '#eee' : '#aaa'
      btn.style.cursor = available ? 'pointer' : 'not-allowed'
      btn.style.opacity = available ? '1' : '0.5'
    }
    this.unitSectionTitle.style.opacity = available ? '1' : '0.5'
    if (!available) {
      this.applyUnitSelectionInternal(null)
      this.onUnitSelect(null)
    }
  }

  private applyUnitSelectionInternal(unitTypeId: string | null): void {
    this.selectedUnitId = unitTypeId
    for (const [id, btn] of this.unitButtons) {
      if (id === this.selectedUnitId) {
        btn.style.background = STYLE_BTN_SELECTED
        btn.style.borderColor = STYLE_BORDER_SELECTED
      } else {
        btn.style.background = STYLE_BTN_DEFAULT
        btn.style.borderColor = STYLE_BORDER_DEFAULT
      }
    }
  }

  private applyUnitSelection(unitTypeId: string | null): void {
    if (unitTypeId !== null) {
      this.applySelection(null)
      this.onSelect(null)
    }
    this.applyUnitSelectionInternal(unitTypeId)
  }

  private applySelection(buildingId: string | null): void {
    this.selectedId = buildingId

    for (const [id, btn] of this.buttons) {
      if (id === this.selectedId) {
        btn.style.background = STYLE_BTN_SELECTED
        btn.style.borderColor = STYLE_BORDER_SELECTED
      } else {
        btn.style.background = STYLE_BTN_DEFAULT
        btn.style.borderColor = STYLE_BORDER_DEFAULT
      }
    }
  }

  destroy(): void {
    this.el.remove()
  }
}
