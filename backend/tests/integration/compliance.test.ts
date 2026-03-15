import request from 'supertest';
import { createTestApp, type TestAppHandle } from './helpers/dbSetup';
import { TARGET_INTENSITY_2025 } from '../../src/core/domain/constants';

let handle: TestAppHandle;

beforeAll(() => {
  handle = createTestApp();
});

// ---------------------------------------------------------------------------
// GET /compliance/cb
// ---------------------------------------------------------------------------
describe('GET /compliance/cb', () => {
  it('returns correct CB for a surplus route (ROUTE-001, ghg=75)', async () => {
    const res = await request(handle.app).get('/compliance/cb?shipId=ROUTE-001&year=2025');
    expect(res.status).toBe(200);

    // CB = (89.3368 - 75) * 500 * 41000
    const expected = (TARGET_INTENSITY_2025 - 75) * 500 * 41_000;
    expect(res.body.cb).toBeCloseTo(expected, 0);
    expect(res.body.cb).toBeGreaterThan(0);
  });

  it('returns negative CB for a deficit route (ROUTE-002, ghg=95.5)', async () => {
    const res = await request(handle.app).get('/compliance/cb?shipId=ROUTE-002&year=2025');
    expect(res.status).toBe(200);
    expect(res.body.cb).toBeLessThan(0);
  });

  it('saves a snapshot to ship_compliance table', async () => {
    await request(handle.app).get('/compliance/cb?shipId=ROUTE-001&year=2025');
    const snapshot = handle.complianceRepo.snapshots.find(
      s => s.shipId === 'ROUTE-001' && s.year === 2025,
    );
    expect(snapshot).not.toBeUndefined();
    expect(snapshot!.cbGco2eq).toBeGreaterThan(0);
  });

  it('returns 404 for unknown shipId', async () => {
    const res = await request(handle.app).get('/compliance/cb?shipId=GHOST&year=2025');
    expect(res.status).toBe(404);
  });

  it('returns 400 when query params are missing', async () => {
    const res = await request(handle.app).get('/compliance/cb?shipId=ROUTE-001');
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /compliance/adjusted-cb
// ---------------------------------------------------------------------------
describe('GET /compliance/adjusted-cb', () => {
  it('returns adjustedCb equal to raw cb when no bank entries exist', async () => {
    const res = await request(handle.app).get(
      '/compliance/adjusted-cb?shipId=ROUTE-003&year=2025',
    );
    expect(res.status).toBe(200);
    expect(res.body.totalBanked).toBe(0);
    expect(res.body.adjustedCb).toBeCloseTo(res.body.cb, 0);
  });

  it('reflects banked entries in adjustedCb', async () => {
    // Directly seed a bank entry for ROUTE-001
    await handle.bankingRepo.save('ROUTE-001', 2025, 500_000);

    const res = await request(handle.app).get(
      '/compliance/adjusted-cb?shipId=ROUTE-001&year=2025',
    );
    expect(res.status).toBe(200);
    expect(res.body.totalBanked).toBe(500_000);
    expect(res.body.adjustedCb).toBeCloseTo(res.body.cb + 500_000, 0);
  });

  it('returns 404 for unknown shipId', async () => {
    const res = await request(handle.app).get(
      '/compliance/adjusted-cb?shipId=GHOST&year=2025',
    );
    expect(res.status).toBe(404);
  });
});
