/**
 * Kopiert alle WAV-Dateien aus dem Anno 1602-Verzeichnis nach public/sounds/.
 *
 * Aufruf:
 *   npx ts-node scripts/copy-sounds.ts
 *
 * Umgebungsvariable:
 *   ANNO_PATH — Pfad zum Anno 1602-Verzeichnis (Standard: ./Anno 1602)
 *
 * Fehlende Anno-Dateien erzeugen nur eine Warnung, keinen Crash.
 * Das Spiel läuft auch ohne Anno-Assets (SoundManager hat Graceful Fallback).
 */

import * as fs from 'fs'
import * as path from 'path'

const ANNO_PATH = process.env['ANNO_PATH'] ?? path.join(process.cwd(), 'Anno 1602')
const TARGET_DIR = path.join(process.cwd(), 'public', 'sounds')

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`Verzeichnis erstellt: ${dir}`)
  }
}

function findWavFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return []
  }
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findWavFiles(fullPath))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.wav')) {
      results.push(fullPath)
    }
  }
  return results
}

function main(): void {
  console.log(`Anno-Pfad: ${ANNO_PATH}`)
  console.log(`Zielverzeichnis: ${TARGET_DIR}`)

  if (!fs.existsSync(ANNO_PATH)) {
    console.warn(
      `[WARNUNG] Anno 1602-Verzeichnis nicht gefunden: ${ANNO_PATH}\n` +
      `Setze ANNO_PATH=<Pfad> und führe das Script erneut aus.\n` +
      `Das Spiel läuft auch ohne Anno-Sounds (stummer Fallback).`
    )
    return
  }

  const wavFiles = findWavFiles(ANNO_PATH)
  if (wavFiles.length === 0) {
    console.warn(`[WARNUNG] Keine WAV-Dateien in ${ANNO_PATH} gefunden.`)
    return
  }

  ensureDir(TARGET_DIR)

  let copied = 0
  let skipped = 0

  for (const srcPath of wavFiles) {
    const filename = path.basename(srcPath)
    const destPath = path.join(TARGET_DIR, filename)

    if (fs.existsSync(destPath)) {
      console.log(`  Übersprungen (existiert bereits): ${filename}`)
      skipped++
      continue
    }

    try {
      fs.copyFileSync(srcPath, destPath)
      console.log(`  Kopiert: ${filename}`)
      copied++
    } catch (err) {
      console.warn(`  [WARNUNG] Konnte ${filename} nicht kopieren:`, err)
    }
  }

  console.log(`\nFertig: ${copied} Datei(en) kopiert, ${skipped} übersprungen.`)
}

main()
