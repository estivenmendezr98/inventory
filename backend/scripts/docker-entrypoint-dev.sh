#!/bin/sh
set -e
cd /app

# El bind mount ./backend:/app aporta package.json/schema actualizados, pero
# /app/node_modules suele ser un volumen anónimo: puede quedar sin paquetes nuevos
# o con un Prisma Client generado con un schema viejo → Nest no compila y Nginx devuelve 502.
echo "[docker-entrypoint-dev] npm install + prisma generate + migrate deploy..."
npm install --no-audit --no-fund
npx prisma generate
npx prisma migrate deploy

exec "$@"
