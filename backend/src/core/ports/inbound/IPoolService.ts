import { Pool } from '../../domain/entities';

export interface IPoolService {
  createPool(year: number, shipIds: string[]): Promise<Pool>;
}
