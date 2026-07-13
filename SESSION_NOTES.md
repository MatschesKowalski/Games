## Task 2: i18n-Grundgerüst (Sprachdateien)
**Status:** in_progress
**Start:** 2026-07-13

### Plan
1. src/i18n/de.json — flache dot-notation Keys mit verschachtelter JSON-Struktur
2. src/i18n/index.ts — t(key)-Funktion mit loadLanguage() für spätere Erweiterung
3. src/i18n/index.test.ts — Vitest-Tests für t()

### Entscheidungen
- Nested JSON-Struktur ({"ui": {"resources": {"wood": "Holz"}}}), Zugriff via dot-notation
- Fehlt Key: Key selbst zurückgeben + console.warn (kein Crash)
