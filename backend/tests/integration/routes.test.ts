import request from 'supertest';
import app from '../../src/infrastructure/server/app';
import { seedTestDb, cleanTestDb, disconnectTestDb, testPrisma } from './helpers/dbSetup';

beforeAll(async () => {
  await seedTestDb();
});

afterAll(async () => {
  await cleanTestDb();
  await disconnectTestDb();
});

// ---------------------------------------------------------------------------
// GET /routes
// ---------------------------------------------------------------------------
describe('GET /routes', () => {
  it('returns all 5 seeded routes with status 200', async () => {
    const res = await request(app).get('/routes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
    expect(res.body[0]).toMatchObject({
      routeId: 'ROUTE-001',
      year: 2025,
      isBaseline: true,
    });
  });
});

// ---------------------------------------------------------------------------
// GET /routes/comparison
// ---------------------------------------------------------------------------
describe('GET /routes/comparison', () => {
  it('returns baseline and comparison results', async () => {
    const res = await request(app).get('/routes/comparison');
    expect(res.status).toBe(200);
    expect(res.body.baseline).toMatchObject({ routeId: 'ROUTE-001', isBaseline: true });
    expect(res.body.comparisons).toHaveLength(4);
  });

  it('each comparison result has percentDiff and compliant fields', async () => {
    const res = await request(app).get('/routes/comparison');
    for (const c of res.body.comparisons) {
      expect(c).toHaveProperty('percentDiff');
      expect(c).toHaveProperty('compliant');
    }
  });

  it('ROUTE-002 (ghg=95.5) is non-compliant', async () => {
    const res = await request(app).get('/routes/comparison');
    const r2 = res.body.comparisons.find((c: any) => c.routeId === 'ROUTE-002');
    expect(r2.compliant).toBe(false);
    expect(r2.percentDiff).toBeGreaterThan(0); // worse than baseline
  });

  it('ROUTE-003 (ghg=80) is compliant', async () => {
    const res = await request(app).get('/routes/comparison');
    const r3 = res.body.comparisons.find((c: any) => c.routeId === 'ROUTE-003');
    expect(r3.compliant).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /routes/:id/baseline
// ---------------------------------------------------------------------------
describe('POST /routes/:id/baseline', () => {
  it('sets a new baseline and returns the updated route', async () => {
    const allRes = await request(app).get('/routes');
    const route3 = allRes.body.find((r: any) => r.routeId === 'ROUTE-003');

    const res = await request(app).post(`/routes/${route3.id}/baseline`);
    expect(res.status).toBe(200);
    expect(res.body.isBaseline).toBe(true);
    expect(res.body.routeId).toBe('ROUTE-003');
  });

  it('only one route is baseline after re-assignment', async () => {
    const allRes = await request(app).get('/routes');
    const baselines = allRes.body.filter((r: any) => r.isBaseline);
    expect(baselines).toHaveLength(1);
    expect(baselines[0].routeId).toBe('ROUTE-003');

    // Restore ROUTE-001 as baseline for subsequent tests
    const route1 = allRes.body.find((r: any) => r.routeId === 'ROUTE-001');
    await request(app).post(`/routes/${route1.id}/baseline`);
  });

  it('returns 404 for an unknown route id', async () => {
    const res = await request(app).post('/routes/999999/baseline');
    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-integer id', async () => {
    const res = await request(app).post('/routes/abc/baseline');
    expect(res.status).toBe(400);
  });
});
