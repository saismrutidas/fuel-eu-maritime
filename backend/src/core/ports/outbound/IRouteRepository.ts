import { Route } from '../../domain/entities';

export interface IRouteRepository {
  findAll(): Promise<Route[]>;
  findById(id: number): Promise<Route | null>;
  findByRouteId(routeId: string): Promise<Route | null>;
  findByYear(year: number): Promise<Route[]>;
  findBaseline(year: number): Promise<Route | null>;
  unsetAllBaselines(year: number): Promise<void>;
  setBaseline(id: number): Promise<Route>;
}
