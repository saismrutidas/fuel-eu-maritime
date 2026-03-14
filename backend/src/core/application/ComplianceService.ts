import { ShipCompliance } from '../domain/entities';
import { computeCB } from '../domain/formulas';
import { IRouteRepository } from '../ports/outbound/IRouteRepository';
import { IComplianceRepository } from '../ports/outbound/IComplianceRepository';
import { IBankingRepository } from '../ports/outbound/IBankingRepository';
import { IComplianceService } from '../ports/inbound/IComplianceService';
import { NotFoundError } from '../../shared/errors';

export class ComplianceService implements IComplianceService {
  constructor(
    private readonly routeRepo: IRouteRepository,
    private readonly complianceRepo: IComplianceRepository,
    private readonly bankingRepo: IBankingRepository,
  ) {}

  async getComplianceBalance(
    shipId: string,
    year: number,
  ): Promise<{ cb: number; snapshot: ShipCompliance }> {
    const route = await this.routeRepo.findByRouteId(shipId);
    if (!route) throw new NotFoundError(`Route ${shipId}`);

    const cb = computeCB(route.ghgIntensity, route.fuelConsumption);
    const snapshot = await this.complianceRepo.upsertSnapshot(shipId, year, cb);

    return { cb, snapshot };
  }

  async getAdjustedComplianceBalance(
    shipId: string,
    year: number,
  ): Promise<{ cb: number; totalBanked: number; adjustedCb: number }> {
    const route = await this.routeRepo.findByRouteId(shipId);
    if (!route) throw new NotFoundError(`Route ${shipId}`);

    const cb = computeCB(route.ghgIntensity, route.fuelConsumption);
    const totalBanked = await this.bankingRepo.getTotalBanked(shipId, year);
    const adjustedCb = cb + totalBanked;

    return { cb, totalBanked, adjustedCb };
  }
}
