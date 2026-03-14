import type { Route, ComparisonData } from '../../core/domain/entities';
import { TARGET_GHG_INTENSITY } from '../../core/domain/constants';
import type { IRouteRepository } from '../../core/ports/outbound/IRouteRepository';

const MOCK_ROUTES: Route[] = [
  { routeId: 'R001', vesselType: 'Container',   fuelType: 'HFO', year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: true  },
  { routeId: 'R002', vesselType: 'BulkCarrier',  fuelType: 'LNG', year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500, totalEmissions: 4200, isBaseline: false },
  { routeId: 'R003', vesselType: 'Tanker',       fuelType: 'MGO', year: 2024, ghgIntensity: 93.5, fuelConsumption: 5100, distance: 12500, totalEmissions: 4700, isBaseline: false },
  { routeId: 'R004', vesselType: 'RoRo',         fuelType: 'HFO', year: 2025, ghgIntensity: 89.2, fuelConsumption: 4900, distance: 11800, totalEmissions: 4300, isBaseline: false },
  { routeId: 'R005', vesselType: 'Container',    fuelType: 'LNG', year: 2025, ghgIntensity: 90.5, fuelConsumption: 4950, distance: 11900, totalEmissions: 4400, isBaseline: false },
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export class InMemoryRouteRepository implements IRouteRepository {
  private routes: Route[] = MOCK_ROUTES.map(r => ({ ...r }));

  async getAll(): Promise<Route[]> {
    await delay(300);
    return this.routes.map(r => ({ ...r }));
  }

  async setBaseline(routeId: string): Promise<Route> {
    await delay(300);
    this.routes = this.routes.map(r => ({ ...r, isBaseline: r.routeId === routeId }));
    const updated = this.routes.find(r => r.routeId === routeId);
    if (!updated) throw new Error(`Route ${routeId} not found`);
    return { ...updated };
  }

  async getComparison(): Promise<ComparisonData[]> {
    await delay(300);
    const baseline = this.routes.find(r => r.isBaseline);
    return this.routes.map(r => {
      const isBase = r.isBaseline ?? false;
      const percentDiff = baseline && !isBase
        ? ((r.ghgIntensity / baseline.ghgIntensity) - 1) * 100
        : null;
      return {
        routeId: r.routeId,
        vesselType: r.vesselType,
        fuelType: r.fuelType,
        year: r.year,
        ghgIntensity: r.ghgIntensity,
        isBaseline: isBase,
        percentDiff,
        compliant: r.ghgIntensity < TARGET_GHG_INTENSITY,
      };
    });
  }
}
