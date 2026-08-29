const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');

if (!fs.existsSync(nextDir)) {
  process.exit(0);
}

// Production build artifacts inside .next break `next dev` on Windows.
const productionMarkers = ['standalone', 'export-marker.json'];
const shouldClean = productionMarkers.some((marker) =>
  fs.existsSync(path.join(nextDir, marker)),
);

if (shouldClean) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('[retimax] Se limpió caché de producción en .next antes de iniciar dev');
}
