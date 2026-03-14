import request from 'supertest';
import app from '../../src/infrastructure/server/app';
import { seedTestDb, cleanTestDb, disconnectTestDb, testPrisma } from './helpers/dbSetup';
import { TARGET_INTENSITY_2025 } from '../../src/core/domain/constants';
import { computeCB } from '../../src/core/domain/formulas';

beforeAll(async () => {
  await seedTestDb();

  // Pre-seed compliance snapshots so pool service can resolve CB without hitting routes
  // ROUTE-001: surplus  CB = (89.3368 - 75) * 500 * 41000 ≈ +294M
  // ROUTE-002: deficit  CB = (89.3368 - 95.5) * 320 * 41000 ≈ -81M
  const cb1 = computeCB(75.0, 500.0);
  const cb2 = computeCB(95.5, 320.0);

  await testPrisma.shipCompliance.upsert({
    where: { shipId_year: { shipId: 'ROUTE-001', year: 2025 } },
    create: { shipId: 'ROUTE-001', year: 2025, cbGco2eq: cb1 },
    update: { cbGco2eq: cb1 },
  });
  await testPrisma.shipCompliance.upsert({
    where: { shipId_year: { shipId: 'ROUTE-002', year: 2025 } },
    create: { shipId: 'ROUTE-002', year: 2025, cbGco2eq: cb2 },
    update: { cbGco2eq: cb2 },
  });
});

afterAll(async () => {
  await cleanTestDb();
  await disconnectTestDb();
});

// ---------------------------------------------------------------------------
// POST /pools
// ---------------------------------------------------------------------------
describe('POST /pools', () => {
  it('creates a valid pool and returns allocations (happy path)', async () => {
    const res = await request(app)
      .post('/pools')
      .send({ year: 2025, shipIds: ['ROUTE-001', 'ROUTE-002'] });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.year).toBe(2025);
    expect(res.body.members).toHaveLength(2);
  });

  it('deficit ship (ROUTE-002) exits pool with cbAfter >= 0', async () => {
    const res = await request(app)
      .post('/pools')
      .send({ year: 2025, shipIds: ['ROUTE-001', 'ROUTE-002'] });

    const r2 = res.body.members.find((m: any) => m.shipId === 'ROUTE-002');
    expect(r2.cbAfter).toBeGreaterThanOrEqual(0);
  });

  it('surplus ship (ROUTE-001) does not exit with a negative balance', async () => {
    const res = await request(app)
      .post('/pools')
      .send({ year: 2025, shipIds: ['ROUTE-001', 'ROUTE-002'] });

    const r1 = res.body.members.find((m: any) => m.shipId === 'ROUTE-001');
    expect(r1.cbAfter).toBeGreaterThanOrEqual(0);
  });

  it('pool is persisted in the database', async () => {
    const res = await request(app)
      .post('/pools')
      .send({ year: 2025, shipIds: ['ROUTE-001', 'ROUTE-002'] });

    const pool = await testPrisma.pool.findUnique({
      where: { id: res.body.id },
      include: { members: true },
    });
    expect(pool).not.toBeNull();
    expect(pool!.members).toHaveLength(2);
  });

  // ---------------------------------------------------------------------------
  // Error paths
  // ---------------------------------------------------------------------------
  it('returns 400 when total pooled CB is negative (all deficit ships)', async () => {
    // Seed two deficit snapshots
    const cbDeficit1 = computeCB(TARGET_INTENSITY_2025 + 10, 200);
    const cbDeficit2 = computeCB(TARGET_INTENSITY_2025 + 20, 150);

    await testPrisma.shipCompliance.upsert({
      where: { shipId_year: { shipId: 'DEF-A', year: 2025 } },
      create: { shipId: 'DEF-A', year: 2025, cbGco2eq: cbDeficit1 },
      update: { cbGco2eq: cbDeficit1 },
    });
    await testPrisma.shipCompliance.upsert({
      where: { shipId_year: { shipId: 'DEF-B', year: 2025 } },
      create: { shipId: 'DEF-B', year: 2025, cbGco2eq: cbDeficit2 },
      update: { cbGco2eq: cbDeficit2 },
    });

    const res = await request(app)
      .post('/pools')
      .send({ year: 2025, shipIds: ['DEF-A', 'DEF-B'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/deficit|negative|balance/i);
  });

  it('returns 400 when only one shipId is supplied', async () => {
    const res = await request(app)
      .post('/pools')
      .send({ year: 2025, shipIds: ['ROUTE-001'] });

    expect(res.status).toBe(400);
  });

  it('returns 400 when shipIds is empty', async () => {
    const res = await request(app)
      .post('/pools')
      .send({ year: 2025, shipIds: [] });

    expect(res.status).toBe(400);
  });

  it('returns 400 when body is missing year', async () => {
    const res = await request(app)
      .post('/pools')
      .send({ shipIds: ['ROUTE-001', 'ROUTE-002'] });

    expect(res.status).toBe(400);
  });

  it('returns 404 when a shipId has no snapshot and no route', async () => {
    const res = await request(app)
      .post('/pools')
      .send({ year: 2025, shipIds: ['ROUTE-001', 'GHOST-SHIP'] });

    expect(res.status).toBe(404);
  });
});
