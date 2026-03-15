# Fuel EU Compliance Dashboard

A full-stack application for monitoring and managing **FuelEU Maritime** compliance. Ships are scored against the 2025 GHG intensity target (89.3368 gCO₂e/MJ), with tools for route comparison, compliance balance banking, and multi-ship pool allocation.

---

## Architecture

Both the backend and frontend follow **Hexagonal Architecture** (Ports & Adapters):

```
core/
  domain/      — pure business logic, zero framework dependencies
  ports/
    inbound/   — use-case interfaces (what the app can do)
    outbound/  — repository interfaces (what the app needs)
  application/ — use-case implementations

adapters/
  inbound/     — HTTP routers / React UI pages & hooks
  outbound/    — Postgres repositories / in-memory mocks
```

---

## Stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Node.js · TypeScript · Express v5 |
| ORM       | Prisma v7 + `@prisma/adapter-pg` |
| Database  | PostgreSQL 16 (Docker) |
| Tests     | Jest · ts-jest · Supertest |
| Frontend  | React 19 · TypeScript · Vite |
| Styling   | Tailwind CSS v4 |
| Charts    | Recharts |

---

## Project Structure

```
my-first-project/
├── backend/                   # REST API
│   ├── prisma/
│   │   ├── schema.prisma      # 5 models: Route, ShipCompliance, BankEntry, Pool, PoolMember
│   │   └── seed.ts            # seeds 5 sample routes for 2025
│   ├── src/
│   │   ├── core/              # domain layer (framework-free)
│   │   ├── adapters/
│   │   │   ├── inbound/http/  # Express routers
│   │   │   └── outbound/postgres/ # Prisma repositories
│   │   └── infrastructure/server/app.ts
│   └── tests/
│       ├── unit/              # formula & service tests (no DB)
│       └── integration/       # HTTP tests (in-memory repos)
│
├── frontend/                  # React SPA
│   └── src/
│       ├── core/              # domain types, formulas, rules
│       ├── adapters/
│       │   ├── infrastructure/ # in-memory repos with mock data
│       │   └── ui/            # pages, hooks, components
│       └── main.tsx
│
└── docker-compose.yml         # PostgreSQL 16
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the backend database)

---

### Backend

```bash
cd backend
npm install
```

**1. Start the database**

```bash
docker compose up -d
```

**2. Run migrations and seed**

```bash
npm run prisma:migrate   # creates tables (name the migration e.g. "init")
npm run prisma:seed      # inserts 5 sample routes
```

**3. Start the dev server**

```bash
npm run dev              # http://localhost:3000
```

**Environment variables** (already in `backend/.env`):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fuel_eu_dashboard?schema=public
PORT=3000
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

> The frontend uses in-memory mock repositories — no backend connection is required to run the UI.

---

## API Reference

### Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/routes` | List all routes |
| `GET` | `/routes/comparison` | Compare all routes against the baseline |
| `POST` | `/routes/:id/baseline` | Set a route as the new baseline |

### Compliance

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/compliance/cb?shipId=&year=` | Compute and snapshot a ship's CB |
| `GET` | `/compliance/adjusted-cb?shipId=&year=` | CB adjusted for banked entries |

### Banking

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/banking/records?shipId=&year=` | List bank entries for a ship |
| `POST` | `/banking/bank` | Deposit a surplus amount |
| `POST` | `/banking/apply` | Apply banked credits to a deficit |

### Pools

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/pools` | Create a pool and run greedy CB allocation |

---

## Domain Formula

```
CB = (TARGET_INTENSITY - actualGHG) × fuelConsumption × 41,000
```

- **Positive CB** → surplus (ship is below the target intensity)
- **Negative CB** → deficit (ship exceeds the target intensity)
- **TARGET_INTENSITY_2025** = 89.3368 gCO₂e/MJ

Pool allocation uses a greedy two-pointer algorithm: surplus ships transfer the minimum of their surplus and a deficit ship's shortfall, ensuring no ship exits the pool with a worse balance than it entered.

---

## Testing

```bash
cd backend

npm test                  # all 76 tests (unit + integration)
npm run test:unit         # 38 pure domain & service tests
npm run test:integration  # 38 HTTP integration tests (no DB required)
npm run test:coverage     # with coverage report
```

Integration tests use in-memory repository implementations — they run without a database connection.

---

## Frontend Pages

| Tab | Description |
|-----|-------------|
| **Routes** | Full route table with year/GHG filters and set-baseline action |
| **Compare** | KPI cards, GHG intensity bar chart, and per-ship comparison table |
| **Banking** | CB balance cards, bank surplus form, apply banked credits form |
| **Pooling** | Ship selection, live greedy allocation preview, pool creation |
