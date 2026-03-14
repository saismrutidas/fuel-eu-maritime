import { Route, RouteComparisonResult } from '../../domain/entities';

export interface IRouteService {
  getAllRoutes(): Promise<Route[]>;
  setBaseline(id: number): Promise<Route>;
  getComparison(): Promise<{
    baseline: Route;
    comparisons: RouteComparisonResult[];
  }>;
}
