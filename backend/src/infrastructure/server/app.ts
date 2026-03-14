import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';

// Repositories
import { RouteRepository } from '../../adapters/outbound/postgres/RouteRepository';
import { ComplianceRepository } from '../../adapters/outbound/postgres/ComplianceRepository';
import { BankingRepository } from '../../adapters/outbound/postgres/BankingRepository';
import { PoolRepository } from '../../adapters/outbound/postgres/PoolRepository';

// Services
import { RouteService } from '../../core/application/RouteService';
import { ComplianceService } from '../../core/application/ComplianceService';
import { BankingService } from '../../core/application/BankingService';
import { PoolService } from '../../core/application/PoolService';

// Routers
import { createRouteRouter } from '../../adapters/inbound/http/routeRouter';
import { createComplianceRouter } from '../../adapters/inbound/http/complianceRouter';
import { createBankingRouter } from '../../adapters/inbound/http/bankingRouter';
import { createPoolRouter } from '../../adapters/inbound/http/poolRouter';

import { AppError } from '../../shared/errors';

// ---------------------------------------------------------------------------
// Dependency injection
// ---------------------------------------------------------------------------
const routeRepo      = new RouteRepository();
const complianceRepo = new ComplianceRepository();
const bankingRepo    = new BankingRepository();
const poolRepo       = new PoolRepository();

const routeService      = new RouteService(routeRepo);
const complianceService = new ComplianceService(routeRepo, complianceRepo, bankingRepo);
const bankingService    = new BankingService(bankingRepo);
const poolService       = new PoolService(routeRepo, complianceRepo, poolRepo);

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'fuel-eu-dashboard' });
});

// Mount routers
app.use('/routes',     createRouteRouter(routeService));
app.use('/compliance', createComplianceRouter(complianceService));
app.use('/banking',    createBankingRouter(bankingService));
app.use('/pools',      createPoolRouter(poolService));

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT ?? 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Fuel EU Dashboard API running on port ${PORT}`);
  });
}

export default app;
