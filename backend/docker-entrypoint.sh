#!/bin/sh
set -eu

npx prisma migrate deploy
npm run db:seed
exec node dist/src/server.js
