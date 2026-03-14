import { ShipCompliance } from '../../domain/entities';

export interface IComplianceService {
  getComplianceBalance(
    shipId: string,
    year: number,
  ): Promise<{ cb: number; snapshot: ShipCompliance }>;

  getAdjustedComplianceBalance(
    shipId: string,
    year: number,
  ): Promise<{ cb: number; totalBanked: number; adjustedCb: number }>;
}
