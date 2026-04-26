/**
 * Seed Script — gera dados fictícios realistas para demo
 * Executa: npm run seed
 */

import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT) || 5432,
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME     || 'dashboard_analytics',
      }
);

const CATEGORIES = [
  { name: 'Vendas',     color: '#6366f1' },
  { name: 'Marketing',  color: '#f59e0b' },
  { name: 'Operações',  color: '#10b981' },
  { name: 'Financeiro', color: '#ef4444' },
  { name: 'RH',         color: '#8b5cf6' },
];

const METRIC_NAMES: Record<string, string[]> = {
  Vendas:     ['Receita Bruta', 'Tickets Vendidos', 'Conversão'],
  Marketing:  ['Leads Gerados', 'Impressões', 'Cliques'],
  Operações:  ['Pedidos Processados', 'Tempo Médio', 'SLA Atingido'],
  Financeiro: ['Faturamento', 'Custo Operacional', 'Margem Líquida'],
  RH:         ['Colaboradores Ativos', 'Horas Extras', 'Satisfação'],
};

const BASE_VALUES: Record<string, number> = {
  Vendas:     50_000,
  Marketing:  15_000,
  Operações:   8_000,
  Financeiro: 120_000,
  RH:          3_000,
};

function gaussianRandom(mean: number, stddev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function seasonalFactor(month: number): number {
  return 1 + 0.4 * Math.sin(((month - 2) / 12) * 2 * Math.PI);
}

function trendFactor(dayOfYear: number): number {
  return 1 + (dayOfYear / 365) * 0.3;
}

function addDays(date: Date, days: number): Date {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Gera placeholders numerados para batch insert do pg
// Ex: batchOf(3, 4) → "($1,$2,$3,$4),($5,$6,$7,$8),($9,$10,$11,$12)"
function batchPlaceholders(rowCount: number, colCount: number): string {
  return Array.from({ length: rowCount }, (_, ri) =>
    `(${Array.from({ length: colCount }, (_, ci) => `$${ri * colCount + ci + 1}`).join(',')})`
  ).join(',');
}

async function createTables(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(100) NOT NULL UNIQUE,
      color      VARCHAR(7)   NOT NULL,
      created_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS metrics (
      id          SERIAL PRIMARY KEY,
      category_id INT           NOT NULL,
      metric_name VARCHAR(150)  NOT NULL,
      value       NUMERIC(15,2) NOT NULL,
      date        DATE          NOT NULL,
      created_at  TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_metrics_cat FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_metrics_date     ON metrics(date)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_metrics_category ON metrics(category_id)`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS daily_summary (
      id          SERIAL PRIMARY KEY,
      date        DATE          NOT NULL,
      total_value NUMERIC(15,2) NOT NULL,
      total_count INT           NOT NULL,
      category_id INT           NOT NULL,
      created_at  TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (date, category_id),
      CONSTRAINT fk_summary_cat FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_ds_date ON daily_summary(date)`);

  console.log('✅ Tabelas criadas/verificadas');
}

async function seed(): Promise<void> {
  console.log('🔌 Conectando ao PostgreSQL...');
  const client = await pool.connect();
  console.log('✅ Conexão estabelecida');

  try {
    await createTables(client);

    // Limpa dados em ordem de FK
    await client.query('DELETE FROM daily_summary');
    await client.query('DELETE FROM metrics');
    await client.query('DELETE FROM categories');
    console.log('🗑️  Dados anteriores removidos');

    // Insere categorias
    const categoryIds: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      const result = await client.query<{ id: number }>(
        'INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING id',
        [cat.name, cat.color]
      );
      categoryIds[cat.name] = result.rows[0].id;
    }
    console.log('✅ Categorias inseridas');

    // Gera 12 meses de dados
    const endDate   = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 1);

    const metricRows:  Array<[number, string, number, string]>  = [];
    const summaryRows: Array<[string, number, number, number]>  = [];

    let current   = new Date(startDate);
    let dayOfYear = 0;

    while (current <= endDate) {
      dayOfYear++;
      const month      = current.getMonth() + 1;
      const dateStr    = formatDate(current);
      const seasonal   = seasonalFactor(month);
      const trend      = trendFactor(dayOfYear);
      const weekFactor = [0, 6].includes(current.getDay()) ? 0.6 : 1.0;

      for (const cat of CATEGORIES) {
        const catId  = categoryIds[cat.name];
        const base   = BASE_VALUES[cat.name];
        const names  = METRIC_NAMES[cat.name];
        let catTotal = 0;

        for (const metricName of names) {
          const raw   = gaussianRandom(base * seasonal * trend * weekFactor, base * 0.15);
          const value = Math.max(0, Math.round(raw * 100) / 100);
          metricRows.push([catId, metricName, value, dateStr]);
          catTotal += value;
        }
        summaryRows.push([dateStr, catTotal, names.length, catId]);
      }

      current = addDays(current, 1);
    }

    // Insere em lotes de 100 linhas
    const BATCH = 100;

    for (let i = 0; i < metricRows.length; i += BATCH) {
      const batch = metricRows.slice(i, i + BATCH);
      await client.query(
        `INSERT INTO metrics (category_id, metric_name, value, date) VALUES ${batchPlaceholders(batch.length, 4)}`,
        batch.flat()
      );
    }
    console.log(`✅ ${metricRows.length} métricas inseridas`);

    for (let i = 0; i < summaryRows.length; i += BATCH) {
      const batch = summaryRows.slice(i, i + BATCH);
      await client.query(
        `INSERT INTO daily_summary (date, total_value, total_count, category_id) VALUES ${batchPlaceholders(batch.length, 4)}`,
        batch.flat()
      );
    }
    console.log(`✅ ${summaryRows.length} resumos diários inseridos`);

    console.log('\n🎉 Seed concluído com sucesso!');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
