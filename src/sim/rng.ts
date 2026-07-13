/**
 * Mulberry32 — seeded pseudo-random number generator.
 * Returns a function that produces the next number in [0, 1) on every call.
 * Same seed always yields the same sequence (deterministic).
 * Never uses Math.random().
 */
export function createRng(seed: number): () => number {
  let s = seed >>> 0
  return (): number => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), s | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
