# Spielprojekt – Übergabe an Claude Code

Arbeitstitel: offen · Stand: 13.07.2026 · Sprache im Projekt: Deutsch

## Vision
Aufbau/Defense-Endlosspiel im dunklen Mittelalter (Low Fantasy) mit erzählerischer
Tiefe à la Game of Thrones: bauen, verteidigen, verhandeln, intrigieren, verheiraten.
Erst Singleplayer; Architektur von Tag 1 multiplayerfähig (später Echtzeit-Koop und PvP).

## Technik (entschieden)
- **Stack:** TypeScript im Browser, Rendering mit **PixiJS**, Perspektive **isometrisch**.
- **Architektur:** Deterministischer **Simulationskern**, getrennt von Rendering/UI.
  Zustand ändert sich NUR über Befehle pro Tick (z. B. `baue(gebäude, x, y)`).
  Singleplayer: Eingabe → Befehle → Kern. Multiplayer später: Server (Node.js auf
  Cloud-VPS, WebSockets) verteilt dieselben Befehle. Kern muss headless in Node laufen.
- **Spielstände:** zunächst lokal (Datei/Export), Format DB-ready (serialisierbarer
  Gesamtzustand, versioniert) für spätere Server-Accounts.
- **i18n:** alle Texte ab Tag 1 in Sprachdateien (de zuerst), keine Strings im Code.
- **Assets:** KI-generiert angestrebt; bis eine konsistente Pipeline steht, mit
  Platzhaltern arbeiten. Nur lizenzrechtlich unbedenkliche Assets (Veröffentlichung offen).

## Spieldesign
- **Kern-Loop:** Tag/Nacht-Zyklus. Fokus auf Aufbau; Verteidigung phasenweise
  (Angriffe als Ereignisse, kein Dauerbeschuss). Endlosspiel, keine Missionsstruktur.
- **Karte/Fog of War:** stufenlos zoombare Weltkarte; nur besuchte/erkundete Bereiche
  dauerhaft sichtbar (WoW-artig). Information ist Ressource (Späher, Gerüchte).
- **Kampf:** Aufstellungs-Autobattle – Spieler platziert Mauern, Türme, Garnisonen,
  Truppen; Gefechte laufen sichtbar, aber automatisch ab. Kein RTS-Micro.
- **Fraktionen:** 4–6 handgeschriebene Häuser mit Persönlichkeit, Wappen, Agenda;
  prozedurale Häuser optional später.
- **Story:** Entscheidungs-Events (Frostpunk-Stil) mit Konsequenzen; Systeme für
  Diplomatie, Bündnisse, Heiraten, Intrigen (anzetteln und niederschlagen).
- **Ton:** GoT-inspiriert (Intrigen, harte Entscheidungen, wenig Magie) –
  KEINE Übernahme geschützter Namen/Figuren/Häuser.

## Phasenplan
1. **MVP:** Isometrische Karte, Bau-System, Ressourcenwirtschaft, Tag/Nacht-Zyklus,
   Speichern/Laden. Ziel: Der Aufbau-Loop macht allein schon Spaß.
2. Verteidigung: Angriffs-Ereignisse, Autobattle, Mauern/Türme/Truppen.
3. Welt: Fog of War, Erkundung, Nachbar-Häuser sichtbar, Grunddiplomatie.
4. Story-Schicht: Entscheidungs-Events, Intrigen, Heiraten, Bündnisse.
5. Multiplayer: Node-Server auf VPS, erst Koop (2–4), dann PvP; Accounts + DB.

## Offene Punkte
- Arbeitstitel/Name, Ambitionsniveau (Hobby vs. Veröffentlichung – bewusst offen,
  Struktur soll Veröffentlichung nicht verbauen), Details der KI-Asset-Pipeline.

## Arbeitsregeln für Claude Code
- Auf Deutsch kommunizieren. Nichts ohne Rückfrage aus dem Internet herunterladen.

