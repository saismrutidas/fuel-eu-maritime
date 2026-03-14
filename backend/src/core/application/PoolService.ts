import { Pool } from '../domain/entities';
import { computeCB, computePoolGreedyAllocation } from '../domain/formulas';
import { IRouteRepository } from '../ports/outbound/IRouteRepository';
import { IComplianceRepository } from '../ports/outbound/IComplianceRepository';
import { IPoolRepository } from '../ports/outbound/IPoolRepository';
import { IPoolService } from '../ports/inbound/IPoolService';
import { NotFoundError, ValidationError } from '../../shared/errors';

export class PoolService implements IPoolService {
  constructor(
    private readonly routeRepo: IRouteRepository,
    private readonly complianceRepo: IComplianceRepository,
    private readonly poolRepo: IPoolRepository,
  ) {}

  async createPool(year: number, shipIds: string[]): Promise<Pool> {
    if (shipIds.length < 2) {
      throw new ValidationError('A pool must contain at least two ships.');
    }

    // Resolve CB for each ship: prefer saved compliance snapshot, fall back to fresh calculation
    const ships = await Promise.all(
      shipIds.map(async shipId => {
        const snapshot = await this.complianceRepo.findByShipAndYear(shipId, year);
        if (snapshot) {
          return { shipId, cb: snapshot.cbGco2eq };
        }

        const route = await this.routeRepo.findByRouteId(shipId);
        if (!route) throw new NotFoundError(`Route/ship ${shipId}`);
        return { shipId, cb: computeCB(route.ghgIntensity, route.fuelConsumption) };
      }),
    );

    const totalCB = ships.reduce((sum, s) => sum + s.cb, 0);
    if (totalCB < 0) {
      throw new ValidationError(
        `Invalid pool: total compliance balance is ${totalCB.toFixed(2)} gCO₂e. ` +
          'The pool cannot collectively be in deficit.',
      );
    }

    const allocations = computePoolGreedyAllocation(ships);
    return this.poolRepo.create(year, allocations);
  }
}
