import { Router, Request, Response } from 'express';
import { IPoolService } from '../../../core/ports/inbound/IPoolService';
import { ValidationError } from '../../../shared/errors';

export function createPoolRouter(poolService: IPoolService): Router {
  const router = Router();

  // POST /pools  { year, shipIds: string[] }
  router.post('/', async (req: Request, res: Response) => {
    const { year, shipIds } = req.body as { year?: number; shipIds?: string[] };

    if (year === undefined || !shipIds) {
      throw new ValidationError('Body must contain year and shipIds.');
    }
    if (typeof year !== 'number') {
      throw new ValidationError('year must be a number.');
    }
    if (!Array.isArray(shipIds) || shipIds.length === 0) {
      throw new ValidationError('shipIds must be a non-empty array.');
    }
    if (shipIds.some(id => typeof id !== 'string' || !id.trim())) {
      throw new ValidationError('Each shipId must be a non-empty string.');
    }

    const pool = await poolService.createPool(year, shipIds);
    res.status(201).json(pool);
  });

  return router;
}
