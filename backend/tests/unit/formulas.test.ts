import {
  computeEnergyInScope,
  computeCB,
  computeComparison,
  computePoolGreedyAllocation,
} from '../../src/core/domain/formulas';
import { TARGET_INTENSITY_2025, MJ_PER_TONNE } from '../../src/core/domain/constants';

// ---------------------------------------------------------------------------
// computeEnergyInScope
// ---------------------------------------------------------------------------
describe('computeEnergyInScope', () => {
  it('converts tonnes of fuel to MJ correctly', () => {
    expect(computeEnergyInScope(1)).toBe(41_000);
    expect(computeEnergyInScope(500)).toBe(500 * 41_000);
  });

  it('returns 0 for zero fuel consumption', () => {
    expect(computeEnergyInScope(0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeCB
// ---------------------------------------------------------------------------
describe('computeCB', () => {
  it('returns positive CB (surplus) when intensity is below target', () => {
    // intensity 75 < 89.3368 → surplus
    const cb = computeCB(75, 500);
    expect(cb).toBeGreaterThan(0);
    // exact: (89.3368 - 75) * 500 * 41000
    expect(cb).toBeCloseTo((TARGET_INTENSITY_2025 - 75) * 500 * MJ_PER_TONNE, 2);
  });

  it('returns negative CB (deficit) when intensity is above target', () => {
    // intensity 95.5 > 89.3368 → deficit
    const cb = computeCB(95.5, 320);
    expect(cb).toBeLessThan(0);
    expect(cb).toBeCloseTo((TARGET_INTENSITY_2025 - 95.5) * 320 * MJ_PER_TONNE, 2);
  });

  it('returns zero CB when intensity exactly equals target', () => {
    const cb = computeCB(TARGET_INTENSITY_2025, 400);
    expect(cb).toBeCloseTo(0, 5);
  });

  it('respects a custom target intensity', () => {
    const cb = computeCB(80, 200, 80);
    expect(cb).toBeCloseTo(0, 5);
  });
});

// ---------------------------------------------------------------------------
// computeComparison
// ---------------------------------------------------------------------------
describe('computeComparison', () => {
  const baseline = 75.0;

  it('marks a route as compliant when intensity <= target', () => {
    const [result] = computeComparison(baseline, [
      { routeId: 'R1', ghgIntensity: 80.0 },
    ]);
    expect(result.compliant).toBe(true); // 80 <= 89.3368
  });

  it('marks a route as non-compliant when intensity > target', () => {
    const [result] = computeComparison(baseline, [
      { routeId: 'R2', ghgIntensity: 95.5 },
    ]);
    expect(result.compliant).toBe(false); // 95.5 > 89.3368
  });

  it('calculates percentDiff correctly — worse route is positive', () => {
    // Route intensity 90 vs baseline 75 → worse by (90-75)/75*100 = 20%
    const [result] = computeComparison(75, [{ routeId: 'R3', ghgIntensity: 90 }]);
    expect(result.percentDiff).toBeCloseTo(20, 5);
  });

  it('calculates percentDiff correctly — better route is negative', () => {
    // Route intensity 60 vs baseline 75 → better by (60-75)/75*100 = -20%
    const [result] = computeComparison(75, [{ routeId: 'R4', ghgIntensity: 60 }]);
    expect(result.percentDiff).toBeCloseTo(-20, 5);
  });

  it('returns zero percentDiff when route intensity equals baseline', () => {
    const [result] = computeComparison(75, [{ routeId: 'R5', ghgIntensity: 75 }]);
    expect(result.percentDiff).toBeCloseTo(0, 5);
  });

  it('handles multiple routes', () => {
    const results = computeComparison(80, [
      { routeId: 'A', ghgIntensity: 75 },
      { routeId: 'B', ghgIntensity: 95 },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].compliant).toBe(true);
    expect(results[1].compliant).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computePoolGreedyAllocation
// ---------------------------------------------------------------------------
describe('computePoolGreedyAllocation', () => {
  it('zeros out deficit ships when total pool is positive', () => {
    const ships = [
      { shipId: 'A', cb: 1_000_000 },
      { shipId: 'B', cb: -400_000 },
    ];
    const results = computePoolGreedyAllocation(ships);
    const b = results.find(r => r.shipId === 'B')!;
    const a = results.find(r => r.shipId === 'A')!;

    expect(b.cbAfter).toBeCloseTo(0, 5);
    expect(a.cbAfter).toBeCloseTo(600_000, 5); // 1M - 400K
  });

  it('preserves cbBefore for all members', () => {
    const ships = [
      { shipId: 'X', cb: 500 },
      { shipId: 'Y', cb: -200 },
    ];
    const results = computePoolGreedyAllocation(ships);
    const x = results.find(r => r.shipId === 'X')!;
    const y = results.find(r => r.shipId === 'Y')!;
    expect(x.cbBefore).toBe(500);
    expect(y.cbBefore).toBe(-200);
  });

  it('handles an exactly balanced pool (Σ = 0)', () => {
    const ships = [
      { shipId: 'A', cb: 500 },
      { shipId: 'B', cb: -500 },
    ];
    const results = computePoolGreedyAllocation(ships);
    results.forEach(r => expect(r.cbAfter).toBeCloseTo(0, 5));
  });

  it('does not give a surplus ship a negative cbAfter', () => {
    const ships = [
      { shipId: 'A', cb: 100 },
      { shipId: 'B', cb: -50 },
      { shipId: 'C', cb: -50 },
    ];
    const results = computePoolGreedyAllocation(ships);
    results.forEach(r => expect(r.cbAfter).toBeGreaterThanOrEqual(0));
  });

  it('does not make deficit ships worse than their cbBefore', () => {
    const ships = [
      { shipId: 'S', cb: 1_000 },
      { shipId: 'D', cb: -300 },
    ];
    const results = computePoolGreedyAllocation(ships);
    const d = results.find(r => r.shipId === 'D')!;
    expect(d.cbAfter).toBeGreaterThanOrEqual(d.cbBefore);
  });

  it('handles multiple surplus and deficit ships', () => {
    const ships = [
      { shipId: 'A', cb: 600 },
      { shipId: 'B', cb: 400 },
      { shipId: 'C', cb: -300 },
      { shipId: 'D', cb: -200 },
    ];
    const results = computePoolGreedyAllocation(ships);
    const totalAfter = results.reduce((sum, r) => sum + r.cbAfter, 0);
    const totalBefore = ships.reduce((sum, s) => sum + s.cb, 0);
    // Conservation: total CB must be preserved
    expect(totalAfter).toBeCloseTo(totalBefore, 5);
    // All deficits should be resolved
    results
      .filter(r => r.cbBefore < 0)
      .forEach(r => expect(r.cbAfter).toBeGreaterThanOrEqual(0));
  });

  it('returns all-positive ships unchanged when no deficits exist', () => {
    const ships = [
      { shipId: 'A', cb: 300 },
      { shipId: 'B', cb: 200 },
    ];
    const results = computePoolGreedyAllocation(ships);
    results.forEach(r => {
      const original = ships.find(s => s.shipId === r.shipId)!;
      expect(r.cbAfter).toBeCloseTo(original.cb, 5);
    });
  });
});
