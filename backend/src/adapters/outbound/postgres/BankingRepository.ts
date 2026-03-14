import prisma from '../../../infrastructure/db/prismaClient';
import { BankEntry } from '../../../core/domain/entities';
import { IBankingRepository } from '../../../core/ports/outbound/IBankingRepository';

function toBankEntry(r: {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
  createdAt: Date;
}): BankEntry {
  return {
    id: r.id,
    shipId: r.shipId,
    year: r.year,
    amountGco2eq: r.amountGco2eq,
    createdAt: r.createdAt,
  };
}

export class BankingRepository implements IBankingRepository {
  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    const rows = await prisma.bankEntry.findMany({
      where: { shipId, year },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toBankEntry);
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    const result = await prisma.bankEntry.aggregate({
      where: { shipId, year },
      _sum: { amountGco2eq: true },
    });
    return result._sum.amountGco2eq ?? 0;
  }

  async save(shipId: string, year: number, amountGco2eq: number): Promise<BankEntry> {
    const row = await prisma.bankEntry.create({
      data: { shipId, year, amountGco2eq },
    });
    return toBankEntry(row);
  }
}
