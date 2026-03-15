import express, { Request, Response, NextFunction } from 'express';
import type { Route, ShipCompliance, BankEntry, Pool } from '../../../src/core/domain/entities';
import type { IRouteRepository } from '../../../src/core/ports/outbound/IRouteRepository';
import type { IComplianceRepository } from '../../../src/core/ports/outbound/IComplianceRepository';
import type { IBankingRepository } from '../../../src/core/ports/outbound/IBankingRepository';
import type { IPoolRepository, IPoolMemberInput } from '../../../src/core/ports/outbound/IPoolRepository';
import { RouteService } from '../../../src/core/application/RouteService';
import { ComplianceService } from '../../../src/core/application/ComplianceService';
import { BankingService } from '../../../src/core/application/BankingService';
import { PoolService } from '../../../src/core/application/PoolService';
import { createRouteRouter } from '../../../src/adapters/inbound/http/routeRouter';
import { createComplianceRouter } from '../../../src/adapters/inbound/http/complianceRouter';
import { createBankingRouter } from '../../../src/adapters/inbound/http/bankingRouter';
import { createPoolRouter } from '../../../src/adapters/inbound/http/poolRouter';
import { AppError } from '../../../src/shared/errors';

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
export const SEED_ROUTES: Route[] = [
  { id: 1, routeId: 'ROUTE-001', year: 2025, ghgIntensity: 75.0,  isBaseline: true,  fuelConsumption: 500.0 },
  { id: 2, routeId: 'ROUTE-002', year: 2025, ghgIntensity: 95.5,  isBaseline: false, fuelConsumption: 320.0 },
  { id: 3, routeId: 'ROUTE-003', year: 2025, ghgIntensity: 80.0,  isBaseline: false, fuelConsumption: 410.0 },
  { id: 4, routeId: 'ROUTE-004', year: 2025, ghgIntensity: 100.2, isBaseline: false, fuelConsumption: 275.0 },
  { id: 5, routeId: 'ROUTE-005', year: 2025, ghgIntensity: 88.0,  isBaseline: false, fuelConsumption: 600.0 },
];

// ---------------------------------------------------------------------------
// In-memory repositories
// ---------------------------------------------------------------------------
export class InMemoryRouteRepo implements IRouteRepository {
  routes: Route[];

  constructor() {
    this.routes = SEED_ROUTES.map(r => ({ ...r }));
  }

  reset(): void {
    this.routes = SEED_ROUTES.map(r => ({ ...r }));
  }

  async findAll(): Promise<Route[]> {
    return this.routes.map(r => ({ ...r }));
  }

  async findById(id: number): Promise<Route | null> {
    return this.routes.find(r => r.id === id) ?? null;
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    return this.routes.find(r => r.routeId === routeId) ?? null;
  }

  async findByYear(year: number): Promise<Route[]> {
    return this.routes.filter(r => r.year === year);
  }

  async findBaseline(year: number): Promise<Route | null> {
    return this.routes.find(r => r.year === year && r.isBaseline) ?? null;
  }

  async unsetAllBaselines(year: number): Promise<void> {
    this.routes.forEach(r => { if (r.year === year) r.isBaseline = false; });
  }

  async setBaseline(id: number): Promise<Route> {
    const route = this.routes.find(r => r.id === id);
    if (!route) throw new Error(`Route ${id} not found`);
    route.isBaseline = true;
    return { ...route };
  }
}

export class InMemoryComplianceRepo implements IComplianceRepository {
  snapshots: ShipCompliance[] = [];
  private nextId = 1;

  reset(): void {
    this.snapshots = [];
    this.nextId = 1;
  }

  async findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null> {
    return this.snapshots.find(s => s.shipId === shipId && s.year === year) ?? null;
  }

  async upsertSnapshot(shipId: string, year: number, cbGco2eq: number): Promise<ShipCompliance> {
    const existing = this.snapshots.find(s => s.shipId === shipId && s.year === year);
    if (existing) {
      existing.cbGco2eq = cbGco2eq;
      return { ...existing };
    }
    const rec: ShipCompliance = { id: this.nextId++, shipId, year, cbGco2eq };
    this.snapshots.push(rec);
    return { ...rec };
  }
}

export class InMemoryBankingRepo implements IBankingRepository {
  entries: BankEntry[] = [];
  private nextId = 1;

  reset(): void {
    this.entries = [];
    this.nextId = 1;
  }

  clearForShip(shipId: string, year: number): void {
    this.entries = this.entries.filter(e => !(e.shipId === shipId && e.year === year));
  }

  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    return this.entries.filter(e => e.shipId === shipId && e.year === year);
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    return this.entries
      .filter(e => e.shipId === shipId && e.year === year)
      .reduce((sum, e) => sum + e.amountGco2eq, 0);
  }

  async save(shipId: string, year: number, amountGco2eq: number): Promise<BankEntry> {
    const entry: BankEntry = { id: this.nextId++, shipId, year, amountGco2eq, createdAt: new Date() };
    this.entries.push(entry);
    return { ...entry };
  }
}

export class InMemoryPoolRepo implements IPoolRepository {
  pools: Pool[] = [];
  private nextId = 1;

  reset(): void {
    this.pools = [];
    this.nextId = 1;
  }

  async create(year: number, members: IPoolMemberInput[]): Promise<Pool> {
    const id = this.nextId++;
    const pool: Pool = {
      id,
      year,
      createdAt: new Date(),
      members: members.map(m => ({ poolId: id, ...m })),
    };
    this.pools.push(pool);
    return { ...pool, members: pool.members.map(m => ({ ...m })) };
  }
}

// ---------------------------------------------------------------------------
// Test app factory
// ---------------------------------------------------------------------------
export interface TestAppHandle {
  app: express.Express;
  routeRepo: InMemoryRouteRepo;
  complianceRepo: InMemoryComplianceRepo;
  bankingRepo: InMemoryBankingRepo;
  poolRepo: InMemoryPoolRepo;
}

export function createTestApp(): TestAppHandle {
  const routeRepo      = new InMemoryRouteRepo();
  const complianceRepo = new InMemoryComplianceRepo();
  const bankingRepo    = new InMemoryBankingRepo();
  const poolRepo       = new InMemoryPoolRepo();

  const routeService      = new RouteService(routeRepo);
  const complianceService = new ComplianceService(routeRepo, complianceRepo, bankingRepo);
  const bankingService    = new BankingService(bankingRepo);
  const poolService       = new PoolService(routeRepo, complianceRepo, poolRepo);

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req: Request, res: Response) => { res.json({ status: 'ok' }); });
  app.use('/routes',     createRouteRouter(routeService));
  app.use('/compliance', createComplianceRouter(complianceService));
  app.use('/banking',    createBankingRouter(bankingService));
  app.use('/pools',      createPoolRouter(poolService));

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  return { app, routeRepo, complianceRepo, bankingRepo, poolRepo };
}
