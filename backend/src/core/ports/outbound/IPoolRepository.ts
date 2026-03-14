import { Pool } from '../../domain/entities';

export interface IPoolMemberInput {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface IPoolRepository {
  create(year: number, members: IPoolMemberInput[]): Promise<Pool>;
}
