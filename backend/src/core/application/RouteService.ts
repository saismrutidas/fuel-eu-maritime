import { Route, RouteComparisonResult } from '../domain/entities';
import { computeComparison } from '../domain/formulas';
import { IRouteRepository } from '../ports/outbound/IRouteRepository';
import { IRouteService } from '../ports/inbound/IRouteService';
import { NotFoundError } from '../../shared/errors';

export class RouteService implements IRouteService {
  constructor(private readonly routeRepo: IRouteRepository) {}

  getAllRoutes(): Promise<Route[]> {
    return this.routeRepo.findAll();
  }

  async setBaseline(id: number): Promise<Route> {
    const route = await this.routeRepo.findById(id);
    if (!route) throw new NotFoundError(`Route ${id}`);

    // Unset any existing baseline for the same year, then set new one
    await this.routeRepo.unsetAllBaselines(route.year);
    return this.routeRepo.setBaseline(id);
  }

  async getComparison(): Promise<{
    baseline: Route;
    comparisons: RouteComparisonResult[];
  }> {
    const all = await this.routeRepo.findAll();
    const baseline = all.find(r => r.isBaseline);
    if (!baseline) throw new NotFoundError('Baseline route');

    const others = all.filter(r => !r.isBaseline);
    const comparisons = computeComparison(
      baseline.ghgIntensity,
      others.map(r => ({ routeId: r.routeId, ghgIntensity: r.ghgIntensity })),
    );

    return { baseline, comparisons };
  }
}
