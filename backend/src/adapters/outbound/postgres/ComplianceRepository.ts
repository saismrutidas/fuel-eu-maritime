import prisma from '../../../infrastructure/db/prismaClient';
import { ShipCompliance } from '../../../core/domain/entities';
import { IComplianceRepository } from '../../../core/ports/outbound/IComplianceRepository';

function toShipCompliance(r: {
  id: number;
  shipId: string;
  year: number;
  cbGco2eq: number;
}): ShipCompliance {
  return {
    id: r.id,
    shipId: r.shipId,
    year: r.year,
    cbGco2eq: r.cbGco2eq,
  };
}

export class ComplianceRepository implements IComplianceRepository {
  async findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null> {
    const row = await prisma.shipCompliance.findUnique({
      where: { shipId_year: { shipId, year } },
    });
    return row ? toShipCompliance(row) : null;
  }

  async upsertSnapshot(shipId: string, year: number, cbGco2eq: number): Promise<ShipCompliance> {
    const row = await prisma.shipCompliance.upsert({
      where: { shipId_year: { shipId, year } },
      update: { cbGco2eq },
      create: { shipId, year, cbGco2eq },
    });
    return toShipCompliance(row);
  }
}
