import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const testPrisma = new PrismaClient({ adapter });

/** Wipe all tables in safe dependency order and re-seed fresh test data. */
export async function seedTestDb() {
  await testPrisma.poolMember.deleteMany();
  await testPrisma.pool.deleteMany();
  await testPrisma.bankEntry.deleteMany();
  await testPrisma.shipCompliance.deleteMany();
  await testPrisma.route.deleteMany();

  await testPrisma.route.createMany({
    data: [
      {
        routeId: 'ROUTE-001',
        year: 2025,
        ghgIntensity: 75.0,
        isBaseline: true,
        fuelConsumption: 500.0,
      },
      {
        routeId: 'ROUTE-002',
        year: 2025,
        ghgIntensity: 95.5,
        isBaseline: false,
        fuelConsumption: 320.0,
      },
      {
        routeId: 'ROUTE-003',
        year: 2025,
        ghgIntensity: 80.0,
        isBaseline: false,
        fuelConsumption: 410.0,
      },
      {
        routeId: 'ROUTE-004',
        year: 2025,
        ghgIntensity: 100.2,
        isBaseline: false,
        fuelConsumption: 275.0,
      },
      {
        routeId: 'ROUTE-005',
        year: 2025,
        ghgIntensity: 88.0,
        isBaseline: false,
        fuelConsumption: 600.0,
      },
    ],
  });
}

export async function cleanTestDb() {
  await testPrisma.poolMember.deleteMany();
  await testPrisma.pool.deleteMany();
  await testPrisma.bankEntry.deleteMany();
  await testPrisma.shipCompliance.deleteMany();
  await testPrisma.route.deleteMany();
}

export async function disconnectTestDb() {
  await testPrisma.$disconnect();
}
