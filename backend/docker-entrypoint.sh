#!/bin/sh
set -e

echo "⏳ Sincronizando esquema con la base de datos..."
# Crea/actualiza las tablas a partir de schema.prisma (no requiere migraciones versionadas).
npx prisma db push --skip-generate

echo "🌱 Sembrando datos de ejemplo (idempotente)..."
npm run seed || echo "Seed omitido."

echo "🚀 Iniciando API..."
exec npm run dev
