const fs = require('fs');
const path = require('path');

if (process.env.CI || process.env.RAILWAY || process.env.RAILWAY_ENVIRONMENT) {
  process.exit(0);
}

const nextDir = path.join(__dirname, '..', '.next');

if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('[retimax] Caché .next limpiada antes de iniciar dev');
  } catch {
    console.log('[retimax] No se pudo limpiar .next (omitido)');
  }
}
