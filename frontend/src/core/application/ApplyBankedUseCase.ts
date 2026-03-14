import type { IBankingRepository } from '../ports/outbound/IBankingRepository';
import type { ComplianceBalance } from '../domain/entities';
import { validateApplyBanked } from '../domain/bankingRules';

export class ApplyBankedUseCase {
  private repo: IBankingRepository;
  constructor(repo: IBankingRepository) { this.repo = repo; }

  async execute(shipId: string, amount: number, year: number): Promise<ComplianceBalance> {
    const current = await this.repo.getComplianceBalance(shipId, year);
    const netBanked = current.applied; // positive = stored surplus
    const validation = validateApplyBanked(amount, netBanked);
    if (!validation.valid) throw new Error(validation.error);
    return this.repo.applyBanked(shipId, amount, year);
  }
}
