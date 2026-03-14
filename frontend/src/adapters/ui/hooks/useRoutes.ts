import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Route } from '../../../core/domain/entities';
import type { IGetRoutesUseCase, ISetBaselineUseCase } from '../../../core/ports/inbound/IRouteUseCases';

export interface RouteFilters {
  vesselType: string;
  fuelType: string;
  year: string;
}

export interface UseRoutesResult {
  routes: Route[];
  filteredRoutes: Route[];
  loading: boolean;
  error: string | null;
  filters: RouteFilters;
  setFilters: (f: Partial<RouteFilters>) => void;
  vesselTypes: string[];
  fuelTypes: string[];
  years: number[];
  handleSetBaseline: (routeId: string) => Promise<void>;
  settingBaseline: string | null;
}

export function useRoutes(
  getRoutes: IGetRoutesUseCase,
  setBaseline: ISetBaselineUseCase,
): UseRoutesResult {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingBaseline, setSettingBaseline] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<RouteFilters>({
    vesselType: '',
    fuelType: '',
    year: '',
  });

  useEffect(() => {
    setLoading(true);
    getRoutes
      .execute()
      .then(setRoutes)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [getRoutes]);

  const vesselTypes = useMemo(
    () => [...new Set(routes.map(r => r.vesselType))].sort(),
    [routes],
  );
  const fuelTypes = useMemo(
    () => [...new Set(routes.map(r => r.fuelType))].sort(),
    [routes],
  );
  const years = useMemo(
    () => [...new Set(routes.map(r => r.year))].sort((a, b) => a - b),
    [routes],
  );

  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      if (filters.vesselType && r.vesselType !== filters.vesselType) return false;
      if (filters.fuelType && r.fuelType !== filters.fuelType) return false;
      if (filters.year && r.year !== Number(filters.year)) return false;
      return true;
    });
  }, [routes, filters]);

  const setFilters = useCallback((partial: Partial<RouteFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
  }, []);

  const handleSetBaseline = useCallback(
    async (routeId: string) => {
      setSettingBaseline(routeId);
      try {
        await setBaseline.execute(routeId);
        const updated = await getRoutes.execute();
        setRoutes(updated);
      } finally {
        setSettingBaseline(null);
      }
    },
    [setBaseline, getRoutes],
  );

  return {
    routes,
    filteredRoutes,
    loading,
    error,
    filters,
    setFilters,
    vesselTypes,
    fuelTypes,
    years,
    handleSetBaseline,
    settingBaseline,
  };
}
