import type { ComplianceBalance } from '../../domain/entities';

export interface IBankingRepository {
  getComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance>;
  bankSurplus(shipId: string, amount: number, year: number): Promise<ComplianceBalance>;
  applyBanked(shipId: string, amount: number, year: number): Promise<ComplianceBalance>;
}
