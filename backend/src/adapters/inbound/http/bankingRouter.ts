import { Router, Request, Response } from 'express';
import { IBankingService } from '../../../core/ports/inbound/IBankingService';
import { ValidationError } from '../../../shared/errors';

export function createBankingRouter(bankingService: IBankingService): Router {
  const router = Router();

  // GET /banking/records?shipId=...&year=...
  router.get('/records', async (req: Request, res: Response) => {
    const { shipId, year } = req.query;
    if (!shipId || !year) {
      throw new ValidationError('Query params shipId and year are required.');
    }
    const yearNum = parseInt(year as string, 10);
    if (isNaN(yearNum)) throw new ValidationError('year must be a valid integer.');

    const records = await bankingService.getBankingRecords(shipId as string, yearNum);
    res.json(records);
  });

  // POST /banking/bank  { shipId, amount, year }
  router.post('/bank', async (req: Request, res: Response) => {
    const { shipId, amount, year } = req.body as {
      shipId?: string;
      amount?: number;
      year?: number;
    };
    if (!shipId || amount === undefined || year === undefined) {
      throw new ValidationError('Body must contain shipId, amount, and year.');
    }
    if (typeof amount !== 'number' || typeof year !== 'number') {
      throw new ValidationError('amount and year must be numbers.');
    }

    const entry = await bankingService.bankSurplus(shipId, amount, year);
    res.status(201).json(entry);
  });

  // POST /banking/apply  { shipId, amount, year }
  router.post('/apply', async (req: Request, res: Response) => {
    const { shipId, amount, year } = req.body as {
      shipId?: string;
      amount?: number;
      year?: number;
    };
    if (!shipId || amount === undefined || year === undefined) {
      throw new ValidationError('Body must contain shipId, amount, and year.');
    }
    if (typeof amount !== 'number' || typeof year !== 'number') {
      throw new ValidationError('amount and year must be numbers.');
    }

    const entry = await bankingService.applyBanked(shipId, amount, year);
    res.status(201).json(entry);
  });

  return router;
}
