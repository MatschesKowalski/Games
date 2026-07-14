/**
 * Batch extractor: reads BSH files from ANNO_PATH and writes PNGs + sprite sheets.
 *
 * Usage:
 *   npx ts-node --esm scripts/run-extract.ts
 *   node --loader ts-node/esm scripts/run-extract.ts
 *
 * Output layout:
 *   assets/sprites/<bsh-name>/sprite_<idx>.png   — individual sprites
 *   assets/sprites/<bsh-name>/sheet.png           — combined sprite sheet
 *   assets/sprites/<bsh-name>/sheet.json          — [{x,y,w,h}] per sprite
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseBSH, parseCOL, defaultPalette, buildSpriteSheet, type Palette } from './extract-bsh';

const ANNO_PATH = process.env['ANNO_PATH'] ?? path.join(process.cwd(), 'Anno 1602');
const OUT_BASE = path.join(process.cwd(), 'assets', 'sprites');

const BSH_FILES = [
  'Stadtfld.bsh',
  'Soldat.bsh',
  'Traeger.bsh',
  'Ship.bsh',
  'Tiere.bsh',
  'Effekte.bsh',
  'schatten.bsh',
];

const PALETTE_FILE = path.join(ANNO_PATH, 'ToolGfx', 'STADTFLD.COL');

function loadPalette(): Palette {
  if (fs.existsSync(PALETTE_FILE)) {
    try {
      const buf = fs.readFileSync(PALETTE_FILE);
      const palette = parseCOL(buf);
      console.log(`Palette geladen: ${PALETTE_FILE}`);
      return palette;
    } catch (err) {
      console.warn(`Palette-Fehler (${PALETTE_FILE}): ${err} — Grayscale-Fallback`);
    }
  } else {
    console.warn(`Palette nicht gefunden: ${PALETTE_FILE} — Grayscale-Fallback`);
  }
  return defaultPalette();
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function extractBshFile(bshPath: string, palette: Palette): void {
  if (!fs.existsSync(bshPath)) {
    console.warn(`BSH nicht gefunden: ${bshPath} — übersprungen`);
    return;
  }

  const baseName = path.basename(bshPath, path.extname(bshPath)).toLowerCase();
  const outDir = path.join(OUT_BASE, baseName);
  ensureDir(outDir);

  console.log(`\nExtrahiere ${bshPath} → ${outDir}`);

  const buf = fs.readFileSync(bshPath);
  let sprites;
  try {
    sprites = parseBSH(buf, palette);
  } catch (err) {
    console.error(`  Fehler beim Parsen: ${err}`);
    return;
  }

  console.log(`  ${sprites.length} Sprites gefunden`);

  // Write individual PNGs (only non-empty sprites)
  let written = 0;
  for (let i = 0; i < sprites.length; i++) {
    const s = sprites[i];
    if (s.width === 0 || s.height === 0 || s.png.length === 0) continue;
    const outPath = path.join(outDir, `sprite_${i}.png`);
    fs.writeFileSync(outPath, s.png);
    written++;
  }
  console.log(`  ${written} individuelle PNGs geschrieben`);

  // Build and write sprite sheet
  try {
    const { sheet, metadata } = buildSpriteSheet(sprites);
    fs.writeFileSync(path.join(outDir, 'sheet.png'), sheet);
    fs.writeFileSync(
      path.join(outDir, 'sheet.json'),
      JSON.stringify(metadata, null, 2)
    );
    console.log(`  sheet.png + sheet.json geschrieben`);
  } catch (err) {
    console.error(`  Fehler beim Sprite-Sheet: ${err}`);
  }
}

function main(): void {
  const palette = loadPalette();
  ensureDir(OUT_BASE);

  for (const bshName of BSH_FILES) {
    const bshPath = path.join(ANNO_PATH, bshName);
    extractBshFile(bshPath, palette);
  }

  console.log('\nFertig.');
}

main();
