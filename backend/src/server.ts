import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './database/connection';
import metricsRoutes from './routes/metrics.routes';
import reportsRoutes from './routes/reports.routes';
import exportRoutes  from './routes/export.routes';

dotenv.config();

const app  = express();
const PORT = Number(process.env.PORT) || 3001;

// ─── Middlewares ────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(morgan('dev'));

// ─── Rotas ──────────────────────────────────────────────────
app.use('/api/metrics', metricsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/export',  exportRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Tratamento de erros centralizado ──────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Erro:', err.message);
  res.status(500).json({ success: false, error: err.message });
});

// ─── Inicialização ──────────────────────────────────────────
async function bootstrap() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
      console.log(`📊 API disponível em http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Falha ao iniciar o servidor:', err);
    process.exit(1);
  }
}

bootstrap();
