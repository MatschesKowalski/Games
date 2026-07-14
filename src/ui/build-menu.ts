import { t } from '../i18n/index'
import { BUILDINGS } from '../content/buildings'
import { RESOURCES } from '../content/resources'

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
  private selectedId: string | null = null
  private readonly onSelect: (buildingId: string | null) => void

  constructor(onSelect: (buildingId: string | null) => void) {
    this.onSelect = onSelect

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
        const next = buildingId === this.selectedId ? null : buildingId
        this.applySelection(next)
        this.onSelect(this.selectedId)
      })

      this.buttons.set(buildingId, btn)
      this.el.appendChild(btn)
    }

    document.body.appendChild(this.el)
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
