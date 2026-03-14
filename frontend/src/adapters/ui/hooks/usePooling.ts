import { useState, useEffect, useMemo, useCallback } from 'react';
import type { PoolMember, Pool } from '../../../core/domain/entities';
import type { GetAdjustedCBUseCase } from '../../../core/application/GetAdjustedCBUseCase';
import type { CreatePoolUseCase } from '../../../core/application/CreatePoolUseCase';
import { validatePoolSum, greedyAllocate } from '../../../core/domain/poolingRules';

export const POOL_YEAR_OPTIONS = [2024, 2025];

export interface UsePoolingResult {
  year: number;
  setYear: (y: number) => void;
  allMembers: PoolMember[];
  loading: boolean;
  error: string | null;
  selectedIds: Set<string>;
  toggleMember: (id: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  // live domain computation
  preview: ReturnType<typeof greedyAllocate>;
  validation: ReturnType<typeof validatePoolSum>;
  // submission
  isCreating: boolean;
  createdPool: Pool | null;
  submitPool: () => Promise<void>;
  resetPool: () => void;
}

export function usePooling(
  getAdjustedCB: GetAdjustedCBUseCase,
  createPool: CreatePoolUseCase,
): UsePoolingResult {
  const [year, setYear] = useState(POOL_YEAR_OPTIONS[0]);
  const [allMembers, setAllMembers] = useState<PoolMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [createdPool, setCreatedPool] = useState<Pool | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedIds(new Set());
    setCreatedPool(null);
    getAdjustedCB
      .execute(year)
      .then(setAllMembers)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [getAdjustedCB, year]);

  const selectedMembers = useMemo(
    () => allMembers.filter(m => selectedIds.has(m.shipId)),
    [allMembers, selectedIds],
  );

  const validation = useMemo(
    () => validatePoolSum(selectedMembers.map(m => ({
      shipId: m.shipId, vesselType: m.vesselType, cbBefore: m.cbBefore,
    }))),
    [selectedMembers],
  );

  const preview = useMemo(
    () => greedyAllocate(selectedMembers.map(m => ({
      shipId: m.shipId, vesselType: m.vesselType, cbBefore: m.cbBefore,
    }))),
    [selectedMembers],
  );

  const toggleMember = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setCreatedPool(null);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allMembers.map(m => m.shipId)));
    setCreatedPool(null);
  }, [allMembers]);

  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
    setCreatedPool(null);
  }, []);

  const submitPool = useCallback(async () => {
    if (!validation.valid) return;
    setIsCreating(true);
    try {
      const pool = await createPool.execute(year, selectedMembers);
      setCreatedPool(pool);
    } finally {
      setIsCreating(false);
    }
  }, [validation.valid, createPool, year, selectedMembers]);

  const resetPool = useCallback(() => {
    setCreatedPool(null);
    setSelectedIds(new Set());
  }, []);

  return {
    year, setYear,
    allMembers, loading, error,
    selectedIds, toggleMember, selectAll, clearAll,
    preview, validation,
    isCreating, createdPool, submitPool, resetPool,
  };
}
