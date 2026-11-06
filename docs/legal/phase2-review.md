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

## Tatsächliche Verarbeitung

Geprüft wurden Anwendungscode, Styles, Asset-Imports, Build und Pages-Workflow:

- Kein Spielkonto, eigenes Backend, Formularversand oder Übertragen des Spielstands.
- Rundenzustand nur im Arbeitsspeicher, Reset bei Reload.
- Keine Analyse, Werbung, fremden Schriftarten oder eingebetteten Dienste.
- Keine vom Spiel gesetzten Cookies, Session-Storage- oder IndexedDB-Nutzung.
- Nur die Sprachwahl wird unter `pixels-world.language` lokal gespeichert;
  Spielstände bleiben flüchtig. Die Datenschutzerklärung beschreibt dies.
- Externe Verweise sind normale Links; erst die Aktivierung öffnet GitHub oder
  die verlinkte Informationsseite. Keine Hintergrundabfrage dieser Seiten.
- Rechtsseiten sind statisches HTML/CSS und laden keinen Spielcode.

Die Aussage „keine eigenen Tracker“ bedeutet nicht „keine Hosting-Daten“:
[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection)
nennt die sicherheitsbezogene Protokollierung von Besucher-IP-Adressen.
GitHubs [Datenschutzerklärung](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
ist für dessen eigene Verarbeitung, internationale Übermittlungen und
Speicherkriterien verlinkt. Keine unbelegte feste Löschfrist wird versprochen.

Die Datenschutzhinweise nennen Verantwortlichen, Kontakt, Hosting, Zwecke und
Rechtsgrundlage, Speicherverhalten, externe Links, E-Mail-Anfragen und Rechte
nach der [DSGVO](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A02016R0679-20160504).
Der Hinweis auf die [Berliner Datenschutzaufsicht](https://www.datenschutz-berlin.de/)
ist ebenfalls direkt erreichbar. Ein technischer Produktions-Browserlauf prüft
zusätzlich Requests und die genannten Browserspeicher; er kann GitHubs interne
Protokolle oder die tatsächliche Bearbeitung von E-Mails nicht überprüfen.

## Änderungen mit neuer Prüfung

Vor neuen Hostingdiensten, externen Assets, Accounts, Speicherung, Tracking,
Monetarisierung oder Veröffentlichung anderer Kontaktdaten müssen Hinweise und
Bewertung angepasst werden. Der jetzige Stand führt weder Tracking noch einen
zusätzlichen Einwilligungsdialog ein. Die abschließende Betreiberfreigabe erfolgt
über den üblichen PR-Review vor dem Merge; der Release bleibt ein eigener Ablauf.
