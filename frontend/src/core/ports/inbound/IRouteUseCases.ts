import type { Route, ComparisonData } from '../../domain/entities';

export interface IGetRoutesUseCase {
  execute(): Promise<Route[]>;
}

export interface ISetBaselineUseCase {
  execute(routeId: string): Promise<Route>;
}

export interface IGetComparisonUseCase {
  execute(): Promise<ComparisonData[]>;
}
