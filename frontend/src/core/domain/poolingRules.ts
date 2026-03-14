/**
 * FuelEU Article 21 — Pooling domain rules & greedy allocation.
 * Pure TypeScript — zero framework dependencies.
 */

export interface PoolCandidate {
  shipId: string;
  vesselType: string;
  cbBefore: number;
}

export interface PoolAllocation extends PoolCandidate {
  cbAfter: number;
}

export interface PoolValidationResult {
  valid: boolean;
  totalCB: number;
  error?: string;
}

/**
 * Rule 1: The sum of all selected members' CB must be ≥ 0.
 * A pool that is collectively in deficit is invalid.
 */
export function validatePoolSum(members: PoolCandidate[]): PoolValidationResult {
  if (members.length < 2) {
    return { valid: false, totalCB: 0, error: 'A pool requires at least two ships.' };
  }
  const totalCB = members.reduce((sum, m) => sum + m.cbBefore, 0);
  if (totalCB < 0) {
    return {
      valid: false,
      totalCB,
      error: `Pool total CB is ${totalCB.toLocaleString()} gCO₂e — must be ≥ 0. Add more surplus ships.`,
    };
  }
  return { valid: true, totalCB };
}

/**
 * Greedy reallocation algorithm.
 *
 * Constraints enforced:
 *   - A deficit ship cannot exit the pool with a worse CB than it entered.
 *   - A surplus ship cannot exit the pool with a negative CB.
 *
 * Strategy: sort by CB descending (surpluses first), then use a two-pointer
 * approach to transfer the minimum of (available surplus, needed deficit).
 */
export function greedyAllocate(members: PoolCandidate[]): PoolAllocation[] {
  // Work on a mutable copy, snapshot cbBefore
  const working = members.map(m => ({ ...m, cbAfter: m.cbBefore }));

  // Sort descending: highest CB (most surplus) first
  working.sort((a, b) => b.cbAfter - a.cbAfter);

  let surplusIdx = 0;
  let deficitIdx = working.length - 1;

  while (surplusIdx < deficitIdx) {
    const surplus = working[surplusIdx];
    const deficit = working[deficitIdx];

    if (surplus.cbAfter <= 0) { surplusIdx++; continue; }
    if (deficit.cbAfter >= 0) { deficitIdx--; continue; }

    const needed    = Math.abs(deficit.cbAfter);
    const available = surplus.cbAfter;
    const transfer  = Math.min(available, needed);

    surplus.cbAfter -= transfer;
    deficit.cbAfter += transfer;

    if (deficit.cbAfter >= 0) deficitIdx--;
    if (surplus.cbAfter <= 0) surplusIdx++;
  }

  return working;
}
