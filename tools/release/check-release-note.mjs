import { readFileSync } from 'node:fs';
import process from 'node:process';
import { generatedVersionPr, releaseNote } from './release-note.mjs';

const event = JSON.parse(readFileSync(process.argv[2], 'utf8'));
if (!event.pull_request) throw new Error('Pull-Request-Ereignis fehlt.');
if (generatedVersionPr(event.pull_request)) {
  process.stdout.write(
    'Automatisch erzeugter Versions-PR: Release Please liefert die Release Notes.\n',
  );
} else {
  releaseNote(event.pull_request.body ?? '');
  process.stdout.write(
    'Eine kanonische Release Note vorhanden. Englischen Wortlaut im Review prüfen.\n',
  );
}
