import type { IPoolRepository } from '../ports/outbound/IPoolRepository';
import type { PoolMember } from '../domain/entities';

export class GetAdjustedCBUseCase {
  private repo: IPoolRepository;
  constructor(repo: IPoolRepository) { this.repo = repo; }

  execute(year: number): Promise<PoolMember[]> {
    return this.repo.getAdjustedCB(year);
  }
}
