import type { IRouteRepository } from '../ports/outbound/IRouteRepository';
import type { ComparisonData } from '../domain/entities';

export class GetComparisonUseCase {
  private repo: IRouteRepository;
  constructor(repo: IRouteRepository) { this.repo = repo; }

  execute(): Promise<ComparisonData[]> {
    return this.repo.getComparison();
  }
}
