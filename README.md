# FormerBench | Production E-Commerce Monorepo

FormerBench is a full-stack, enterprise-grade e-commerce application architected as a high-performance monorepo using **React (Vite + TypeScript)**, **Node.js (Express + TypeScript)**, **Prisma ORM**, **PostgreSQL**, and **Docker Compose**.

---

## 🏛️ System Architecture

```
d:/FormerBench Website/
├── backend/                          # Node.js + Express + TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma             # PostgreSQL Prisma relational schema
│   │   └── seed.ts                   # Realistic data seeder & demo accounts
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts                # Zod fail-fast environment validator
│   │   │   └── database.ts           # Prisma Client singleton
│   │   ├── controllers/              # Thin Express route handlers
│   │   ├── middlewares/              # JWT Auth, Role RBAC, Zod validation, Error handler
│   │   ├── repositories/             # Database query & transaction layer
│   │   ├── routes/                   # API routes (Auth, Products, Cart, Orders, Admin)
│   │   ├── services/                 # Business logic & calculations
│   │   ├── utils/                    # JWT, bcrypt, response formatters
│   │   └── index.ts                  # API server bootstrap
│   ├── Dockerfile
│   └── tsconfig.json
│
├── frontend/                         # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/               # Reusable UI & e-commerce components
│   │   ├── hooks/                    # TanStack Query server-state hooks
│   │   ├── pages/                    # Storefront, PDP, Cart, Checkout, Dashboard, Admin
│   │   ├── services/
│   │   │   └── api.ts                # Centralized environment-aware Axios client
│   │   ├── store/                    # Zustand client UI & guest cart stores
│   │   ├── styles/                   # Glassmorphism & dark/light theme tokens
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── nginx.conf
│
├── shared/                           # Shared TypeScript types & Zod schemas
│   └── src/
│       ├── types.ts                  # Data contracts & DTOs
│       ├── schemas.ts                # Zod validation schemas
│       └── index.ts
│
├── docker-compose.yml                # Multi-container orchestration
├── turbo.json                        # Turborepo task pipeline
├── package.json                      # Workspace dependencies
└── README.md
```

### Layered Backend Flow
```
Client Request
  ↓
Express Route (`backend/src/routes`)
  ↓
Validation Middleware (Zod Schemas)
  ↓
Thin Controller (`backend/src/controllers`)
  ↓
Business Service Layer (`backend/src/services`)
  ↓
Database Repository Layer (`backend/src/repositories`)
  ↓
Prisma ORM (`backend/prisma/schema.prisma`)
  ↓
PostgreSQL Database
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `development` or `production` |
| `PORT` | API listen port | `5000` |
| `DATABASE_URL` | PostgreSQL connection URI | `postgresql://postgres:postgres@localhost:5432/formerbench?schema=public` |
| `JWT_SECRET` | Secret key for signing tokens (min 32 chars) | `your_secret_key_minimum_32_characters_long` |
| `JWT_EXPIRES_IN` | Token duration | `7d` |
| `CORS_ORIGIN` | Allowed client origin | `http://localhost:3000` |

### Frontend (`frontend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | API base URL for browser requests | `http://localhost:5000/api` |

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Files
```bash
# In backend/
cp .env.example .env

# In frontend/
cp .env.example .env
```

### 3. Setup Database with Docker or Local PostgreSQL
To start PostgreSQL using Docker:
```bash
docker-compose up -d postgres
```

Generate Prisma client, apply migrations, and seed sample data:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Run Development Mode
Start both frontend and backend concurrently via Turborepo:
```bash
npm run dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🐳 Docker Deployment (Full Stack)

Run all services (PostgreSQL, Backend API, Frontend NGINX SPA) with a single command:
```bash
docker-compose up --build
```

---

## 🔑 Development Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@formerbench.dev` | `DemoPass123!` |
| **Customer** | `customer@formerbench.dev` | `DemoPass123!` |
