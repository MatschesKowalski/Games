import type { GameState } from '../sim/state'
import { CURRENT_VERSION } from './schema'
import type { SaveFile } from './schema'
import { t } from '../i18n/index'

/**
 * Stub-Migration: bei version === CURRENT_VERSION unverändert durchreichen.
 * Künftige Versionen: hier weitere Fälle ergänzen.
 */
function migrate(save: SaveFile): SaveFile {
  if (save.version === CURRENT_VERSION) {
    return save
  }
  // Zukünftige Migrationen hier ergänzen, z.B.:
  // if (save.version === 0) { return migrateV0toV1(save) }
  return save
}

/**
 * Verpackt einen GameState in eine SaveFile-Struktur.
 * savedAt wird als ISO-Zeitstempel des Speicherzeitpunkts gesetzt.
 */
export function serialize(state: GameState): SaveFile {
  return {
    version: CURRENT_VERSION,
    savedAt: new Date().toISOString(),
    state,
  }
}

/**
 * Liest einen GameState aus einer SaveFile-Struktur zurück.
 * Wirft bei ungültigem Format, führt ggf. Migration durch.
 */
export function deserialize(save: unknown): GameState {
  if (save === null || save === undefined || typeof save !== 'object') {
    throw new Error(t('errors.save.invalid'))
  }

  const obj = save as Record<string, unknown>

  if (!('version' in obj) || !('state' in obj)) {
    throw new Error(t('errors.save.invalid'))
  }

  const migrated = migrate(obj as SaveFile)
  return migrated.state
}
