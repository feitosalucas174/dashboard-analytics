import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Pool de conexões reutilizáveis com o MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'dashboard_user',
  password: process.env.DB_PASSWORD || 'dashboard_pass',
  database: process.env.DB_NAME || 'dashboard_analytics',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

// Testa a conexão ao inicializar
export async function testConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexão com MySQL estabelecida com sucesso');
    connection.release();
  } catch (error) {
    console.error('❌ Falha ao conectar ao MySQL:', error);
    throw error;
  }
}

export default pool;
