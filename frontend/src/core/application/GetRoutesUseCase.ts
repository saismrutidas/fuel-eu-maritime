import type { IRouteRepository } from '../ports/outbound/IRouteRepository';
import type { Route } from '../domain/entities';

export class GetRoutesUseCase {
  private repo: IRouteRepository;
  constructor(repo: IRouteRepository) { this.repo = repo; }

  execute(): Promise<Route[]> {
    return this.repo.getAll();
  }
}
