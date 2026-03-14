import type { IRouteRepository } from '../ports/outbound/IRouteRepository';
import type { Route } from '../domain/entities';

export class SetBaselineUseCase {
  private repo: IRouteRepository;
  constructor(repo: IRouteRepository) { this.repo = repo; }

  execute(routeId: string): Promise<Route> {
    return this.repo.setBaseline(routeId);
  }
}
