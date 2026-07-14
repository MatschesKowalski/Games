/**
 * Web-Audio-API-basierter Sound-Manager (kein externes Framework).
 *
 * Sounds werden via fetch() aus /sounds/<filename> geladen und als
 * AudioBuffer gecacht. Fehlende Dateien erzeugen nur eine console.warn,
 * keinen Crash.
 *
 * Öffentliche API:
 *   playSound(id)   — einmaliger Sound
 *   playAmbient(id) — geloopter Hintergrundklang (nur ein Track gleichzeitig)
 *   stopAmbient()   — aktiven Ambient-Track stoppen
 *   setVolume(v)    — Master-Lautstärke 0.0–1.0
 */

import soundMapping from '../content/sound-mapping.json'

const SOUNDS_BASE = '/sounds/'

class SoundManager {
  private ctx: AudioContext | null = null
  private gain: GainNode | null = null
  private volume = 1.0
  private readonly cache = new Map<string, AudioBuffer>()
  private ambientSource: AudioBufferSourceNode | null = null
  private ambientId: string | null = null
  /** Incrementing counter to cancel in-flight ambient loads. */
  private ambientSeq = 0
  private readonly mapping: Record<string, string> = soundMapping as Record<string, string>

  // ── Kontext-Verwaltung ──────────────────────────────────────────────────

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.gain = this.ctx.createGain()
      this.gain.gain.value = this.volume
      this.gain.connect(this.ctx.destination)
    }
    // Browser-Autoplay-Policy: Context nach User-Interaktion fortsetzen.
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  // ── Datei laden + cachen ────────────────────────────────────────────────

  private async loadBuffer(filename: string): Promise<AudioBuffer | null> {
    const cached = this.cache.get(filename)
    if (cached) return cached

    let response: Response
    try {
      response = await fetch(`${SOUNDS_BASE}${filename}`)
    } catch (err) {
      console.warn(`[SoundManager] Netzwerkfehler beim Laden von ${filename}:`, err)
      return null
    }

    if (!response.ok) {
      console.warn(`[SoundManager] Datei nicht gefunden: ${filename} (HTTP ${response.status})`)
      return null
    }

    try {
      const arrayBuf = await response.arrayBuffer()
      const ctx = this.getCtx()
      const audioBuf = await ctx.decodeAudioData(arrayBuf)
      this.cache.set(filename, audioBuf)
      return audioBuf
    } catch (err) {
      console.warn(`[SoundManager] Dekodierung fehlgeschlagen für ${filename}:`, err)
      return null
    }
  }

  // ── Interne Mapping-Auflösung ───────────────────────────────────────────

  private resolveFilename(id: string): string | null {
    const filename = this.mapping[id]
    if (!filename) {
      console.warn(`[SoundManager] Kein Mapping für Sound-ID: "${id}"`)
      return null
    }
    return filename
  }

  // ── Öffentliche API ─────────────────────────────────────────────────────

  /** Spielt einen einmaligen Sound ab. Graceful fallback wenn Datei fehlt. */
  playSound(id: string): void {
    const filename = this.resolveFilename(id)
    if (!filename) return
    this._playSoundAsync(filename).catch((err: unknown) => {
      console.warn('[SoundManager] Fehler beim Abspielen:', err)
    })
  }

  private async _playSoundAsync(filename: string): Promise<void> {
    const buffer = await this.loadBuffer(filename)
    if (!buffer) return
    const ctx = this.getCtx()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.gain!)
    source.start()
  }

  /**
   * Startet einen geloopten Ambient-Track. Läuft bereits der gleiche Track,
   * passiert nichts. Ein laufender anderer Track wird vorher gestoppt.
   */
  playAmbient(id: string): void {
    if (this.ambientId === id) return
    this.stopAmbient()
    this.ambientId = id
    const seq = ++this.ambientSeq
    this._playAmbientAsync(id, seq).catch((err: unknown) => {
      console.warn('[SoundManager] Fehler beim Ambient-Sound:', err)
    })
  }

  private async _playAmbientAsync(id: string, seq: number): Promise<void> {
    const filename = this.resolveFilename(id)
    if (!filename) return
    const buffer = await this.loadBuffer(filename)
    if (!buffer || seq !== this.ambientSeq) return  // Überholt durch neueren Aufruf
    const ctx = this.getCtx()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.connect(this.gain!)
    source.start()
    if (seq === this.ambientSeq) {
      this.ambientSource = source
    } else {
      try { source.stop() } catch { /* bereits gestoppt */ }
      source.disconnect()
    }
  }

  /** Stoppt den aktuell laufenden Ambient-Track. */
  stopAmbient(): void {
    if (this.ambientSource) {
      try { this.ambientSource.stop() } catch { /* bereits gestoppt */ }
      this.ambientSource.disconnect()
      this.ambientSource = null
    }
    this.ambientId = null
  }

  /** Setzt die Master-Lautstärke (0.0 = stumm, 1.0 = voll). */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.gain) {
      this.gain.gain.value = this.volume
    }
  }
}

export const soundManager = new SoundManager()
