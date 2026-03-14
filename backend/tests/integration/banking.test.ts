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
// GET /banking/records
// ---------------------------------------------------------------------------
describe('GET /banking/records', () => {
  it('returns empty array when no entries exist', async () => {
    const res = await request(app).get('/banking/records?shipId=ROUTE-001&year=2025');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 400 when params are missing', async () => {
    const res = await request(app).get('/banking/records?shipId=ROUTE-001');
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /banking/bank (happy path)
// ---------------------------------------------------------------------------
describe('POST /banking/bank', () => {
  it('saves a positive surplus and returns the entry', async () => {
    const res = await request(app)
      .post('/banking/bank')
      .send({ shipId: 'ROUTE-001', amount: 250_000, year: 2025 });

    expect(res.status).toBe(201);
    expect(res.body.amountGco2eq).toBe(250_000);
    expect(res.body.shipId).toBe('ROUTE-001');
  });

  it('entry is persisted in bank_entries table', async () => {
    const rows = await testPrisma.bankEntry.findMany({
      where: { shipId: 'ROUTE-001', year: 2025 },
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.some(r => r.amountGco2eq === 250_000)).toBe(true);
  });

  // Error paths
  it('returns 400 when amount is zero', async () => {
    const res = await request(app)
      .post('/banking/bank')
      .send({ shipId: 'ROUTE-001', amount: 0, year: 2025 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is negative', async () => {
    const res = await request(app)
      .post('/banking/bank')
      .send({ shipId: 'ROUTE-001', amount: -50_000, year: 2025 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/banking/bank')
      .send({ shipId: 'ROUTE-001' });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /banking/apply
// ---------------------------------------------------------------------------
describe('POST /banking/apply', () => {
  beforeEach(async () => {
    // Ensure a known balance: clear entries and seed 300_000 in the bank
    await testPrisma.bankEntry.deleteMany({ where: { shipId: 'APPLY-SHIP', year: 2025 } });
    await testPrisma.bankEntry.create({
      data: { shipId: 'APPLY-SHIP', year: 2025, amountGco2eq: 300_000 },
    });
  });

  it('applies a valid amount and stores a negative entry', async () => {
    const res = await request(app)
      .post('/banking/apply')
      .send({ shipId: 'APPLY-SHIP', amount: 100_000, year: 2025 });

    expect(res.status).toBe(201);
    expect(res.body.amountGco2eq).toBe(-100_000);
  });

  it('over-apply returns 400 (cannot apply more than banked)', async () => {
    const res = await request(app)
      .post('/banking/apply')
      .send({ shipId: 'APPLY-SHIP', amount: 999_999, year: 2025 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/available/i);
  });

  it('returns 400 when amount is zero', async () => {
    const res = await request(app)
      .post('/banking/apply')
      .send({ shipId: 'APPLY-SHIP', amount: 0, year: 2025 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when body fields are missing', async () => {
    const res = await request(app).post('/banking/apply').send({ year: 2025 });
    expect(res.status).toBe(400);
  });

  it('full bank-then-apply flow: net balance reflects both operations', async () => {
    const ship = 'FLOW-SHIP';
    const year = 2025;

    // Clean slate
    await testPrisma.bankEntry.deleteMany({ where: { shipId: ship, year } });

    // Bank 200_000
    await request(app).post('/banking/bank').send({ shipId: ship, amount: 200_000, year });
    // Apply 80_000
    await request(app).post('/banking/apply').send({ shipId: ship, amount: 80_000, year });

    const records = await request(app).get(`/banking/records?shipId=${ship}&year=${year}`);
    const net = records.body.reduce((sum: number, e: any) => sum + e.amountGco2eq, 0);
    expect(net).toBe(120_000);
  });
});
