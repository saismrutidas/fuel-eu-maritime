import { getRoutesUseCase, setBaselineUseCase } from '../../infrastructure/container';
import { useRoutes } from '../hooks/useRoutes';
import { showToast } from '../components/Toast';
import { TARGET_GHG_INTENSITY } from '../../../core/domain/constants';
import { formatNumber } from '../../../shared/formatters';

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">All</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export default function RoutesPage() {
  const {
    filteredRoutes,
    loading,
    error,
    filters,
    setFilters,
    vesselTypes,
    fuelTypes,
    years,
    handleSetBaseline,
    settingBaseline,
  } = useRoutes(getRoutesUseCase, setBaselineUseCase);

  async function onSetBaseline(routeId: string) {
    await handleSetBaseline(routeId);
    showToast(`Route ${routeId} set as baseline`, 'success');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading routes…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header + stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">All Routes</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {filteredRoutes.length} route{filteredRoutes.length !== 1 ? 's' : ''} shown
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
          <span className="font-medium text-slate-600">Target:</span>
          {TARGET_GHG_INTENSITY} gCO₂e/MJ
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Filters</p>
        <div className="flex flex-wrap gap-4">
          <FilterSelect
            label="Vessel Type"
            value={filters.vesselType}
            options={vesselTypes}
            onChange={v => setFilters({ vesselType: v })}
          />
          <FilterSelect
            label="Fuel Type"
            value={filters.fuelType}
            options={fuelTypes}
            onChange={v => setFilters({ fuelType: v })}
          />
          <FilterSelect
            label="Year"
            value={filters.year}
            options={years.map(String)}
            onChange={v => setFilters({ year: v })}
          />
          {(filters.vesselType || filters.fuelType || filters.year) && (
            <div className="flex flex-col justify-end">
              <button
                onClick={() => setFilters({ vesselType: '', fuelType: '', year: '' })}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  'Route ID', 'Vessel Type', 'Fuel Type', 'Year',
                  'GHG Intensity (gCO₂e/MJ)', 'Fuel Consumption (t)',
                  'Distance (km)', 'Total Emissions (t)', 'Status', 'Action',
                ].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No routes match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRoutes.map(route => {
                  const compliant = route.ghgIntensity < TARGET_GHG_INTENSITY;
                  const isSettingThis = settingBaseline === route.routeId;

                  return (
                    <tr
                      key={route.routeId}
                      className={`transition-colors hover:bg-slate-50 ${route.isBaseline ? 'bg-blue-50/60' : ''}`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {route.routeId}
                          {route.isBaseline && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              Baseline
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{route.vesselType}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {route.fuelType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{route.year}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${compliant ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatNumber(route.ghgIntensity, 1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatNumber(route.fuelConsumption, 0)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatNumber(route.distance, 0)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatNumber(route.totalEmissions, 0)}</td>
                      <td className="px-4 py-3">
                        {compliant ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Compliant
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            ✕ Non-Compliant
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {route.isBaseline ? (
                          <span className="text-xs text-slate-400 italic">Current baseline</span>
                        ) : (
                          <button
                            onClick={() => onSetBaseline(route.routeId)}
                            disabled={isSettingThis || settingBaseline !== null}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
                              bg-white border-blue-300 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600
                              disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSettingThis ? 'Setting…' : 'Set Baseline'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
