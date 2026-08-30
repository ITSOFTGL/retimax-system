const { execSync } = require('child_process');
const path = require('path');

require('./clean-all-cache.js');

const rootDir = path.join(__dirname, '..', '..', '..');
execSync('pnpm --filter @retimax/shared-types build', { cwd: rootDir, stdio: 'inherit' });
