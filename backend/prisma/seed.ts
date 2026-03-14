import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.shipCompliance.deleteMany();
  await prisma.route.deleteMany();

  // Seed 5 routes for year 2025
  // Target intensity = 89.3368 gCO2e/MJ
  // Some above target (non-compliant), some below (compliant)
  await prisma.route.createMany({
    data: [
      {
        routeId: 'ROUTE-001',
        year: 2025,
        ghgIntensity: 75.0,      // Below target → surplus (compliant)
        isBaseline: true,
        fuelConsumption: 500.0,  // tonnes
      },
      {
        routeId: 'ROUTE-002',
        year: 2025,
        ghgIntensity: 95.5,      // Above target → deficit (non-compliant)
        isBaseline: false,
        fuelConsumption: 320.0,
      },
      {
        routeId: 'ROUTE-003',
        year: 2025,
        ghgIntensity: 80.0,      // Below target → surplus
        isBaseline: false,
        fuelConsumption: 410.0,
      },
      {
        routeId: 'ROUTE-004',
        year: 2025,
        ghgIntensity: 100.2,     // Above target → deficit
        isBaseline: false,
        fuelConsumption: 275.0,
      },
      {
        routeId: 'ROUTE-005',
        year: 2025,
        ghgIntensity: 88.0,      // Just below target → small surplus
        isBaseline: false,
        fuelConsumption: 600.0,
      },
    ],
  });

  const routes = await prisma.route.findMany();
  console.log(`Seeded ${routes.length} routes.`);
  routes.forEach(r =>
    console.log(`  ${r.routeId}: ghgIntensity=${r.ghgIntensity}, baseline=${r.isBaseline}, fuel=${r.fuelConsumption}t`)
  );
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
