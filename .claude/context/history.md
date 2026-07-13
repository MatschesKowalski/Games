# Architektur-Entscheidungen

## Stack: TypeScript + PixiJS, isometrisch
→ Browserbasiert, gute 2D-Performance, isometrische Perspektive passt zum
Aufbau/Defense-Genre. Entschieden vor Projektstart (siehe `spielkonzept.md`).

## Deterministischer Kern getrennt von Rendering
→ Architektur soll von Tag 1 multiplayerfähig sein (später Echtzeit-Koop/PvP über
Node.js-Server auf VPS). Nur ein deterministischer, befehlsbasierter Kern lässt
sich später von einem Server für mehrere Clients synchron halten.

## Speicherformat DB-ready, versioniert
→ Lokale Speicherstände sollen später ohne Formatbruch in Server-Accounts
überführt werden können.

## i18n ab Tag 1 (Deutsch zuerst)
→ Struktur soll eine spätere Veröffentlichung (auch international) nicht verbauen.
Keine Strings im Code, alles über Sprachdateien.

## Kampf: Aufstellungs-Autobattle statt RTS-Micro
→ Fokus des Spiels liegt auf Aufbau/Strategie, nicht auf Echtzeit-Geschicklichkeit.
Spieler platziert Verteidigung, Gefecht läuft sichtbar aber automatisch ab.

## Endlosspiel statt Missionsstruktur
→ Aufbau/Defense-Loop soll dauerhaft tragen, keine feste Kampagne mit Ende.

## Keine geschützten Namen/Figuren (GoT-Ton, keine GoT-IP)
→ Rechtliche Unbedenklichkeit; Struktur soll Veröffentlichung nicht verbauen.

## Assets: Platzhalter bis KI-Pipeline steht
→ Konsistente KI-generierte Asset-Pipeline ist noch offen; MVP arbeitet mit
einfachen Platzhaltern, um den Aufbau-Loop nicht zu blockieren.
