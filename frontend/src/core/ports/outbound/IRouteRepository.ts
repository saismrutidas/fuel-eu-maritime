import type { Route, ComparisonData } from '../../domain/entities';

export interface IRouteRepository {
  getAll(): Promise<Route[]>;
  setBaseline(routeId: string): Promise<Route>;
  getComparison(): Promise<ComparisonData[]>;
}
