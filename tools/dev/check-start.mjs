import { existsSync } from 'node:fs';
import { error } from 'node:console';
import { URL } from 'node:url';
import process from 'node:process';

if (!existsSync(new URL('../../node_modules/vite/bin/vite.js', import.meta.url))) {
  error(
    'Entwicklungsabhängigkeiten fehlen. Im Projektordner zuerst npm ci --include=dev ausführen, danach npm run dev erneut starten.',
  );
  process.exitCode = 1;
}
