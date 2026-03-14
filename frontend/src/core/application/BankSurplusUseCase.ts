import type { IBankingRepository } from '../ports/outbound/IBankingRepository';
import type { ComplianceBalance } from '../domain/entities';
import { validateBankSurplus } from '../domain/bankingRules';

export class BankSurplusUseCase {
  private repo: IBankingRepository;
  constructor(repo: IBankingRepository) { this.repo = repo; }

  async execute(shipId: string, amount: number, year: number): Promise<ComplianceBalance> {
    const current = await this.repo.getComplianceBalance(shipId, year);
    const validation = validateBankSurplus(current.cbBefore, amount);
    if (!validation.valid) throw new Error(validation.error);
    return this.repo.bankSurplus(shipId, amount, year);
  }
}
