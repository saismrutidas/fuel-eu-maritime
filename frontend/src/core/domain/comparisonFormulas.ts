import { TARGET_GHG_INTENSITY } from './constants';

/**
 * Percentage difference of a comparison route against the baseline.
 * Formula: ((comparisonGHG / baselineGHG) - 1) * 100
 * Positive → comparison is worse (higher intensity).
 * Negative → comparison is better (lower intensity).
 */
export function computePercentDiff(comparisonGHG: number, baselineGHG: number): number {
  return ((comparisonGHG / baselineGHG) - 1) * 100;
}

/**
 * A route is compliant if its GHG intensity is strictly below the 2025 target.
 */
export function isCompliant(ghgIntensity: number): boolean {
  return ghgIntensity < TARGET_GHG_INTENSITY;
}

/**
 * Deviation from the FuelEU target in absolute gCO₂e/MJ.
 * Negative means below target (good).
 */
export function deviationFromTarget(ghgIntensity: number): number {
  return ghgIntensity - TARGET_GHG_INTENSITY;
}
