const fs = require('fs');
const path = require('path');

if (process.env.CI || process.env.RAILWAY || process.env.RAILWAY_ENVIRONMENT) {
  console.log('[retimax] Omitiendo limpieza de caché en CI/Railway');
} else {
  const targets = [
    path.join(__dirname, '..', '.next'),
    path.join(__dirname, '..', 'node_modules', '.cache'),
  ];

  for (const target of targets) {
    if (fs.existsSync(target)) {
      try {
        fs.rmSync(target, { recursive: true, force: true });
        console.log(`[retimax] Eliminado: ${target}`);
      } catch {
        console.log(`[retimax] No se pudo eliminar ${target} (omitido)`);
      }
    }
  }

  console.log('[retimax] Caché web limpia.');
}
