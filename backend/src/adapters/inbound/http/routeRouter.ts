import { Router, Request, Response } from 'express';
import { IRouteService } from '../../../core/ports/inbound/IRouteService';
import { ValidationError } from '../../../shared/errors';

export function createRouteRouter(routeService: IRouteService): Router {
  const router = Router();

  // GET /routes
  router.get('/', async (_req: Request, res: Response) => {
    const routes = await routeService.getAllRoutes();
    res.json(routes);
  });

  // GET /routes/comparison  — must be declared before /:id to avoid route shadowing
  router.get('/comparison', async (_req: Request, res: Response) => {
    const result = await routeService.getComparison();
    res.json(result);
  });

  // POST /routes/:id/baseline
  router.post('/:id/baseline', async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) throw new ValidationError('Route id must be a valid integer.');
    const route = await routeService.setBaseline(id);
    res.json(route);
  });

  return router;
}
