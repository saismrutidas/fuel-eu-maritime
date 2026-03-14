import { TARGET_INTENSITY_2025, MJ_PER_TONNE } from './constants';
import {
  PoolShipInput,
  PoolAllocationResult,
  RouteComparisonResult,
} from './entities';

/**
 * Compute energy in scope (MJ) from fuel consumption in tonnes.
 * Formula: fuelConsumption (t) × 41,000 MJ/t
 */
export function computeEnergyInScope(fuelConsumptionTonnes: number): number {
  return fuelConsumptionTonnes * MJ_PER_TONNE;
}

/**
 * Compute the Compliance Balance (CB) in gCO₂e.
 * Formula: (targetIntensity − actualGhgIntensity) × energyInScope
 * Positive CB = surplus (compliant), negative CB = deficit (non-compliant).
 */
export function computeCB(
  actualGhgIntensity: number,
  fuelConsumptionTonnes: number,
  targetIntensity: number = TARGET_INTENSITY_2025,
): number {
  const energyMJ = computeEnergyInScope(fuelConsumptionTonnes);
  return (targetIntensity - actualGhgIntensity) * energyMJ;
}

/**
 * Compare a list of routes against the baseline route.
 * Returns percentDiff relative to baseline intensity and a compliant flag.
 * percentDiff > 0 means the route is worse (higher intensity) than baseline.
 * percentDiff < 0 means the route is better (lower intensity) than baseline.
 */
export function computeComparison(
  baselineIntensity: number,
  routes: Array<{ routeId: string; ghgIntensity: number }>,
  targetIntensity: number = TARGET_INTENSITY_2025,
): RouteComparisonResult[] {
  return routes.map(route => ({
    routeId: route.routeId,
    ghgIntensity: route.ghgIntensity,
    percentDiff:
      ((route.ghgIntensity - baselineIntensity) / baselineIntensity) * 100,
    compliant: route.ghgIntensity <= targetIntensity,
  }));
}

/**
 * Greedy pool CB allocation.
 *
 * Rules:
 *  - Total pooled CB must be ≥ 0 (caller must validate before calling).
 *  - Sort ships descending by CB so surpluses are processed first.
 *  - Greedily transfer surplus into deficit buckets to zero them out.
 *  - A deficit ship cannot exit worse than its starting CB.
 *  - A surplus ship cannot exit the pool with a negative balance.
 *
 * Returns the cbBefore / cbAfter mapping for every ship.
 */
export function computePoolGreedyAllocation(
  ships: PoolShipInput[],
): PoolAllocationResult[] {
  // Snapshot originals
  const working = ships.map(s => ({ shipId: s.shipId, cbBefore: s.cb, cbAfter: s.cb }));

  // Sort descending: highest CB (most surplus) first
  working.sort((a, b) => b.cbAfter - a.cbAfter);

  // Two-pointer style: surplus pointer from front, deficit from back
  let surplusIdx = 0;
  let deficitIdx = working.length - 1;

  while (surplusIdx < deficitIdx) {
    const surplus = working[surplusIdx];
    const deficit = working[deficitIdx];

    if (surplus.cbAfter <= 0) {
      surplusIdx++;
      continue;
    }
    if (deficit.cbAfter >= 0) {
      deficitIdx--;
      continue;
    }

    // How much deficit needs to be filled
    const needed = Math.abs(deficit.cbAfter);
    // How much the surplus ship can give without going negative
    const available = surplus.cbAfter;
    const transfer = Math.min(available, needed);

    surplus.cbAfter -= transfer;
    deficit.cbAfter += transfer;

    // If deficit is zeroed, move pointer inward
    if (deficit.cbAfter >= 0) deficitIdx--;
    // If surplus is drained, move pointer inward
    if (surplus.cbAfter <= 0) surplusIdx++;
  }

  return working.map(s => ({
    shipId: s.shipId,
    cbBefore: s.cbBefore,
    cbAfter: s.cbAfter,
  }));
}
