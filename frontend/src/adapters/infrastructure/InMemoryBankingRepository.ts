import type { ComplianceBalance } from '../../core/domain/entities';
import type { IBankingRepository } from '../../core/ports/outbound/IBankingRepository';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Mocked starting balances keyed by `${shipId}_${year}`
const MOCK_BALANCES: Record<string, number> = {
  'R001_2024': 294_054_000,
  'R002_2024': -80_877_120,
  'R003_2024': -178_629_600,
  'R004_2025':  6_724_080,
  'R005_2025': -47_029_800,
};

export class InMemoryBankingRepository implements IBankingRepository {
  private applied: Record<string, number> = {};

  private key(shipId: string, year: number) {
    return `${shipId}_${year}`;
  }

  async getComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance> {
    await delay(300);
    const k = this.key(shipId, year);
    const cbBefore = MOCK_BALANCES[k] ?? 0;
    const app = this.applied[k] ?? 0;
    return { shipId, year, cbBefore, applied: app, cbAfter: cbBefore + app };
  }

  async bankSurplus(shipId: string, amount: number, year: number): Promise<ComplianceBalance> {
    await delay(300);
    const k = this.key(shipId, year);
    this.applied[k] = (this.applied[k] ?? 0) + amount;
    const cbBefore = MOCK_BALANCES[k] ?? 0;
    const app = this.applied[k];
    return { shipId, year, cbBefore, applied: app, cbAfter: cbBefore + app };
  }

  async applyBanked(shipId: string, amount: number, year: number): Promise<ComplianceBalance> {
    await delay(300);
    const k = this.key(shipId, year);
    this.applied[k] = (this.applied[k] ?? 0) - amount;
    const cbBefore = MOCK_BALANCES[k] ?? 0;
    const app = this.applied[k];
    return { shipId, year, cbBefore, applied: app, cbAfter: cbBefore + app };
  }
}
