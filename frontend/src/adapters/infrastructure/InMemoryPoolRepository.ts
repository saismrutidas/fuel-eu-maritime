import type { Pool, PoolMember } from '../../core/domain/entities';
import type { IPoolRepository } from '../../core/ports/outbound/IPoolRepository';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const MOCK_CB: Record<string, { vesselType: string; cb: number }> = {
  'R001': { vesselType: 'Container',  cb:  294_054_000 },
  'R002': { vesselType: 'BulkCarrier', cb: -80_877_120 },
  'R003': { vesselType: 'Tanker',      cb: -178_629_600 },
  'R004': { vesselType: 'RoRo',        cb:   6_724_080 },
  'R005': { vesselType: 'Container',   cb:  -47_029_800 },
};

export class InMemoryPoolRepository implements IPoolRepository {
  async getAdjustedCB(year: number): Promise<PoolMember[]> {
    await delay(300);
    // For mock purposes year is ignored; return all ships
    void year;
    return Object.entries(MOCK_CB).map(([shipId, v]) => ({
      shipId,
      vesselType: v.vesselType,
      cbBefore: v.cb,
      cbAfter: v.cb,  // will be recalculated by domain
    }));
  }

  async createPool(year: number, memberIds: string[]): Promise<Pool> {
    await delay(300);
    const members: PoolMember[] = memberIds
      .filter(id => MOCK_CB[id])
      .map(id => ({
        shipId: id,
        vesselType: MOCK_CB[id].vesselType,
        cbBefore: MOCK_CB[id].cb,
        cbAfter: MOCK_CB[id].cb,
      }));
    const total = members.reduce((s, m) => s + m.cbBefore, 0);
    return {
      id: `pool-${Date.now()}`,
      year,
      members,
      totalCB: total,
      isValid: total >= 0,
    };
  }
}
