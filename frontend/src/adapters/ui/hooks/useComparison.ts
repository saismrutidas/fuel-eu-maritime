import { useState, useEffect } from 'react';
import type { ComparisonData } from '../../../core/domain/entities';
import type { GetComparisonUseCase } from '../../../core/application/GetComparisonUseCase';

export interface UseComparisonResult {
  data: ComparisonData[];
  baseline: ComparisonData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useComparison(useCase: GetComparisonUseCase): UseComparisonResult {
  const [data, setData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    useCase
      .execute()
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [useCase, tick]);

  const baseline = data.find(d => d.isBaseline) ?? null;
  const refresh = () => setTick(t => t + 1);

  return { data, baseline, loading, error, refresh };
}
