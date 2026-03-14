import request from 'supertest';
import app from '../../src/infrastructure/server/app';
import { seedTestDb, cleanTestDb, disconnectTestDb, testPrisma } from './helpers/dbSetup';
import { TARGET_INTENSITY_2025 } from '../../src/core/domain/constants';

beforeAll(async () => {
  await seedTestDb();
});

afterAll(async () => {
  await cleanTestDb();
  await disconnectTestDb();
});

// ---------------------------------------------------------------------------
// GET /compliance/cb
// ---------------------------------------------------------------------------
describe('GET /compliance/cb', () => {
  it('returns correct CB for a surplus route (ROUTE-001, ghg=75)', async () => {
    const res = await request(app).get('/compliance/cb?shipId=ROUTE-001&year=2025');
    expect(res.status).toBe(200);

    // CB = (89.3368 - 75) * 500 * 41000
    const expected = (TARGET_INTENSITY_2025 - 75) * 500 * 41_000;
    expect(res.body.cb).toBeCloseTo(expected, 0);
    expect(res.body.cb).toBeGreaterThan(0);
  });

  it('returns negative CB for a deficit route (ROUTE-002, ghg=95.5)', async () => {
    const res = await request(app).get('/compliance/cb?shipId=ROUTE-002&year=2025');
    expect(res.status).toBe(200);
    expect(res.body.cb).toBeLessThan(0);
  });

  it('saves a snapshot to ship_compliance table', async () => {
    await request(app).get('/compliance/cb?shipId=ROUTE-001&year=2025');
    const snapshot = await testPrisma.shipCompliance.findUnique({
      where: { shipId_year: { shipId: 'ROUTE-001', year: 2025 } },
    });
    expect(snapshot).not.toBeNull();
    expect(snapshot!.cbGco2eq).toBeGreaterThan(0);
  });

  it('returns 404 for unknown shipId', async () => {
    const res = await request(app).get('/compliance/cb?shipId=GHOST&year=2025');
    expect(res.status).toBe(404);
  });

  it('returns 400 when query params are missing', async () => {
    const res = await request(app).get('/compliance/cb?shipId=ROUTE-001');
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /compliance/adjusted-cb
// ---------------------------------------------------------------------------
describe('GET /compliance/adjusted-cb', () => {
  it('returns adjustedCb equal to raw cb when no bank entries exist', async () => {
    const res = await request(app).get(
      '/compliance/adjusted-cb?shipId=ROUTE-003&year=2025',
    );
    expect(res.status).toBe(200);
    expect(res.body.totalBanked).toBe(0);
    expect(res.body.adjustedCb).toBeCloseTo(res.body.cb, 0);
  });

  it('reflects banked entries in adjustedCb', async () => {
    // Bank some surplus for ROUTE-001
    await testPrisma.bankEntry.create({
      data: { shipId: 'ROUTE-001', year: 2025, amountGco2eq: 500_000 },
    });

    const res = await request(app).get(
      '/compliance/adjusted-cb?shipId=ROUTE-001&year=2025',
    );
    expect(res.status).toBe(200);
    expect(res.body.totalBanked).toBe(500_000);
    expect(res.body.adjustedCb).toBeCloseTo(res.body.cb + 500_000, 0);
  });

  it('returns 404 for unknown shipId', async () => {
    const res = await request(app).get(
      '/compliance/adjusted-cb?shipId=GHOST&year=2025',
    );
    expect(res.status).toBe(404);
  });
});
