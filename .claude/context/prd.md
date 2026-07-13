# PRD — Aufbau/Defense-Endlosspiel (Kurzfassung)

**Ziel:** Aufbau/Defense-Endlosspiel im dunklen Mittelalter (Low Fantasy) mit
erzählerischer Tiefe à la Game of Thrones (Ton, nicht IP): bauen, verteidigen,
verhandeln, intrigieren, verheiraten. Erst Singleplayer, Architektur von Tag 1
multiplayerfähig.

**Stack:** TypeScript / PixiJS (isometrisch), deterministischer Simulationskern
getrennt von Rendering. Später: Node.js-Server (VPS, WebSockets) für Multiplayer.

**Kern-Loop:** Tag/Nacht-Zyklus, Fokus Aufbau, Verteidigung phasenweise (Angriffe
als Ereignisse). Karte mit Fog of War (nur Erkundetes bleibt sichtbar). Kampf als
Aufstellungs-Autobattle (kein RTS-Micro). 4–6 handgeschriebene Fraktionen mit
Persönlichkeit/Agenda. Story-Entscheidungs-Events (Frostpunk-Stil) mit Konsequenzen;
Diplomatie, Bündnisse, Heiraten, Intrigen.

**Phasenplan:**
1. **MVP:** Isometrische Karte, Bau-System, Ressourcenwirtschaft, Tag/Nacht-Zyklus,
   Speichern/Laden. Ziel: Aufbau-Loop macht allein schon Spaß.
2. Verteidigung: Angriffs-Ereignisse, Autobattle, Mauern/Türme/Truppen.
3. Welt: Fog of War, Erkundung, Nachbar-Häuser sichtbar, Grunddiplomatie.
4. Story-Schicht: Entscheidungs-Events, Intrigen, Heiraten, Bündnisse.
5. Multiplayer: Node-Server auf VPS, erst Koop (2–4), dann PvP; Accounts + DB.

**Out of Scope (aktuell):** Multiplayer-Implementierung vor Phase 5, feste
Missionsstruktur, geschützte GoT-Namen/Figuren, finale Asset-Pipeline (Platzhalter
bis dahin).

**Offene Punkte:** Arbeitstitel/Name, Ambitionsniveau (Hobby vs. Veröffentlichung
— bewusst offen), Details der KI-Asset-Pipeline. Vollständiges Konzept: `spielkonzept.md`.
