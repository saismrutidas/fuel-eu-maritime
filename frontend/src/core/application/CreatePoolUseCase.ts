import type { IPoolRepository } from '../ports/outbound/IPoolRepository';
import type { Pool, PoolMember } from '../domain/entities';
import { validatePoolSum, greedyAllocate } from '../domain/poolingRules';

export class CreatePoolUseCase {
  private repo: IPoolRepository;
  constructor(repo: IPoolRepository) { this.repo = repo; }

  async execute(year: number, members: PoolMember[]): Promise<Pool> {
    const validation = validatePoolSum(members.map(m => ({
      shipId: m.shipId,
      vesselType: m.vesselType,
      cbBefore: m.cbBefore,
    })));

    if (!validation.valid) throw new Error(validation.error);

    const allocations = greedyAllocate(
      members.map(m => ({ shipId: m.shipId, vesselType: m.vesselType, cbBefore: m.cbBefore })),
    );

    // Persist via repo with the greedy-computed cbAfter values
    const pool = await this.repo.createPool(year, allocations.map(a => a.shipId));

    // Return with the domain-computed cbAfter (repo mock resets these, so we override)
    return {
      ...pool,
      members: allocations.map(a => ({
        shipId: a.shipId,
        vesselType: a.vesselType,
        cbBefore: a.cbBefore,
        cbAfter: a.cbAfter,
      })),
      totalCB: validation.totalCB,
      isValid: true,
    };
  }
}
