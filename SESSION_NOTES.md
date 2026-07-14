## Session 2026-07-14 — Task 13: BSH+COL-Parser (Sprite-Extraktion)

### Status: in_progress

### Analysierte Datei-Formate

**BSH-Dateistruktur (reverse-engineered aus tatsächlichen Dateien):**
- Magic: "BSH\0" (Bytes 0-3)
- 20-Byte-Header insgesamt (Bytes 4-15: fixe Konstanten, Byte 16-19: Datensektions-Größe)
- Offset-Tabelle ab Byte 20:
  - numSprites = table[0] / 4 (erster Tabelleneintrag geteilt durch 4)
  - Einträge sind RELATIVE Offsets ab Byte 20
- Sprite-Block bei (20 + table[i]):
  - uint32 width, uint32 height, uint32 unknown(=1), uint32 blockSize
  - (blockSize - 16) Bytes Pixel-Daten (RLE-kodiert)
- Pixel-Kodierung:
  - 0xFF = Ende Sprite (Rest transparent)
  - 0xFE = Ende Zeile (Rest der Zeile transparent)
  - Sonstige Bytes = [skip_count] [pixel_count] [pixel_count × Palette-Indizes]

**Palette (NICHT die .scp-Dateien!):**
- Alle .scp-Dateien sind INSEL5-Container (Insel/Szenario-Daten) — KEINE Palette
- Echte Palette: `Anno 1602/ToolGfx/STADTFLD.COL` (1044 Bytes)
  - Magic: "COL\0", gleicher 20-Byte-Header wie BSH
  - Datensatz ab Byte 20: 256 × 4 Bytes (R, G, B, 0=Padding)
  - Index 0 = transparent (Alpha=0)

**Sprite-Dimensionen (verifiziert):**
- Stadtfld.bsh: 5964 Sprites, erstes Sprite 16×8 (isometrische Terrain-Kachel ✓)
- Tiere.bsh: 720 Sprites, 13×13
- Numbers.bsh: 10 Sprites, 5×5

### Entscheidungen
- SCP-Dateien als Palette ignoriert (falsch dokumentiert im Task) — STADTFLD.COL verwenden
- Für alle BSH-Dateien: einheitliche Palette aus STADTFLD.COL
- Sprite-Sheet: zeilenbasiertes Packing (max. 4096px Breite)
- ts-node mit ESM für Node.js-Scripts

### QA-Ergebnis (2026-07-14)

QA: Alle Tests bestanden. 2026-07-14

**Akzeptanzkriterien Task 13:**
1. run-extract.ts Crash-free: BESTANDEN (bereits verifiziert)
2. Rauten-Form isometrische Kacheln: BESTANDEN (bereits verifiziert)
3. sheet.json korrekte Koordinaten: BESTANDEN (bereits verifiziert)
4. Transparenz Index 0 = Alpha=0: BESTANDEN (bereits verifiziert)
5. Kein pixi.js Import in Scripts: BESTANDEN (grep gibt keine Treffer)

Spiel-Tests (nicht Teil von Task 13): 89/89 Tests OK (9 Test-Dateien)

Alle 5 Akzeptanzkriterien erfüllt.
