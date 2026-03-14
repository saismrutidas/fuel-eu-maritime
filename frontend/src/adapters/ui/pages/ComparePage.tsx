import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { getComparisonUseCase } from '../../infrastructure/container';
import { useComparison } from '../hooks/useComparison';
import { TARGET_GHG_INTENSITY } from '../../../core/domain/constants';
import { deviationFromTarget } from '../../../core/domain/comparisonFormulas';
import { formatNumber, formatPercent } from '../../../shared/formatters';
import type { ComparisonData } from '../../../core/domain/entities';

// ─── Summary KPI card ───────────────────────────────────────────────────────
function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Comparison table row ────────────────────────────────────────────────────
function CompareRow({ row, baselineGHG }: { row: ComparisonData; baselineGHG: number }) {
  const deviation = deviationFromTarget(row.ghgIntensity);
  const diffColor =
    row.percentDiff === null ? 'text-slate-400'
    : row.percentDiff > 0 ? 'text-red-600 font-semibold'
    : 'text-emerald-600 font-semibold';

  return (
    <tr className={`transition-colors hover:bg-slate-50 ${row.isBaseline ? 'bg-blue-50/50' : ''}`}>
      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {row.routeId}
          {row.isBaseline && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
              Baseline
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-slate-600">{row.vesselType}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {row.fuelType}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-600">{row.year}</td>
      {/* Baseline GHG */}
      <td className="px-4 py-3 text-slate-600">{formatNumber(baselineGHG, 2)}</td>
      {/* This route GHG */}
      <td className="px-4 py-3 font-semibold text-slate-800">{formatNumber(row.ghgIntensity, 2)}</td>
      {/* vs target deviation */}
      <td className="px-4 py-3">
        <span className={deviation >= 0 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
          {deviation >= 0 ? '+' : ''}{formatNumber(deviation, 2)}
        </span>
      </td>
      {/* % diff vs baseline */}
      <td className={`px-4 py-3 ${diffColor}`}>
        {row.percentDiff === null ? '—' : formatPercent(row.percentDiff)}
      </td>
      {/* Compliant */}
      <td className="px-4 py-3">
        {row.compliant ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✅ Compliant
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            ❌ Non-Compliant
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const compliant = val < TARGET_GHG_INTENSITY;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-slate-600">
        GHG Intensity: <span className={`font-bold ${compliant ? 'text-emerald-600' : 'text-red-600'}`}>
          {formatNumber(val, 2)} gCO₂e/MJ
        </span>
      </p>
      <p className="text-slate-400 text-xs mt-1">
        Target: {TARGET_GHG_INTENSITY} gCO₂e/MJ
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const { data, baseline, loading, error } = useComparison(getComparisonUseCase);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading comparison data…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
    );
  }

  if (!baseline) {
    return (
      <div className="m-6 p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
        <p className="font-semibold">No baseline route set.</p>
        <p className="text-sm mt-1">Go to the <strong>Routes</strong> tab and click "Set Baseline" on a route first.</p>
      </div>
    );
  }

  const compliantCount = data.filter(d => d.compliant).length;
  const chartData = data.map(d => ({ name: d.routeId, ghgIntensity: d.ghgIntensity, isBaseline: d.isBaseline, compliant: d.compliant }));

  return (
    <div className="p-6 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Baseline Route"
          value={baseline.routeId}
          sub={`${formatNumber(baseline.ghgIntensity, 2)} gCO₂e/MJ`}
        />
        <KpiCard
          label="FuelEU Target"
          value={`${TARGET_GHG_INTENSITY}`}
          sub="gCO₂e/MJ (2025)"
        />
        <KpiCard
          label="Compliant Routes"
          value={`${compliantCount} / ${data.length}`}
          sub={compliantCount === data.length ? 'All routes compliant ✅' : 'Some routes need attention'}
        />
        <KpiCard
          label="Baseline Deviation"
          value={`${deviationFromTarget(baseline.ghgIntensity) >= 0 ? '+' : ''}${formatNumber(deviationFromTarget(baseline.ghgIntensity), 2)}`}
          sub="vs target (gCO₂e/MJ)"
        />
      </div>

      {/* Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">GHG Intensity by Route</h3>
        <p className="text-xs text-slate-400 mb-4">
          Orange dashed line = FuelEU 2025 target ({TARGET_GHG_INTENSITY} gCO₂e/MJ)
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis
              domain={[80, 100]}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={v => `${v}`}
              label={{ value: 'gCO₂e/MJ', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 11, fill: '#94a3b8' } }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              formatter={v => v === 'ghgIntensity' ? 'GHG Intensity (gCO₂e/MJ)' : v}
              wrapperStyle={{ fontSize: 12 }}
            />
            <ReferenceLine
              y={TARGET_GHG_INTENSITY}
              stroke="#f97316"
              strokeDasharray="6 3"
              strokeWidth={2}
              label={{ value: 'Target 89.34', position: 'right', fontSize: 11, fill: '#f97316' }}
            />
            <Bar dataKey="ghgIntensity" radius={[4, 4, 0, 0]} maxBarSize={56}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isBaseline ? '#3b82f6' : entry.compliant ? '#10b981' : '#ef4444'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Baseline</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Compliant</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Non-Compliant</span>
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Detailed Comparison</h3>
          <p className="text-xs text-slate-400 mt-0.5">% diff measured against current baseline route</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Route ID', 'Vessel', 'Fuel', 'Year', 'Baseline GHG', 'Route GHG', 'vs Target', '% vs Baseline', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(row => (
                <CompareRow key={row.routeId} row={row} baselineGHG={baseline.ghgIntensity} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
