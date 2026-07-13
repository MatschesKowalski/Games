import type { SaveFile } from './schema'
import { t } from '../i18n/index'

/**
 * Löst einen Browser-Download der Speicherdatei als JSON aus.
 * Erzeugt einen temporären <a>-Link, klickt ihn und räumt danach auf.
 */
export function downloadSave(save: SaveFile): void {
  const json = JSON.stringify(save, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'aufbau-spiel-speicherstand.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Liest eine vom Nutzer gewählte JSON-Datei und gibt deren Inhalt als SaveFile zurück.
 * Wirft bei Parse-Fehler oder fehlendem version-Feld.
 */
export async function readSaveFile(file: File): Promise<SaveFile> {
  let parsed: unknown

  try {
    const text = await file.text()
    parsed = JSON.parse(text)
  } catch {
    throw new Error(t('errors.save.invalid'))
  }

  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    !('version' in (parsed as object))
  ) {
    throw new Error(t('errors.save.invalid'))
  }

  return parsed as SaveFile
}
