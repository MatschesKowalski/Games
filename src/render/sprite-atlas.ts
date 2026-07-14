import { Assets, Texture, Rectangle } from 'pixi.js'

type SpriteRect = { x: number; y: number; w: number; h: number }

/** Anno 1602 sprites are 16px wide; our tile grid uses 64px → scale 4×. */
export const SPRITE_SCALE = 4

const sheetTextures = new Map<string, Texture>()
const sheetMetas = new Map<string, SpriteRect[]>()
const spriteCache = new Map<string, Texture>()

async function loadSheet(sheetName: string): Promise<void> {
  if (sheetTextures.has(sheetName)) return

  // Vite injects BASE_URL at build time; cast through unknown for strict tsconfig
  const env = (import.meta as unknown as { env: { BASE_URL: string } }).env
  const base = env?.BASE_URL ?? '/'
  const pngUrl = `${base}sprites/${sheetName}/sheet.png`
  const jsonUrl = `${base}sprites/${sheetName}/sheet.json`

  const [texture, meta] = await Promise.all([
    Assets.load<Texture>(pngUrl),
    fetch(jsonUrl).then(r => r.json() as Promise<SpriteRect[]>),
  ])

  sheetTextures.set(sheetName, texture)
  sheetMetas.set(sheetName, meta)
}

export async function initSpriteAtlas(sheetNames: string[]): Promise<void> {
  await Promise.all(sheetNames.map(loadSheet))
}

export function isAtlasReady(sheetName: string): boolean {
  return sheetTextures.has(sheetName)
}

export function getSprite(sheetName: string, index: number): Texture {
  const key = `${sheetName}:${index}`
  const cached = spriteCache.get(key)
  if (cached) return cached

  const sheetTex = sheetTextures.get(sheetName)
  const meta = sheetMetas.get(sheetName)

  if (!sheetTex || !meta || index < 0 || index >= meta.length) {
    return Texture.EMPTY
  }

  const { x, y, w, h } = meta[index]
  if (w === 0 || h === 0) return Texture.EMPTY

  const tex = new Texture({
    source: sheetTex.source,
    frame: new Rectangle(x, y, w, h),
  })

  spriteCache.set(key, tex)
  return tex
}
