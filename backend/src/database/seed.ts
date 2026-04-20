/**
 * Seed Script — gera dados fictícios realistas para demo
 * Executa: npm run seed
 *
 * Cria:
 *  - 5 categorias com cores distintas
 *  - ~5000+ registros diários nos últimos 12 meses
 *  - Variação não-linear (sazonal + tendência + ruído gaussiano)
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ─── Pool de conexão ────────────────────────────────────────
const pool = mysql.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  port:             Number(process.env.DB_PORT) || 3306,
  user:             process.env.DB_USER     || 'dashboard_user',
  password:         process.env.DB_PASSWORD || 'dashboard_pass',
  database:         process.env.DB_NAME     || 'dashboard_analytics',
  waitForConnections: true,
  connectionLimit:  10,
});

// ─── Categorias ────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Vendas',     color: '#6366f1' },
  { name: 'Marketing',  color: '#f59e0b' },
  { name: 'Operações',  color: '#10b981' },
  { name: 'Financeiro', color: '#ef4444' },
  { name: 'RH',         color: '#8b5cf6' },
];

// ─── Nomes de métricas por categoria ───────────────────────
const METRIC_NAMES: Record<string, string[]> = {
  Vendas:     ['Receita Bruta', 'Tickets Vendidos', 'Conversão'],
  Marketing:  ['Leads Gerados', 'Impressões', 'Cliques'],
  Operações:  ['Pedidos Processados', 'Tempo Médio', 'SLA Atingido'],
  Financeiro: ['Faturamento', 'Custo Operacional', 'Margem Líquida'],
  RH:         ['Colaboradores Ativos', 'Horas Extras', 'Satisfação'],
};

// Valores base por categoria
const BASE_VALUES: Record<string, number> = {
  Vendas:     50_000,
  Marketing:  15_000,
  Operações:   8_000,
  Financeiro: 120_000,
  RH:          3_000,
};

// Ruído gaussiano (Box-Muller)
function gaussianRandom(mean: number, stddev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Fator sazonal: pico em dezembro, vale em fevereiro
function seasonalFactor(month: number): number {
  return 1 + 0.4 * Math.sin(((month - 2) / 12) * 2 * Math.PI);
}

// Tendência crescente ao longo do ano
function trendFactor(dayOfYear: number): number {
  return 1 + (dayOfYear / 365) * 0.3;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── DDL ────────────────────────────────────────────────────
async function createTables(conn: mysql.Connection): Promise<void> {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(100) NOT NULL UNIQUE,
      color      VARCHAR(7)   NOT NULL,
      created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS metrics (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT           NOT NULL,
      metric_name VARCHAR(150)  NOT NULL,
      value       DECIMAL(15,2) NOT NULL,
      date        DATE          NOT NULL,
      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_date     (date),
      INDEX idx_category (category_id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS daily_summary (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      date        DATE          NOT NULL,
      total_value DECIMAL(15,2) NOT NULL,
      total_count INT           NOT NULL,
      category_id INT           NOT NULL,
      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_date_cat (date, category_id),
      INDEX idx_ds_date (date),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  console.log('✅ Tabelas criadas/verificadas');
}

// ─── Seed Principal ─────────────────────────────────────────
async function seed(): Promise<void> {
  console.log('🔌 Conectando ao MySQL...');
  const conn = await pool.getConnection();
  console.log('✅ Conexão estabelecida');

  try {
    await createTables(conn);

    // Limpa dados em ordem de FK
    await conn.execute('DELETE FROM daily_summary');
    await conn.execute('DELETE FROM metrics');
    await conn.execute('DELETE FROM categories');
    console.log('🗑️  Dados anteriores removidos');

    // Insere categorias
    const categoryIds: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      const [result] = await conn.execute<mysql.ResultSetHeader>(
        'INSERT INTO categories (name, color) VALUES (?, ?)',
        [cat.name, cat.color]
      );
      categoryIds[cat.name] = result.insertId;
    }
    console.log('✅ Categorias inseridas');

    // Gera 12 meses de dados diários
    const endDate   = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 1);

    const metricRows: Array<[number, string, number, string]>  = [];
    const summaryRows: Array<[string, number, number, number]> = [];

    let currentDate = new Date(startDate);
    let dayOfYear   = 0;

    while (currentDate <= endDate) {
      dayOfYear++;
      const month     = currentDate.getMonth() + 1;
      const dateStr   = formatDate(currentDate);
      const seasonal  = seasonalFactor(month);
      const trend     = trendFactor(dayOfYear);
      const isWeekend = [0, 6].includes(currentDate.getDay());
      const weekFactor = isWeekend ? 0.6 : 1.0;

      for (const cat of CATEGORIES) {
        const catId  = categoryIds[cat.name];
        const base   = BASE_VALUES[cat.name];
        const names  = METRIC_NAMES[cat.name];
        let catTotal = 0;

        for (const metricName of names) {
          const rawValue = gaussianRandom(
            base * seasonal * trend * weekFactor,
            base * 0.15
          );
          const value = Math.max(0, Math.round(rawValue * 100) / 100);
          metricRows.push([catId, metricName, value, dateStr]);
          catTotal += value;
        }

        summaryRows.push([dateStr, catTotal, names.length, catId]);
      }

      currentDate = addDays(currentDate, 1);
    }

    // Insere em lotes de 200
    const BATCH = 200;
    for (let i = 0; i < metricRows.length; i += BATCH) {
      const batch       = metricRows.slice(i, i + BATCH);
      const placeholders = batch.map(() => '(?,?,?,?)').join(',');
      await conn.execute(
        `INSERT INTO metrics (category_id, metric_name, value, date) VALUES ${placeholders}`,
        batch.flat()
      );
    }
    console.log(`✅ ${metricRows.length} métricas inseridas`);

    for (let i = 0; i < summaryRows.length; i += BATCH) {
      const batch        = summaryRows.slice(i, i + BATCH);
      const placeholders = batch.map(() => '(?,?,?,?)').join(',');
      await conn.execute(
        `INSERT INTO daily_summary (date, total_value, total_count, category_id) VALUES ${placeholders}`,
        batch.flat()
      );
    }
    console.log(`✅ ${summaryRows.length} resumos diários inseridos`);

    console.log('\n🎉 Seed concluído com sucesso!');
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
