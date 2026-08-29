#!/bin/sh
set -e
cd /app/apps/api
npx prisma migrate deploy
node prisma/seed.js
exec node dist/src/main.js
