/** A shipping route with GHG intensity and fuel data */
export interface Route {
  id: number;
  routeId: string;
  year: number;
  ghgIntensity: number;   // gCO₂e/MJ
  isBaseline: boolean;
  fuelConsumption: number; // tonnes
}

/** Snapshot of a ship's compliance balance at a point in time */
export interface ShipCompliance {
  id: number;
  shipId: string;
  year: number;
  cbGco2eq: number; // Compliance Balance in gCO₂e
}

/** A bank ledger entry — surplus deposited or deficit applied */
export interface BankEntry {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number; // positive = deposit, negative = withdrawal
  createdAt: Date;
}

/** A pooling arrangement grouping ships to collectively meet compliance */
export interface Pool {
  id: number;
  year: number;
  createdAt: Date;
  members: PoolMember[];
}

/** Outcome for a single ship within a pool */
export interface PoolMember {
  poolId: number;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

/** Input shape for greedy pool allocation */
export interface PoolShipInput {
  shipId: string;
  cb: number;
}

/** Output shape for greedy pool allocation */
export interface PoolAllocationResult {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

/** Route comparison result against baseline */
export interface RouteComparisonResult {
  routeId: string;
  ghgIntensity: number;
  percentDiff: number;   // % relative to baseline (positive = worse, negative = better)
  compliant: boolean;
}
