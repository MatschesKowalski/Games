/**
 * BSH sprite extractor + COL palette parser for Anno 1602.
 *
 * BSH format (reverse-engineered):
 *   [0-3]   "BSH\0" magic
 *   [4-15]  fixed constants (ignored)
 *   [16-19] uint32 = file_size - 20
 *   [20+]   offset table (relative to byte 20):
 *             numSprites = table[0] / 4
 *             Each entry points to a sprite block.
 *   Sprite block at (20 + table[i]):
 *     uint32 width, uint32 height, uint32 unknown, uint32 blockSize
 *     (blockSize - 16) bytes pixel data (RLE):
 *       0xFF = end of sprite
 *       0xFE = end of row (remaining pixels in row = transparent)
 *       else = skip_count, then pixel_count, then pixel_count palette indices
 *
 * COL format (palette):
 *   [0-3]   "COL\0" magic
 *   [4-19]  fixed constants (ignored)
 *   [20+]   256 × 4 bytes: (R, G, B, 0) — index 0 = transparent
 */

import { PNG } from 'pngjs';

export interface SpriteInfo {
  width: number;
  height: number;
  png: Buffer;
}

export type Palette = [number, number, number, number][]; // [r, g, b, a]

const BSH_MAGIC = 0x00485342; // "BSH\0" as uint32 LE
const COL_MAGIC = 0x004c4f43; // "COL\0" as uint32 LE

export function parseCOL(buf: Buffer): Palette {
  if (buf.readUInt32LE(0) !== COL_MAGIC) {
    throw new Error('Not a COL file (wrong magic)');
  }
  const palette: Palette = [];
  const dataStart = 20;
  for (let i = 0; i < 256; i++) {
    const offset = dataStart + i * 4;
    const r = buf[offset];
    const g = buf[offset + 1];
    const b = buf[offset + 2];
    // index 0 = transparent, rest = fully opaque
    const a = i === 0 ? 0 : 255;
    palette.push([r, g, b, a]);
  }
  return palette;
}

export function defaultPalette(): Palette {
  const p: Palette = [[0, 0, 0, 0]]; // index 0 = transparent
  for (let i = 1; i < 256; i++) {
    p.push([i, i, i, 255]); // grayscale fallback
  }
  return p;
}

export function parseBSH(buf: Buffer, palette: Palette): SpriteInfo[] {
  if (buf.readUInt32LE(0) !== BSH_MAGIC) {
    throw new Error('Not a BSH file (wrong magic)');
  }

  const table0 = buf.readUInt32LE(20);
  const numSprites = table0 / 4;
  if (!Number.isInteger(numSprites) || numSprites < 0 || numSprites > 100000) {
    throw new Error(`Unexpected numSprites: ${numSprites}`);
  }

  const sprites: SpriteInfo[] = [];

  for (let i = 0; i < numSprites; i++) {
    const relOffset = buf.readUInt32LE(20 + i * 4);
    const absOffset = 20 + relOffset;

    if (absOffset + 16 > buf.length) {
      // Invalid offset — skip with empty placeholder
      sprites.push({ width: 0, height: 0, png: Buffer.alloc(0) });
      continue;
    }

    const width = buf.readUInt32LE(absOffset);
    const height = buf.readUInt32LE(absOffset + 4);
    // absOffset+8: unknown field (skip)
    const blockSize = buf.readUInt32LE(absOffset + 12);

    if (width === 0 || height === 0 || blockSize < 16) {
      sprites.push({ width: 0, height: 0, png: Buffer.alloc(0) });
      continue;
    }

    const pixelDataLength = blockSize - 16;
    const pixelDataStart = absOffset + 16;
    const pixelDataEnd = pixelDataStart + pixelDataLength;

    // RGBA image buffer (all transparent by default)
    const rgba = Buffer.alloc(width * height * 4, 0);

    let pos = pixelDataStart;
    let x = 0;
    let y = 0;
    let done = false;

    while (pos < pixelDataEnd && y < height && !done) {
      const cmd = buf[pos++];

      if (cmd === 0xff) {
        done = true;
        break;
      }

      if (cmd === 0xfe) {
        // End of row: move to next row
        y++;
        x = 0;
        continue;
      }

      // cmd = skip count (transparent pixels)
      const skip = cmd;
      x += skip;

      if (pos >= pixelDataEnd) break;
      const count = buf[pos++];

      for (let p = 0; p < count && pos < pixelDataEnd; p++, pos++) {
        if (x < width && y < height) {
          const paletteIdx = buf[pos];
          const [r, g, b, a] = palette[paletteIdx] ?? palette[0];
          const pixelOffset = (y * width + x) * 4;
          rgba[pixelOffset] = r;
          rgba[pixelOffset + 1] = g;
          rgba[pixelOffset + 2] = b;
          rgba[pixelOffset + 3] = a;
        }
        x++;
      }
    }

    const png = new PNG({ width, height, filterType: -1 });
    png.data = rgba;
    const pngBuffer = PNG.sync.write(png);

    sprites.push({ width, height, png: pngBuffer });
  }

  return sprites;
}

export interface SheetResult {
  sheet: Buffer;
  metadata: Array<{ x: number; y: number; w: number; h: number }>;
}

export function buildSpriteSheet(sprites: SpriteInfo[]): SheetResult {
  const MAX_SHEET_WIDTH = 4096;
  const metadata: Array<{ x: number; y: number; w: number; h: number }> = [];

  // First pass: compute layout (row-based packing)
  let curX = 0;
  let curY = 0;
  let rowMaxH = 0;

  const positions: Array<{ x: number; y: number }> = [];

  for (const s of sprites) {
    if (s.width === 0 || s.height === 0) {
      positions.push({ x: 0, y: 0 });
      continue;
    }
    if (curX + s.width > MAX_SHEET_WIDTH && curX > 0) {
      curY += rowMaxH;
      curX = 0;
      rowMaxH = 0;
    }
    positions.push({ x: curX, y: curY });
    curX += s.width;
    if (s.height > rowMaxH) rowMaxH = s.height;
  }
  const sheetH = curY + rowMaxH;

  // Find actual max width used
  let actualW = 0;
  for (let i = 0; i < sprites.length; i++) {
    const pos = positions[i];
    const s = sprites[i];
    if (s.width > 0) {
      actualW = Math.max(actualW, pos.x + s.width);
    }
  }
  if (actualW === 0) actualW = 1;

  const sheetPng = new PNG({ width: actualW, height: Math.max(1, sheetH), filterType: -1 });
  sheetPng.data = Buffer.alloc(actualW * Math.max(1, sheetH) * 4, 0);

  for (let i = 0; i < sprites.length; i++) {
    const s = sprites[i];
    const pos = positions[i];
    metadata.push({ x: pos.x, y: pos.y, w: s.width, h: s.height });

    if (s.width === 0 || s.height === 0 || s.png.length === 0) continue;

    // Parse source PNG and blit into sheet
    const src = PNG.sync.read(s.png);
    for (let row = 0; row < s.height; row++) {
      for (let col = 0; col < s.width; col++) {
        const srcIdx = (row * s.width + col) * 4;
        const dstIdx = ((pos.y + row) * actualW + (pos.x + col)) * 4;
        sheetPng.data[dstIdx] = src.data[srcIdx];
        sheetPng.data[dstIdx + 1] = src.data[srcIdx + 1];
        sheetPng.data[dstIdx + 2] = src.data[srcIdx + 2];
        sheetPng.data[dstIdx + 3] = src.data[srcIdx + 3];
      }
    }
  }

  return {
    sheet: PNG.sync.write(sheetPng),
    metadata,
  };
}
