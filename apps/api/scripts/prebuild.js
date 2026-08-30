const { execSync } = require('child_process');
const path = require('path');

const appDir = path.join(__dirname, '..');
const rootDir = path.join(appDir, '..', '..');

execSync('pnpm exec prisma generate', { cwd: appDir, stdio: 'inherit' });
execSync('pnpm --filter @retimax/shared-types build', { cwd: rootDir, stdio: 'inherit' });
