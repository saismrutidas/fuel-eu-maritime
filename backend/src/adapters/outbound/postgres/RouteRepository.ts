import prisma from '../../../infrastructure/db/prismaClient';
import { Route } from '../../../core/domain/entities';
import { IRouteRepository } from '../../../core/ports/outbound/IRouteRepository';

function toRoute(r: {
  id: number;
  routeId: string;
  year: number;
  ghgIntensity: number;
  isBaseline: boolean;
  fuelConsumption: number;
}): Route {
  return {
    id: r.id,
    routeId: r.routeId,
    year: r.year,
    ghgIntensity: r.ghgIntensity,
    isBaseline: r.isBaseline,
    fuelConsumption: r.fuelConsumption,
  };
}

export class RouteRepository implements IRouteRepository {
  async findAll(): Promise<Route[]> {
    const rows = await prisma.route.findMany({ orderBy: { id: 'asc' } });
    return rows.map(toRoute);
  }

  async findById(id: number): Promise<Route | null> {
    const row = await prisma.route.findUnique({ where: { id } });
    return row ? toRoute(row) : null;
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    const row = await prisma.route.findUnique({ where: { routeId } });
    return row ? toRoute(row) : null;
  }

  async findByYear(year: number): Promise<Route[]> {
    const rows = await prisma.route.findMany({ where: { year }, orderBy: { id: 'asc' } });
    return rows.map(toRoute);
  }

  async findBaseline(year: number): Promise<Route | null> {
    const row = await prisma.route.findFirst({ where: { year, isBaseline: true } });
    return row ? toRoute(row) : null;
  }

  async unsetAllBaselines(year: number): Promise<void> {
    await prisma.route.updateMany({
      where: { year, isBaseline: true },
      data: { isBaseline: false },
    });
  }

  async setBaseline(id: number): Promise<Route> {
    const row = await prisma.route.update({
      where: { id },
      data: { isBaseline: true },
    });
    return toRoute(row);
  }
}
