# Rechtliche Seiten, Quellen und Datenflüsse

Die öffentlichen Seiten liegen unter
`impressum.html` und `datenschutz.html`; sie sind aus Einführung, Spiel und
Ergebnis über denselben Footer erreichbar. Die internen Rechtsseiten öffnen nach Ricos Vorgabe im selben Tab. „Zum Spiel“
lädt die Einführung neu; ein laufender Spielstand wird dabei nicht gespeichert.

## Freigegebene Kontaktdaten

Rico hat ausdrücklich angewiesen, das Impressum aus seinem NerdBubble-Projekt
zu verwenden. Beide öffentlich vorhandenen Fassungen enthalten dieselben
Anbieter- und Kontaktdaten:

- [App-Impressum, festgehaltener Commit](https://github.com/Skanky0815/NerdBubble/blob/1875578cd9ca941626c0dd48220396387be20bdb/app/src/application/pages/Imprint.tsx)
- [Web-App-Impressum, derselbe Commit](https://github.com/Skanky0815/NerdBubble/blob/1875578cd9ca941626c0dd48220396387be20bdb/web-app/src/pages/imprint.tsx)

Übernommen wurden zunächst Name, Anschrift und E-Mail. Rico hat die Kontakt-E-Mail
anschließend ausdrücklich aktualisiert; beide Rechtsseiten verwenden diese neue Adresse. Die Anschrift wird hier und in
Issue-/PR-Beschreibungen nicht nochmals ausgeschrieben; die bewusste Übernahme
steht in den vorgesehenen öffentlichen Rechtsseiten. Es wurden keine weiteren
privaten Daten gesucht, ergänzt oder geraten. Ob die bereits veröffentlichten
Kontaktangaben weiterhin aktuell sind, ist bei der Betreiberreview zu prüfen.
Es gibt keine automatische Synchronisierung mit NerdBubble.

## Einordnung und Rechtsquellen

[§ 18 Abs. 1 MStV](https://www.gesetze-bayern.de/Content/Document/MStV-18)
verlangt für nicht ausschließlich persönliche/familiäre Telemedien eine
Anbieterkennzeichnung. Das öffentliche Spiel wird für diese Umsetzung vorsorglich
so eingeordnet; Name und Anschrift werden bereitgestellt.
[§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html) betrifft geschäftsmäßige,
in der Regel gegen Entgelt angebotene Dienste und nennt weitergehende Angaben.
Im geprüften Spielcode sind weder Werbung noch Bezahlangebote vorhanden. Das
allein ersetzt keine abschließende rechtliche Einzelfallbewertung. Ein öffentliches
Spiel ist insbesondere nicht automatisch wegen seines Hobbycharakters befreit.

Die alten NerdBubble-TMG-Verweise und pauschalen Haftungstexte wurden nicht kopiert.
Es werden keine nicht belegten Register-, Berufs- oder Steuerangaben erfunden.
Die Seiten sind eine dokumentierte Umsetzung anhand des Projektstands, keine
Zusage einer anwaltlichen Prüfung. Bei Monetarisierung oder redaktionellen Inhalten
muss die Einordnung vor Veröffentlichung erneut geprüft werden.

## Jugendschutz und Anbieter-Einstufung

Prüfgrundlage: öffentliches Browsergame, Rechtsrecherche aktualisiert am 13. November 2026.
Die [amtliche JMStV-Fassung](https://www.recht.sachsen.de/vorschrift/2410-Jugendmedienschutz-Staatsvertrag?follow_successor=no)
enthält die sichtbare Kennzeichnung in § 5c Abs. 3. § 25 Abs. 4 verschiebt ihre
Anwendung um sechs Monate nach Inkrafttreten. Die
[KJM bestätigt den 1. Juni 2026](https://www.kjm-online.de/themen/technischer-jugendmedienschutz/alterseinstufung/).
Für das eigene öffentlich zugängliche Spiel ist deshalb eine Kennzeichnung
vorzubereiten; Kostenfreiheit begründet hier keine Ausnahme. Eine ausschließlich
Erwachsenen zugängliche Verbreitung liegt nicht vor. Die besonderen Regeln für
gewinnorientierte Spieleplattformen nach § 14a JuSchG dürfen nicht mit dieser
allgemeinen Telemedienpflicht verwechselt werden.

Das [KJM-Infoblatt](https://www.kjm-online.de/fileadmin/user_upload/KJM/Themen/Technischer_Jugendmedienschutz/KJM_Infosheet_Kennzeichnungspflicht_2026.pdf)
erlaubt die Einstufung durch den Anbieter grundsätzlich ohne externe Prüfung.
Textform ist möglich; Alter und Gründe sollen gut lesbar vor dem Inhalt erscheinen.
Die Umsetzung verwendet deshalb eine eigene Textkennzeichnung in den Footern der öffentlichen Seiten
und am unteren Rand der Ladeseite vor Spielbeginn, kein USK-Logo und keine behauptete
behördliche Freigabe. Diese Anbieter-Einstufung ist von einer USK-Prüfung zu
unterscheiden. Der Betreiber muss ihre inhaltliche Begründung vor Veröffentlichung
prüfen und übernehmen.

### Vorschlag für die Betreiberreview: ab 6 Jahren

Die Einstufung ist eine begründete Projektbewertung, kein Ergebnis einer externen
Prüfstelle. Die [USK-Kriterien für sechsjährige Kinder](https://usk.de/alle-lexikonbegriffe/usk-ab-06-jahren/)
beschreiben kurze Spannungsmomente und durch Pausen gemilderten Handlungsdruck.
Daran orientiert sich der Vorschlag: Die Versöhnung verlangt kurze
Richtungseingaben mit begrenzter Reaktionszeit. Fehler führen zu weiteren Versuchen;
Pause ist möglich. Möbel kippen und zerbrechen cartoonhaft, ohne Verletzungen.
Katzengras löst einen kurzen Würgelaut aus. Saras Ärger und die Versöhnung sind
humorvoll inszeniert. Die Gründe lauten daher „Leichter Zeitdruck“ und
„Cartoon-Sachschäden“.

Der geprüfte Spielumfang enthält keine Kämpfe gegen Lebewesen, Blut, Sexualität,
Drogen, Glücksspiel, Werbung oder Käufe. Es gibt weder Spielerkonten, Chats,
Uploads noch Ranglisten. Albumfunde sind lokal; es gibt keine tägliche Belohnung,
Kaufaufforderung oder Bezahlschranke. Der Feedback-Link führt erst nach Aktivierung
zu GitHub, wo öffentliche Beiträge möglich sind; das ist keine Kommunikation im
Spiel. Neue Räume, Schreckeffekte, Texte und Onlinefunktionen benötigen eine neue
Bewertung. Die Altersangabe ist keine pädagogische Empfehlung.

### Technischer Jugendschutz: Umsetzung und verbleibende Host-Abhängigkeit

Die sichtbare Einstufung bleibt durch Ricos Review bestätigt. Zusätzlich liefern
alle vier öffentlichen HTML-Seiten `age-meta-label: age=6` aus. Ein solches Meta-Tag
ist allein kein nachgewiesener Schutzweg: [JusProg](https://www.jugendschutzprogramm.de/webseite-labeln/)
und die [technische Dokumentation](https://age-label.com/how-to/single-page-rating)
verlangen eine passende Datei am Host-Wurzelpfad.

Rico möchte `skanky0815.github.io/pixels-world/` beibehalten; eine eigene Domain
ist später vorgesehen. Der Spiel-Deploy kann `/pixels-world/` veröffentlichen,
jedoch keine Datei unter `https://skanky0815.github.io/age-de.xml` bereitstellen.
Das zusätzlich freigegebene [User-Pages-Repository](https://github.com/Skanky0815/skanky0815.github.io)
ist angelegt. [Host-PR #2](https://github.com/Skanky0815/skanky0815.github.io/pull/2)
bereitet die Root-Dateien und eine manuelle Veröffentlichung vor. GitHubs beim
Anlegen automatisch aktive Branch-Veröffentlichung wurde auf GitHub Actions
umgestellt; der Veröffentlichungsworkflow wurde nicht gestartet.

Die [Host-Konfiguration](https://github.com/Skanky0815/skanky0815.github.io/blob/feat/1-age-label/README.md)
aktiviert HTML-Meta-Auswertung für den exakten Einstieg `/pixels-world` und dessen
Unterpfade `/pixels-world/*`. Sie wird ausschließlich im Host-Repository gepflegt.
Der dortige Live-Check verlangt vor Veröffentlichung die Alters-Metadaten auf allen
vier öffentlichen Spielseiten; zuerst muss deshalb die Spielversion aus PR #286
regulär veröffentlicht werden. Der Sicherheits-Fallback `18` ist keine
inhaltliche Einstufung anderer Projekte; seine mögliche Filterwirkung außerhalb
des Spielpfads muss vor Übernahme geprüft werden. Keine pauschale Host-Einstufung
„ab 6“ und keine Veröffentlichung anderer Projekte durch diesen PR.

Danach sind Root-Datei (HTTP 200, XML-Inhalt), Pfadabgrenzung, beide Einstiege
und die Erkennung mit einem geeigneten Jugendschutzprogramm zu prüfen. Eine Datei
nur im Projektpfad und ein formal wohlgeformtes XML reichen als Nachweis nicht.
Dieser externe Bereitstellungs-/Filtertest bleibt in #252 offen.

### Rechtliche Grenze der technischen Vorbereitung

[§ 5 JMStV](https://www.gesetze-bayern.de/Content/Document/JMStV-5) unterscheidet
sichtbare Information und Schutzmaßnahmen; die Trennung von Kinderangeboten nach
Absatz 5 ist kein automatisch passender Ausweg für ein familienfreundliches
Katzenspiel. Die konkrete Anwendbarkeit bleibt gesondert zu beurteilen.

[§ 7 JMStV](https://www.gesetze-bayern.de/Content/Document/JMStV-7) knüpft an
Geschäftsmäßigkeit und entwicklungsbeeinträchtigende oder jugendgefährdende Inhalte
an. Kostenlosigkeit oder geringe Mitarbeiterzahl ergeben allein keine belegte
Befreiung. Die [KJM-FAQ](https://www.kjm-online.de/ueber-uns/fragen-und-antworten/)
und der [USK-Hinweis](https://usk.de/fuer-unternehmen/service-angebot-der-usk/jugendschutzbeauftragter/)
erläutern die Voraussetzungen. Ob das konkrete dauerhaft angebotene Spiel diese
Tatbestände erfüllt, ist weiterhin die präzise offene Einzelfrage. Es wird weder
eine externe Prüfung behauptet noch Rico als fachkundiger Beauftragter eingetragen.
Eine technische Kennzeichnung beantwortet diese organisatorische Rechtsfrage nicht.

## Tatsächliche Verarbeitung und Endgerätespeicher

Die Anwendung hat kein Backend und überträgt keine Rundeneingaben oder
Albumfunde. Rundenzustand und Chaospunkte sind flüchtig. Rechtsseiten sind
statisches HTML/CSS. Externe Quellen, GitHub und Feedback sind normale Links,
keine eingebetteten Dienste. Die Anwendung setzt keine Cookies und nutzt weder
Session Storage noch IndexedDB, Analyse, Werbung oder externe Schriften/Medien.

Die Zugriffe werden funktional getrennt:

| Daten                                              | Auslöser / Zweck                                                                                    | Begrenzung                                                                                                                                                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sprache, Audio, reduzierte Bewegung, Schwierigkeit | Gewählte Darstellung und Spielkonfiguration wiederherstellen.                                       | Nicht identifizierende Einstellungswerte; keine Statistik.                                                                                                                                                               |
| `pixels-world.storage`                             | Ausschließlich die zwei gewählten Funktionen Album/Offline merken.                                  | Standardmäßig beide aus; kein Identifikator. Eine Auswahl in einem anderen Tab wird übernommen.                                                                                                                          |
| `pixels-world.album`                               | Erst bei eingeschaltetem „Album für später merken“ lesen, migrieren und bestätigte Funde speichern. | Ohne Auswahl neue Funde nur im Arbeitsspeicher. Alte Daten bleiben unberührt, werden erst beim Aktivieren übernommen. Abschalten stoppt Lesen/Schreiben; ausdrückliches Zurücksetzen löscht gespeicherte Funde.          |
| Service Worker / Cache Storage                     | Erst auf „Offline-Spiel vorbereiten“ registrieren und vollständige Spieldateien vorhalten.          | Abschalten entfernt nur die genaue App-Registrierung und zugehörige Workbox-Caches. Alte automatische Kopien werden ohne gespeicherte Auswahl beim ersten neuen Spielaufruf entfernt. Andere Projekte bleiben unberührt. |
| `version.json`                                     | Kleine Online-Prüfung auf einen neuen Release.                                                      | Ohne Service Worker, mit `no-store`; keine Sammlung oder Eingaben übertragen. Neustart nur nach Bestätigung.                                                                                                             |
| Gewöhnlicher HTTP-Cache                            | Browserseitige Auslieferung bereits angeforderter Dateien.                                          | Vom zusätzlich angeforderten Offline-Cache getrennt.                                                                                                                                                                     |

Die [DSK-Orientierungshilfe](https://www.datenschutzkonferenz-online.de/media/oh/OH_Digitale_Dienste.pdf),
insbesondere Rn. 67–81, verlangt die Prüfung der konkreten gewünschten Funktion
und ihrer zeitlichen Notwendigkeit. Aus dem Aufruf eines Onlinespiels folgt kein
pauschaler Wunsch nach allen zusätzlichen Speicherfunktionen. Die Umsetzung
bezieht die Ausnahme des [§ 25 Abs. 2 Nr. 2 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html)
daher auf die ausdrücklich angeforderte Album-/Offline-Funktion, nicht auf eine
behauptete Erforderlichkeit für das bloße Onlinespiel. Die Wahl bleibt freiwillig;
keine Kopplung an den Spielstart und kein vorsorglicher allgemeiner Cookie-Banner.
Die zwei Entscheidungswerte sind erforderlich, um die Wahl wiederherzustellen.

Lokale Funde enthalten Varianten-IDs, keine Nutzerkennung. Es findet keine
Übermittlung von Sammlung oder Einstellungen an den Anbieter statt. Hosting-
und Kontaktverarbeitung nach DSGVO werden davon getrennt dargestellt. Die
[Datenschutzhinweise](../../datenschutz.html) beschreiben Auswahl, Rücknahme,
Bestandserhalt und Löschung. Gesperrter Browserspeicher verhindert das Spiel nicht;
die gewünschte Sammlung funktioniert dann für den aktuellen Besuch.

## Hosting, Kontakt und öffentliche Hinweise

[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection)
protokolliert Besucher-IP-Adressen aus Sicherheitsgründen, auch ohne Anmeldung.
GitHubs [Datenschutzerklärung](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
ist für dessen Verarbeitung, internationale Übermittlungen und Speicherkriterien
verlinkt. Die Anwendung verspricht keine unbelegte Löschfrist für Hostingdaten.
Ein lokaler Browserlauf kann Requests und Browserspeicher beobachten, aber weder
GitHubs interne Protokolle noch tatsächliche E-Mail-Bearbeitung nachweisen.

Die öffentlichen Datenschutzhinweise beschreiben Verantwortlichen, Hosting,
Einstellungen, Album, Offline-Dateien, externe Links, Kontakt und Betroffenenrechte.
Das Album wird seit #242 in den Optionen zurückgesetzt; die Beschreibung ist
entsprechend angepasst. Kontaktdaten bleiben unverändert. Die Einordnung aus #112
wird nicht durch eine pauschale Zusicherung „rechtssicher“ ersetzt.

## Verbleibende Arbeit aus #252

- [x] Anbieter-Einstufung „ab 6 Jahren“ und Begründung im normalen Review bestätigt.
- [x] Speicherfunktionen getrennt und freiwillig auswählbar; Bestandsdaten erhalten,
      explizite Löschung und eng begrenzte Offline-Rücknahme umgesetzt.
- [x] Öffentliche Datenschutzhinweise und Speicherinventar mit dem Code abgeglichen;
      freigegebene Kontaktdaten beibehalten. Keine unbelegten Hosting-Löschfristen.
- [x] HTML-Meta-Kennzeichnung und separaten Host-PR mit Live-Vorprüfung vorbereitet.
- [ ] Separate Host-Root-Bereitstellung abstimmen und tatsächliche Filtererkennung
      prüfen, einschließlich der Wirkung auf andere Pfade desselben Hosts.
- [ ] Die konkrete rechtliche Einzelfrage zu Schutzweg und § 7 abschließen.

Der Implementierungs-PR verweist deshalb mit **Refs #252** auf das Issue. Er
schließt es nicht und erklärt die offenen externen Punkte nicht automatisch
für erledigt. Neue Inhalte, Dienste, Speicherung, Tracking oder Monetarisierung
benötigen vor Veröffentlichung einen erneuten Abgleich. Release-Status und
laufende Testergebnisse gehören ins Issue beziehungsweise in Actions.
