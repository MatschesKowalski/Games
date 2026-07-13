## Task 8: Tag/Nacht-Zyklus
**Status:** in_progress
**Start:** 2026-07-13

### Plan
1. src/sim/time.ts — getTimeOfDay(tick), Konstante TICKS_PER_DAY
2. src/sim/time.test.ts — Zyklus-Test
3. src/render/day-night-overlay.ts — visuelles Overlay mit weichem Übergang
4. src/main.ts erweitern — Overlay einbinden, Ticker-Update

### Entscheidungen
- TICKS_PER_DAY = 240 (120 Tag, 120 Nacht)
- Weicher Übergang: alpha-Interpolation eines dunklen Overlays
