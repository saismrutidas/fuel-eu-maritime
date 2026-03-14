import { RouteService } from '../../src/core/application/RouteService';
import { ComplianceService } from '../../src/core/application/ComplianceService';
import { BankingService } from '../../src/core/application/BankingService';
import { PoolService } from '../../src/core/application/PoolService';

import { IRouteRepository } from '../../src/core/ports/outbound/IRouteRepository';
import { IComplianceRepository } from '../../src/core/ports/outbound/IComplianceRepository';
import { IBankingRepository } from '../../src/core/ports/outbound/IBankingRepository';
import { IPoolRepository } from '../../src/core/ports/outbound/IPoolRepository';

import { Route, ShipCompliance, BankEntry, Pool } from '../../src/core/domain/entities';
import { TARGET_INTENSITY_2025 } from '../../src/core/domain/constants';
import { ValidationError, NotFoundError } from '../../src/shared/errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeRoute = (overrides: Partial<Route> = {}): Route => ({
  id: 1,
  routeId: 'ROUTE-001',
  year: 2025,
  ghgIntensity: 75.0,
  isBaseline: false,
  fuelConsumption: 500,
  ...overrides,
});

const makeCompliance = (overrides: Partial<ShipCompliance> = {}): ShipCompliance => ({
  id: 1,
  shipId: 'ROUTE-001',
  year: 2025,
  cbGco2eq: 295_054_000,
  ...overrides,
});

const makeBankEntry = (overrides: Partial<BankEntry> = {}): BankEntry => ({
  id: 1,
  shipId: 'ROUTE-001',
  year: 2025,
  amountGco2eq: 100_000,
  createdAt: new Date(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// RouteService
// ---------------------------------------------------------------------------
describe('RouteService', () => {
  let routeRepo: jest.Mocked<IRouteRepository>;

  beforeEach(() => {
    routeRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByRouteId: jest.fn(),
      findByYear: jest.fn(),
      findBaseline: jest.fn(),
      unsetAllBaselines: jest.fn(),
      setBaseline: jest.fn(),
    };
  });

  it('getAllRoutes delegates to repository', async () => {
    const routes = [makeRoute()];
    routeRepo.findAll.mockResolvedValue(routes);
    const svc = new RouteService(routeRepo);
    await expect(svc.getAllRoutes()).resolves.toEqual(routes);
  });

  it('setBaseline unsets previous baseline then sets new one', async () => {
    const route = makeRoute({ id: 2, year: 2025 });
    const updated = { ...route, isBaseline: true };
    routeRepo.findById.mockResolvedValue(route);
    routeRepo.unsetAllBaselines.mockResolvedValue(undefined);
    routeRepo.setBaseline.mockResolvedValue(updated);

    const svc = new RouteService(routeRepo);
    const result = await svc.setBaseline(2);

    expect(routeRepo.unsetAllBaselines).toHaveBeenCalledWith(2025);
    expect(routeRepo.setBaseline).toHaveBeenCalledWith(2);
    expect(result.isBaseline).toBe(true);
  });

  it('setBaseline throws NotFoundError for unknown id', async () => {
    routeRepo.findById.mockResolvedValue(null);
    const svc = new RouteService(routeRepo);
    await expect(svc.setBaseline(99)).rejects.toThrow(NotFoundError);
  });

  it('getComparison throws NotFoundError when no baseline exists', async () => {
    routeRepo.findAll.mockResolvedValue([makeRoute({ isBaseline: false })]);
    const svc = new RouteService(routeRepo);
    await expect(svc.getComparison()).rejects.toThrow(NotFoundError);
  });

  it('getComparison returns baseline and comparison results', async () => {
    const baseline = makeRoute({ isBaseline: true, ghgIntensity: 75, routeId: 'BASE' });
    const other = makeRoute({ id: 2, routeId: 'OTHER', ghgIntensity: 95, isBaseline: false });
    routeRepo.findAll.mockResolvedValue([baseline, other]);

    const svc = new RouteService(routeRepo);
    const { comparisons } = await svc.getComparison();

    expect(comparisons).toHaveLength(1);
    expect(comparisons[0].routeId).toBe('OTHER');
    expect(comparisons[0].compliant).toBe(false); // 95 > 89.3368
    expect(comparisons[0].percentDiff).toBeGreaterThan(0); // worse than baseline
  });
});

// ---------------------------------------------------------------------------
// ComplianceService
// ---------------------------------------------------------------------------
describe('ComplianceService', () => {
  let routeRepo: jest.Mocked<IRouteRepository>;
  let complianceRepo: jest.Mocked<IComplianceRepository>;
  let bankingRepo: jest.Mocked<IBankingRepository>;

  beforeEach(() => {
    routeRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByRouteId: jest.fn(),
      findByYear: jest.fn(),
      findBaseline: jest.fn(),
      unsetAllBaselines: jest.fn(),
      setBaseline: jest.fn(),
    };
    complianceRepo = {
      findByShipAndYear: jest.fn(),
      upsertSnapshot: jest.fn(),
    };
    bankingRepo = {
      findByShipAndYear: jest.fn(),
      getTotalBanked: jest.fn(),
      save: jest.fn(),
    };
  });

  it('getComplianceBalance computes CB and saves snapshot', async () => {
    const route = makeRoute({ ghgIntensity: 75, fuelConsumption: 500 });
    routeRepo.findByRouteId.mockResolvedValue(route);
    const snapshot = makeCompliance();
    complianceRepo.upsertSnapshot.mockResolvedValue(snapshot);

    const svc = new ComplianceService(routeRepo, complianceRepo, bankingRepo);
    const { cb } = await svc.getComplianceBalance('ROUTE-001', 2025);

    // CB = (89.3368 - 75) * 500 * 41000
    const expected = (TARGET_INTENSITY_2025 - 75) * 500 * 41_000;
    expect(cb).toBeCloseTo(expected, 2);
    expect(complianceRepo.upsertSnapshot).toHaveBeenCalledWith('ROUTE-001', 2025, cb);
  });

  it('getComplianceBalance throws NotFoundError for unknown shipId', async () => {
    routeRepo.findByRouteId.mockResolvedValue(null);
    const svc = new ComplianceService(routeRepo, complianceRepo, bankingRepo);
    await expect(svc.getComplianceBalance('GHOST', 2025)).rejects.toThrow(NotFoundError);
  });

  it('getAdjustedComplianceBalance adds banked entries to raw CB', async () => {
    const route = makeRoute({ ghgIntensity: 95.5, fuelConsumption: 320 });
    routeRepo.findByRouteId.mockResolvedValue(route);
    bankingRepo.getTotalBanked.mockResolvedValue(50_000);

    const svc = new ComplianceService(routeRepo, complianceRepo, bankingRepo);
    const { cb, totalBanked, adjustedCb } = await svc.getAdjustedComplianceBalance('ROUTE-002', 2025);

    expect(totalBanked).toBe(50_000);
    expect(adjustedCb).toBeCloseTo(cb + 50_000, 2);
  });
});

// ---------------------------------------------------------------------------
// BankingService
// ---------------------------------------------------------------------------
describe('BankingService', () => {
  let bankingRepo: jest.Mocked<IBankingRepository>;

  beforeEach(() => {
    bankingRepo = {
      findByShipAndYear: jest.fn(),
      getTotalBanked: jest.fn(),
      save: jest.fn(),
    };
  });

  it('getBankingRecords delegates to repository', async () => {
    const entries = [makeBankEntry()];
    bankingRepo.findByShipAndYear.mockResolvedValue(entries);
    const svc = new BankingService(bankingRepo);
    await expect(svc.getBankingRecords('ROUTE-001', 2025)).resolves.toEqual(entries);
  });

  it('bankSurplus saves a positive amount', async () => {
    const entry = makeBankEntry({ amountGco2eq: 200_000 });
    bankingRepo.save.mockResolvedValue(entry);
    const svc = new BankingService(bankingRepo);
    const result = await svc.bankSurplus('ROUTE-001', 200_000, 2025);
    expect(bankingRepo.save).toHaveBeenCalledWith('ROUTE-001', 2025, 200_000);
    expect(result.amountGco2eq).toBe(200_000);
  });

  it('bankSurplus throws ValidationError for zero or negative amount', async () => {
    const svc = new BankingService(bankingRepo);
    await expect(svc.bankSurplus('ROUTE-001', 0, 2025)).rejects.toThrow(ValidationError);
    await expect(svc.bankSurplus('ROUTE-001', -100, 2025)).rejects.toThrow(ValidationError);
  });

  it('applyBanked stores negative amount when valid', async () => {
    bankingRepo.getTotalBanked.mockResolvedValue(500_000);
    const entry = makeBankEntry({ amountGco2eq: -200_000 });
    bankingRepo.save.mockResolvedValue(entry);

    const svc = new BankingService(bankingRepo);
    await svc.applyBanked('ROUTE-001', 200_000, 2025);
    expect(bankingRepo.save).toHaveBeenCalledWith('ROUTE-001', 2025, -200_000);
  });

  it('applyBanked throws ValidationError when amount exceeds available balance (over-apply)', async () => {
    bankingRepo.getTotalBanked.mockResolvedValue(100_000);
    const svc = new BankingService(bankingRepo);
    await expect(svc.applyBanked('ROUTE-001', 999_999, 2025)).rejects.toThrow(ValidationError);
  });

  it('applyBanked throws ValidationError for non-positive amount', async () => {
    const svc = new BankingService(bankingRepo);
    await expect(svc.applyBanked('ROUTE-001', 0, 2025)).rejects.toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// PoolService
// ---------------------------------------------------------------------------
describe('PoolService', () => {
  let routeRepo: jest.Mocked<IRouteRepository>;
  let complianceRepo: jest.Mocked<IComplianceRepository>;
  let poolRepo: jest.Mocked<IPoolRepository>;

  beforeEach(() => {
    routeRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByRouteId: jest.fn(),
      findByYear: jest.fn(),
      findBaseline: jest.fn(),
      unsetAllBaselines: jest.fn(),
      setBaseline: jest.fn(),
    };
    complianceRepo = {
      findByShipAndYear: jest.fn(),
      upsertSnapshot: jest.fn(),
    };
    poolRepo = {
      create: jest.fn(),
    };
  });

  it('createPool throws ValidationError when total CB is negative (invalid pool)', async () => {
    // Both ships in deficit → pool is invalid
    complianceRepo.findByShipAndYear
      .mockResolvedValueOnce(makeCompliance({ shipId: 'A', cbGco2eq: -100_000 }))
      .mockResolvedValueOnce(makeCompliance({ shipId: 'B', cbGco2eq: -200_000 }));

    const svc = new PoolService(routeRepo, complianceRepo, poolRepo);
    await expect(svc.createPool(2025, ['A', 'B'])).rejects.toThrow(ValidationError);
  });

  it('createPool throws ValidationError when fewer than 2 ships are supplied', async () => {
    const svc = new PoolService(routeRepo, complianceRepo, poolRepo);
    await expect(svc.createPool(2025, ['ONLY-ONE'])).rejects.toThrow(ValidationError);
  });

  it('createPool throws NotFoundError when a shipId has no snapshot and no route', async () => {
    complianceRepo.findByShipAndYear.mockResolvedValue(null);
    routeRepo.findByRouteId.mockResolvedValue(null);

    const svc = new PoolService(routeRepo, complianceRepo, poolRepo);
    await expect(svc.createPool(2025, ['GHOST-A', 'GHOST-B'])).rejects.toThrow(NotFoundError);
  });

  it('createPool uses compliance snapshot when available', async () => {
    complianceRepo.findByShipAndYear
      .mockResolvedValueOnce(makeCompliance({ shipId: 'A', cbGco2eq: 600_000 }))
      .mockResolvedValueOnce(makeCompliance({ shipId: 'B', cbGco2eq: -200_000 }));

    const savedPool: Pool = {
      id: 1,
      year: 2025,
      createdAt: new Date(),
      members: [
        { poolId: 1, shipId: 'A', cbBefore: 600_000, cbAfter: 400_000 },
        { poolId: 1, shipId: 'B', cbBefore: -200_000, cbAfter: 0 },
      ],
    };
    poolRepo.create.mockResolvedValue(savedPool);

    const svc = new PoolService(routeRepo, complianceRepo, poolRepo);
    const result = await svc.createPool(2025, ['A', 'B']);

    expect(poolRepo.create).toHaveBeenCalledWith(
      2025,
      expect.arrayContaining([
        expect.objectContaining({ shipId: 'A', cbBefore: 600_000, cbAfter: 400_000 }),
        expect.objectContaining({ shipId: 'B', cbBefore: -200_000, cbAfter: 0 }),
      ]),
    );
    expect(result.members).toHaveLength(2);
  });

  it('createPool falls back to route calculation when no compliance snapshot exists', async () => {
    complianceRepo.findByShipAndYear.mockResolvedValue(null);
    routeRepo.findByRouteId
      .mockResolvedValueOnce(makeRoute({ routeId: 'A', ghgIntensity: 75, fuelConsumption: 500 }))
      .mockResolvedValueOnce(makeRoute({ routeId: 'B', ghgIntensity: 95.5, fuelConsumption: 320 }));

    const savedPool: Pool = { id: 2, year: 2025, createdAt: new Date(), members: [] };
    poolRepo.create.mockResolvedValue(savedPool);

    const svc = new PoolService(routeRepo, complianceRepo, poolRepo);
    // A is surplus, B is deficit, together they may or may not be ≥ 0
    // (89.3368-75)*500*41000 = 294,054,000 and (89.3368-95.5)*320*41000 = -80,877,120
    // total = ~213M > 0, so pool is valid
    await expect(svc.createPool(2025, ['A', 'B'])).resolves.toBeDefined();
    expect(routeRepo.findByRouteId).toHaveBeenCalledTimes(2);
  });
});
