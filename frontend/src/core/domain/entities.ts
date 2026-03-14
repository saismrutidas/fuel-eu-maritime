export interface Route {
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;       // gCO₂e/MJ
  fuelConsumption: number;    // tonnes
  distance: number;           // km
  totalEmissions: number;     // tonnes CO₂e
  isBaseline?: boolean;
}

export interface ComparisonData {
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  isBaseline: boolean;
  percentDiff: number | null;   // null for the baseline itself
  compliant: boolean;
}

export interface ComplianceBalance {
  shipId: string;
  year: number;
  cbBefore: number;      // gCO₂e
  applied: number;       // gCO₂e — net banked/applied
  cbAfter: number;       // gCO₂e
}

export interface PoolMember {
  shipId: string;
  vesselType: string;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  id?: string;
  year: number;
  members: PoolMember[];
  totalCB: number;
  isValid: boolean;
}
