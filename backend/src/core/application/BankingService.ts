import { BankEntry } from '../domain/entities';
import { IBankingRepository } from '../ports/outbound/IBankingRepository';
import { IBankingService } from '../ports/inbound/IBankingService';
import { ValidationError } from '../../shared/errors';

export class BankingService implements IBankingService {
  constructor(private readonly bankingRepo: IBankingRepository) {}

  getBankingRecords(shipId: string, year: number): Promise<BankEntry[]> {
    return this.bankingRepo.findByShipAndYear(shipId, year);
  }

  async bankSurplus(
    shipId: string,
    amount: number,
    year: number,
  ): Promise<BankEntry> {
    if (amount <= 0) {
      throw new ValidationError(
        'Only positive (surplus) CB values can be banked.',
      );
    }
    return this.bankingRepo.save(shipId, year, amount);
  }

  async applyBanked(
    shipId: string,
    amount: number,
    year: number,
  ): Promise<BankEntry> {
    if (amount <= 0) {
      throw new ValidationError('Amount to apply must be positive.');
    }

    const totalBanked = await this.bankingRepo.getTotalBanked(shipId, year);
    if (amount > totalBanked) {
      throw new ValidationError(
        `Cannot apply ${amount} gCO₂e — only ${totalBanked} gCO₂e is available in the bank.`,
      );
    }

    // Store as negative amount to represent a withdrawal
    return this.bankingRepo.save(shipId, year, -amount);
  }
}
