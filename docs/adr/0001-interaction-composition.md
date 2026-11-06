# ADR 0001: Spielobjekte und kombinierbare Interaktionsfähigkeiten

- Datum: 2026-11-02
- Status: Implementiert; aktuelle Verträge siehe Architektur
- Kontext: [Gameplay-Architektur](../architecture/gameplay.md), [ursprüngliches Review #22](https://github.com/Skanky0815/pixels-world/issues/22)

## Anlass

Der Anlass beschreibt die ursprüngliche Entscheidungssituation. Aktuelle
Implementierungsdetails stehen in der verlinkten Architektur.

Die Szene bündelt Controls, Pixel, UI und drei Objektadapter. Die reinen Handlungsmodelle sind bereits getrennt, konkrete Objektidentitäten und ein gemeinsamer Ereignisvertrag fehlen aber. Neue Level und Objektarten (#21, #27–#31, #33/#35) benötigen unterschiedliche, kombinierbare Fähigkeiten. Ricos Ziel ist eine klare Klassen-/Objektstruktur mit isolierten Controls und UI.

## Entscheidung

Konkrete Klassen kapseln `Pixel`, `InputController`, `GameHud`, Szene und Spielobjekte. Spielregeln bleiben in kleinen reinen Modellen. Interaktionsobjekte kombinieren **funktionale Interfaces/Komponenten** wie `Interactable`, `Destructible` und `Climbable`, soweit ein aktuelles Verhalten sie braucht. IDs sind instanzbezogen; unveränderliche Schadensereignisse führen über einen gemeinsamen Score-Pfad zum vorhandenen Ledger. Der sichtbare Pixel bleibt vom Physikkörper getrennt.

`GoalTarget` und `PanicTrigger` sind vereinbarte Begriffe für spätere Funktionen, keine jetzt zu erzeugenden leeren Marker. Eine Scene/HUD-View-Klasse genügt für den aktuellen Raum. Die Engine erhält weiterhin ihren eigenen Game-Loop. Spielmodule liegen unter `src/game/`, Entwicklungswerkzeuge unter `src/dev/`. Raum- und Objektinhalte werden nach der Klassenextraktion zunächst typisiert unter `src/content/` gepflegt; ein JSON-Import folgt erst auf dem erprobten Vertrag mit expliziter Validierung. Es bleibt ein gemeinsames npm-/Vite-Projekt.

## Abgewogene Alternativen

| Alternative                                        | Nutzen                                             | Konsequenz                                                                                                                                                                                          |
| -------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alles in der Szene belassen                        | Geringster unmittelbarer Umbau                     | Neue Objekte, Controls und Anzeigen erhöhen die bereits belegte Kopplung und die Reset-Sonderfälle                                                                                                  |
| Eine abstrakte Phaser-Klasse für alle Interaktiven | Gemeinsame Hilfsmethoden schnell verfügbar         | Vase ist ein Physics-Image, Möbel können Graphics/Container/Flächen besitzen; ein fester Vererbungsbaum zwingt verschiedene Darstellungen in dieselbe Basis und erschwert kombinierbare Fähigkeiten |
| Vollständiges ECS / universelle Interaction-Engine | Sehr flexible spätere Kombination                  | Für vier konkrete Objektarten zusätzlicher Aufwand ohne nachgewiesenen Bedarf; höhere Migrations- und Debug-Kosten                                                                                  |
| Konkrete Besitzer plus kleine Fähigkeiten          | Klare Zuständigkeit bei erhaltener Spezialisierung | Benötigt eindeutige Verträge, IDs und expliziten Lebenszyklus; diese sind durch die aktuellen Befunde ohnehin erforderlich                                                                          |

## Folgen und Umsetzung

Ein neuer Gegenstand erweitert seine konkrete Klasse und die tatsächlich benötigten Fähigkeiten. UI- oder Tastenänderungen berühren keine Schadensregeln. Typisierte Datenübergänge und eine definierte Zielauswahl ersetzen direkte Zugriffe auf Tastatur und Pixel-Darstellung aus Möbelaktionen.

Die Umsetzung verwendet konkrete Adapter, instanzbezogene Ereignisse und den
getrennten Input-/HUD-Vertrag. Ein künftiger Content-Import oder Generator verwendet
denselben validierten Raumvertrag; er benötigt keine neue Objekthierarchie.
Aktuelle Aufgaben und Umsetzungsverlauf stehen in Issues und PRs.
