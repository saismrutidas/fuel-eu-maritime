/**
 * Domain rules for FuelEU Article 20 — Banking & Borrowing.
 * Pure TypeScript — no framework dependencies.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * A ship can only bank surplus CB.
 * Rule: cbBefore must be strictly positive.
 */
export function validateBankSurplus(cbBefore: number, amount: number): ValidationResult {
  if (cbBefore <= 0) {
    return {
      valid: false,
      error: `Cannot bank: compliance balance is ${cbBefore <= 0 ? 'negative or zero' : 'zero'}. Only positive (surplus) CB can be banked.`,
    };
  }
  if (amount <= 0) {
    return { valid: false, error: 'Amount to bank must be a positive number.' };
  }
  if (amount > cbBefore) {
    return {
      valid: false,
      error: `Cannot bank ${amount.toLocaleString()} gCO₂e — exceeds available CB of ${cbBefore.toLocaleString()} gCO₂e.`,
    };
  }
  return { valid: true };
}

/**
 * A ship can only apply banked surplus that it has already stored.
 * Rule: amount must not exceed net banked balance.
 */
export function validateApplyBanked(amount: number, netBanked: number): ValidationResult {
  if (netBanked <= 0) {
    return { valid: false, error: 'No banked surplus available to apply.' };
  }
  if (amount <= 0) {
    return { valid: false, error: 'Amount to apply must be a positive number.' };
  }
  if (amount > netBanked) {
    return {
      valid: false,
      error: `Cannot apply ${amount.toLocaleString()} gCO₂e — only ${netBanked.toLocaleString()} gCO₂e available in the bank.`,
    };
  }
  return { valid: true };
}
