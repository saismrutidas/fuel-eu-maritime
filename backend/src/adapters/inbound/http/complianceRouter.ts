import { Router, Request, Response } from 'express';
import { IComplianceService } from '../../../core/ports/inbound/IComplianceService';
import { ValidationError } from '../../../shared/errors';

export function createComplianceRouter(complianceService: IComplianceService): Router {
  const router = Router();

  // GET /compliance/cb?shipId=...&year=...
  router.get('/cb', async (req: Request, res: Response) => {
    const { shipId, year } = req.query;
    if (!shipId || !year) {
      throw new ValidationError('Query params shipId and year are required.');
    }
    const yearNum = parseInt(year as string, 10);
    if (isNaN(yearNum)) throw new ValidationError('year must be a valid integer.');

    const result = await complianceService.getComplianceBalance(shipId as string, yearNum);
    res.json(result);
  });

  // GET /compliance/adjusted-cb?shipId=...&year=...
  router.get('/adjusted-cb', async (req: Request, res: Response) => {
    const { shipId, year } = req.query;
    if (!shipId || !year) {
      throw new ValidationError('Query params shipId and year are required.');
    }
    const yearNum = parseInt(year as string, 10);
    if (isNaN(yearNum)) throw new ValidationError('year must be a valid integer.');

    const result = await complianceService.getAdjustedComplianceBalance(
      shipId as string,
      yearNum,
    );
    res.json(result);
  });

  return router;
}
