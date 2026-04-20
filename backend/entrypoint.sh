#!/bin/sh
set -e

echo "⏳ Aguardando MySQL ficar disponível..."
until node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}).then(c => c.end()).catch(() => process.exit(1))
" 2>/dev/null; do
  sleep 2
done
echo "✅ MySQL disponível"

# Roda o seed apenas se a tabela metrics estiver vazia
SEED_COUNT=$(node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}).then(async c => {
  try {
    const [r] = await c.execute('SELECT COUNT(*) as n FROM metrics');
    console.log(r[0].n);
  } catch {
    console.log(0);
  }
  await c.end();
})
" 2>/dev/null || echo "0")

if [ "$SEED_COUNT" = "0" ]; then
  echo "🌱 Rodando seed..."
  node -r ts-node/register src/database/seed.ts || \
  node dist/database/seed.js
  echo "✅ Seed concluído"
else
  echo "ℹ️  Banco já possui dados ($SEED_COUNT registros), pulando seed"
fi

echo "🚀 Iniciando servidor..."
exec node dist/server.js
