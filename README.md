# Dashboard Analytics

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

Dashboard Analytics completo com gráficos interativos, filtros avançados, tabela paginada e exportação para PDF e Excel — pronto para portfólio.

---

## Funcionalidades

- **3 páginas**: Dashboard, Relatórios e Exportar
- **4 KPI Cards** com variação percentual vs período anterior (seta verde/vermelha)
- **FilterBar** com presets rápidos (Hoje, 7d, 30d, Este mês, 3 meses, Este ano, Personalizado)
- **Filtro por categoria** com multiselect visual
- **Filtros salvos na URL** para compartilhamento direto
- **4 gráficos Recharts**: LineChart, BarChart, PieChart, resumo de barras horizontais
- **DataTable** com paginação (10/25/50), ordenação por coluna e busca inline
- **Auto-refresh** a cada 30 segundos com indicador "Atualizado às HH:MM:SS"
- **Exportação PDF** com jsPDF + autoTable (KPIs, distribuição, dados detalhados)
- **Exportação Excel** com SheetJS — 5 abas: Resumo, Por Categoria, Timeline, Comparação, Dados Completos
- **Tema escuro como padrão** com toggle claro/escuro persistido no localStorage
- **Loading skeletons** em todos os gráficos e tabela
- **Responsivo** — funciona em mobile, tablet e desktop

---

## Stack

| Camada     | Tecnologia                              |
|------------|-----------------------------------------|
| Frontend   | React 18 + TypeScript + Tailwind CSS 3  |
| Gráficos   | Recharts 2                              |
| Exportação | jsPDF + jspdf-autotable + SheetJS       |
| HTTP       | Axios                                   |
| Backend    | Node.js + Express + TypeScript          |
| Banco      | MySQL 8                                 |
| Build      | Vite 5                                  |
| Container  | Docker + Docker Compose                 |

---

## Como rodar

### Opção 1 — Docker (recomendado)

```bash
git clone https://github.com/feitosalucas174/dashboard-analytics.git
cd dashboard-analytics

# Subir todos os serviços (MySQL + backend + frontend)
docker compose up --build

# O seed roda automaticamente na primeira inicialização
# Aguarde ~60s para o MySQL inicializar e o seed ser executado
```

Acesse:
- Frontend: http://localhost:5173
- API: http://localhost:3001/api
- Health: http://localhost:3001/health

---

### Opção 2 — Execução Manual

#### Pré-requisitos
- Node.js 20+
- MySQL 8 rodando localmente

#### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com suas credenciais MySQL
npm run seed     # cria tabelas e popula dados fictícios
npm run dev      # inicia em modo desenvolvimento
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # opcional
npm run dev
```

Acesse http://localhost:5173

---

## Documentação da API

### Base URL
```
http://localhost:3001/api
```

### Métricas

| Método | Endpoint                | Descrição                                     |
|--------|-------------------------|-----------------------------------------------|
| GET    | `/metrics/kpis`         | KPIs: total, média, máximo, variação %        |
| GET    | `/metrics/timeline`     | Dados diários por categoria (LineChart)       |
| GET    | `/metrics/distribution` | Distribuição % por categoria (PieChart)       |
| GET    | `/metrics/comparison`   | Comparação entre categorias (BarChart)        |
| GET    | `/metrics/realtime`     | Últimos 60 pontos simulando tempo real        |

**Query params comuns:** `startDate`, `endDate`, `category`

### Relatórios

| Método | Endpoint         | Descrição                             |
|--------|------------------|---------------------------------------|
| GET    | `/reports/table` | Dados paginados e ordenáveis          |

**Query params:** `startDate`, `endDate`, `category`, `page`, `limit`, `sortBy`, `sortOrder`, `search`

### Exportação

| Método | Endpoint        | Descrição                                      |
|--------|-----------------|------------------------------------------------|
| GET    | `/export/pdf`   | JSON estruturado para o frontend gerar o PDF   |
| GET    | `/export/excel` | JSON estruturado para o frontend gerar o Excel |

---

## Estrutura de Pastas

```
dashboard-analytics/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Entrypoint Express
│   │   ├── database/
│   │   │   ├── connection.ts      # Pool MySQL
│   │   │   └── seed.ts            # 500+ registros fictícios
│   │   ├── routes/                # Rotas Express
│   │   ├── controllers/           # Handlers HTTP
│   │   ├── services/              # Lógica de negócio + SQL
│   │   └── types/                 # Tipos TypeScript
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Rotas + tema escuro
│   │   ├── pages/                 # Dashboard, Relatórios, Exportar
│   │   ├── components/
│   │   │   ├── layout/            # Sidebar, Header, Layout
│   │   │   ├── charts/            # LineChart, BarChart, PieChart, ChartCard
│   │   │   ├── filters/           # DateRangePicker, CategoryFilter, FilterBar
│   │   │   ├── cards/             # KPICard
│   │   │   ├── table/             # DataTable
│   │   │   └── export/            # ExportPDF, ExportExcel
│   │   ├── hooks/                 # useMetrics, useFilters, useExport
│   │   ├── services/              # api.ts (axios)
│   │   ├── types/                 # Tipos TypeScript
│   │   └── utils/                 # formatters, exportHelpers
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Banco de Dados

**`categories`** — 5 categorias com cor hex:
Vendas (`#6366f1`), Marketing (`#f59e0b`), Operações (`#10b981`), Financeiro (`#ef4444`), RH (`#8b5cf6`)

**`metrics`** — registros individuais: `id`, `category_id`, `metric_name`, `value`, `date`

**`daily_summary`** — agregado diário: `id`, `date`, `total_value`, `total_count`, `category_id`

O seed gera ~12 meses × 365 dias × 5 categorias × 3 métricas = **5.000+ registros**.

---

## Licença

MIT © 2024
