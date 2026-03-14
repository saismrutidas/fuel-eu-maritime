import { BankEntry } from '../../domain/entities';

export interface IBankingService {
  getBankingRecords(shipId: string, year: number): Promise<BankEntry[]>;
  bankSurplus(shipId: string, amount: number, year: number): Promise<BankEntry>;
  applyBanked(shipId: string, amount: number, year: number): Promise<BankEntry>;
}
