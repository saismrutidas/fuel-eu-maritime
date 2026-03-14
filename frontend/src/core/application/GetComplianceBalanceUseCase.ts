import type { IBankingRepository } from '../ports/outbound/IBankingRepository';
import type { ComplianceBalance } from '../domain/entities';

export class GetComplianceBalanceUseCase {
  private repo: IBankingRepository;
  constructor(repo: IBankingRepository) { this.repo = repo; }

  execute(shipId: string, year: number): Promise<ComplianceBalance> {
    return this.repo.getComplianceBalance(shipId, year);
  }
}
