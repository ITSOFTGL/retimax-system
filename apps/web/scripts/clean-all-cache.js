const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', '.next'),
  path.join(__dirname, '..', 'node_modules', '.cache'),
];

for (const target of targets) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`[retimax] Eliminado: ${target}`);
  }
}

console.log('[retimax] Caché web limpia. Ejecute pnpm dev:web');
