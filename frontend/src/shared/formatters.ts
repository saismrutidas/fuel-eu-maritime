export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatGCO2(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 2)} GtCO₂e`;
  if (abs >= 1_000_000) return `${formatNumber(value / 1_000_000, 2)} MtCO₂e`;
  if (abs >= 1_000) return `${formatNumber(value / 1_000, 2)} ktCO₂e`;
  return `${formatNumber(value, 0)} gCO₂e`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value, 2)}%`;
}
