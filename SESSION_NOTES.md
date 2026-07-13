## Task 6: Ressourcenwirtschaft (Typen, Produktion, Lagerung)
**Status:** in_progress
**Start:** 2026-07-13

### Plan
1. src/content/resources.ts — Ressourcentypen (Holz, Stein, Nahrung, Gold)
2. GameState.resources erweitern mit Startwerten
3. src/sim/production.ts — Produktionsfunktion pro Tick
4. src/sim/production.test.ts — Tests Kappung, Negativschutz, Akkumulation
5. src/i18n/de.json — Ressourcennamen prüfen (sollten schon vorhanden sein)

### Entscheidungen
- Platzhalter-Produktionsraten (ohne echte Gebäude) — in Task 7 durch Gebäude ersetzt
- Lagerkapazität als Konstante pro Ressourcentyp
