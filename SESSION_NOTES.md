## Task 4: Speichersystem (Serialisierung, Versionierung, lokaler Export/Import)
**Status:** in_progress
**Start:** 2026-07-13

### Plan
1. src/save/schema.ts — SaveFile-Typ mit version, savedAt, state
2. src/save/serialize.ts — serialize/deserialize + migrate()-Stub
3. src/save/local-file.ts — downloadSave/readSaveFile (Browser-APIs)
4. src/save/serialize.test.ts — Roundtrip-Test, Fehlerfall
5. src/i18n/de.json erweitern mit errors.save.* Keys

### Entscheidungen
- local-file.ts darf Browser-APIs nutzen (liegt in src/save/, nicht src/sim/)
- Validierung beim Laden: klarer Fehler über t(), kein Crash
