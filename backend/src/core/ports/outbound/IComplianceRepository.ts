import { ShipCompliance } from '../../domain/entities';

export interface IComplianceRepository {
  findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null>;
  upsertSnapshot(shipId: string, year: number, cbGco2eq: number): Promise<ShipCompliance>;
}
