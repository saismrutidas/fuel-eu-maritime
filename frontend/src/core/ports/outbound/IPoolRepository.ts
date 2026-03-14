import type { Pool, PoolMember } from '../../domain/entities';

export interface IPoolRepository {
  getAdjustedCB(year: number): Promise<PoolMember[]>;
  createPool(year: number, memberIds: string[]): Promise<Pool>;
}
