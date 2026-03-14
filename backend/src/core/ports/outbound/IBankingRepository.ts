import { BankEntry } from '../../domain/entities';

export interface IBankingRepository {
  findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]>;
  getTotalBanked(shipId: string, year: number): Promise<number>;
  save(shipId: string, year: number, amountGco2eq: number): Promise<BankEntry>;
}
