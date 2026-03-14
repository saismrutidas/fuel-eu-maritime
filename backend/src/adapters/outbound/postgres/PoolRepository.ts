import prisma from '../../../infrastructure/db/prismaClient';
import { Pool, PoolMember } from '../../../core/domain/entities';
import { IPoolRepository, IPoolMemberInput } from '../../../core/ports/outbound/IPoolRepository';

function toPoolMember(r: {
  poolId: number;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}): PoolMember {
  return {
    poolId: r.poolId,
    shipId: r.shipId,
    cbBefore: r.cbBefore,
    cbAfter: r.cbAfter,
  };
}

function toPool(
  r: { id: number; year: number; createdAt: Date },
  members: PoolMember[],
): Pool {
  return {
    id: r.id,
    year: r.year,
    createdAt: r.createdAt,
    members,
  };
}

export class PoolRepository implements IPoolRepository {
  async create(year: number, members: IPoolMemberInput[]): Promise<Pool> {
    const pool = await prisma.pool.create({
      data: {
        year,
        members: {
          create: members.map(m => ({
            shipId: m.shipId,
            cbBefore: m.cbBefore,
            cbAfter: m.cbAfter,
          })),
        },
      },
      include: { members: true },
    });

    return toPool(pool, pool.members.map(toPoolMember));
  }
}
