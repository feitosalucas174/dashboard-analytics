import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Suporta DATABASE_URL (Neon, Render, Supabase) ou variáveis individuais (local)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT) || 5432,
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME     || 'dashboard_analytics',
      }
);

export async function testConnection(): Promise<void> {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');
  } catch (error) {
    console.error('❌ Falha ao conectar ao PostgreSQL:', error);
    throw error;
  }
}

export default pool;
