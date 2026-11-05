# Tooling-Abgleich zum Phase-1-Abschluss

## GitHub Actions (#65)

Alle direkt verwendeten JavaScript-Actions laufen mit Node 24 und sind auf geprüfte Commit-SHAs gepinnt: Checkout 7.0.1, Setup Node 7.1.0, Upload Artifact 7.0.2, Download Artifact 8.0.2, Configure Pages 6.0.0, Deploy Pages 5.0.1 und Release Please 5.0.0. Upload Pages Artifact 5.0.0 verwendet intern Upload Artifact 7. Der bestehende Test-Summary-Pin läuft bereits mit Node 24.

Die [Checkout-Hinweise](https://github.com/actions/checkout/blob/v7.0.1/README.md) betreffen neue Credential-Ablage und Schutz für privilegierte Fork-Workflows; hier werden Push, Pull Request, manuelle und wiederverwendbare Workflows genutzt. `persist-credentials: false` bleibt für Release/Pages erhalten. [Setup Node 7](https://github.com/actions/setup-node/blob/v7.1.0/README.md) entfernt einen Dummy-Auth-Token; dieses Projekt setzt keine Registry-Authentifizierung ein. `node-version: 22` und der explizite npm-Cache bleiben unverändert.

[Upload Artifact 7](https://github.com/actions/upload-artifact/blob/v7.0.2/README.md) archiviert standardmäßig weiterhin. Wir aktivieren keine direkten Einzeldatei-Uploads. [Download Artifact 8](https://github.com/actions/download-artifact/blob/v8.0.2/README.md) behält separate Verzeichnisse je Artefakt; Namen, Patterns und TAP-/XML-Pfade bleiben identisch. Die Digest-Prüfung wird nicht abgeschwächt. Pages behält sein offizielles TAR-Artefaktformat und die bestehenden Release-Identitätsprüfungen. [Release Please 5](https://github.com/googleapis/release-please-action/releases/tag/v5.0.0) stellt die Action auf Node 24 um; bestehende Inputs und Outputs bleiben in Gebrauch.

Alle Jobs verwenden ausdrücklich Ubuntu 24.04. Eine gleichzeitige Migration auf Ubuntu 26 würde die Zuordnung von Problemen zu Action- und Betriebssystemänderungen erschweren. Ubuntu 26 bleibt deshalb ein separater Evaluierungsschritt: Browserinstallation, Systempakete, beide Shards, Reports und Pages-Build zuerst in einer eigenen Prüfrunde nachweisen. Diese Änderung behauptet keine bereits erfolgte Ubuntu-26-Abnahme.

## minimatch (#66)

Der [Befund GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) betrifft minimatch 7 bis vor 11.0.1. Im bisherigen ESLint-/typescript-eslint-Baum steckte 10.2.6. Auch die aktuellen direkten Linter-Versionen fordern noch Version 10 an; ein normales Patch-Update reicht daher nicht aus.

Ein exakt gepinntes npm-Override auf **11.0.4** ersetzt diese transitive Entwicklungsabhängigkeit. Das ist ein bewusster Major-Wechsel, kein `npm audit fix --force` und kein Advisory-Ausschluss. Node 22 erfüllt die Paketvoraussetzung. Die Alternative eines Linter-Downgrades würde die gesamte Werkzeugkette zurücksetzen; ein eigener Fork oder ein kopierter Patch wäre dauerhaft aufwendiger.

Version 11 verändert intern den Matcher und entfernt bisherige API-Teile. Deshalb wurden die tatsächlichen Aufrufer und der vollständige Lint-Lauf geprüft: Die aktive ESLint-Konfigurationsauswahl nutzt `Minimatch`/`match`. Vorher und nachher erfasst ESLint dieselben 58 Dateien ohne Befunde. Typprüfung, Build und alle 45 Unit-Tests bestehen. Runtime-Audit und vollständiger Audit melden nach sauberem `npm ci` null Befunde. Browserprüfungen und GitHub-CI werden im zugehörigen PR mit tatsächlichen Ergebnissen ergänzt.

Das Override entfernen, sobald ESLint und typescript-eslint selbst einen gepatchten kompatiblen Bereich verwenden; dabei Lockfile, Lint-Dateiauswahl und Audits erneut prüfen. Der Runtime-Produktbaum wird durch das Entwicklungswerkzeug-Override nicht erweitert.
