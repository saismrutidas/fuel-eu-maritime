import { getAdjustedCBUseCase, createPoolUseCase } from '../../infrastructure/container';
import { usePooling, POOL_YEAR_OPTIONS } from '../hooks/usePooling';
import { showToast } from '../components/Toast';
import { formatGCO2 } from '../../../shared/formatters';
import type { PoolAllocation } from '../../../core/domain/poolingRules';
import type { PoolMember } from '../../../core/domain/entities';

// ─── CB delta pill ───────────────────────────────────────────────────────────
function DeltaBadge({ before, after }: { before: number; after: number }) {
  const delta = after - before;
  if (Math.abs(delta) < 1) return <span className="text-slate-400 text-xs">—</span>;
  const positive = delta > 0;
  return (
    <span className={`text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
      {positive ? '▲' : '▼'} {formatGCO2(Math.abs(delta))}
    </span>
  );
}

// ─── Ship selection row ──────────────────────────────────────────────────────
function ShipRow({
  member, selected, onToggle, preview,
}: {
  member: PoolMember;
  selected: boolean;
  onToggle: () => void;
  preview: PoolAllocation | undefined;
}) {
  const surplus = member.cbBefore > 0;
  return (
    <tr
      className={`transition-colors cursor-pointer hover:bg-slate-50 ${selected ? 'bg-blue-50/60' : ''}`}
      onClick={onToggle}
    >
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={e => e.stopPropagation()}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </td>
      <td className="px-4 py-3 font-semibold text-slate-800">{member.shipId}</td>
      <td className="px-4 py-3 text-slate-600 text-sm">{member.vesselType}</td>
      <td className="px-4 py-3">
        <span className={`text-sm font-semibold ${surplus ? 'text-emerald-600' : 'text-red-500'}`}>
          {formatGCO2(member.cbBefore)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          surplus ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {surplus ? '↑ Surplus' : '↓ Deficit'}
        </span>
      </td>
      {/* Preview columns — only shown when this ship is in the selection */}
      <td className="px-4 py-3">
        {selected && preview
          ? <span className={`text-sm font-semibold ${preview.cbAfter >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatGCO2(preview.cbAfter)}
            </span>
          : <span className="text-slate-300 text-sm">—</span>
        }
      </td>
      <td className="px-4 py-3">
        {selected && preview
          ? <DeltaBadge before={member.cbBefore} after={preview.cbAfter} />
          : <span className="text-slate-300 text-sm">—</span>
        }
      </td>
    </tr>
  );
}

// ─── Created pool result card ────────────────────────────────────────────────
function PoolResult({ members }: { members: PoolAllocation[] }) {
  return (
    <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">✅</span>
        <h3 className="font-semibold text-emerald-800">Pool Created Successfully</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-emerald-200">
              {['Ship', 'Vessel Type', 'CB Before', 'CB After', 'Change'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100">
            {members.map(m => (
              <tr key={m.shipId}>
                <td className="px-3 py-2 font-semibold text-slate-700">{m.shipId}</td>
                <td className="px-3 py-2 text-slate-600">{m.vesselType}</td>
                <td className="px-3 py-2">
                  <span className={m.cbBefore >= 0 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                    {formatGCO2(m.cbBefore)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={m.cbAfter >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                    {formatGCO2(m.cbAfter)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <DeltaBadge before={m.cbBefore} after={m.cbAfter} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PoolingPage() {
  const {
    year, setYear,
    allMembers, loading, error,
    selectedIds, toggleMember, selectAll, clearAll,
    preview, validation,
    isCreating, createdPool, submitPool, resetPool,
  } = usePooling(getAdjustedCBUseCase, createPoolUseCase);

  async function handleCreatePool() {
    await submitPool();
    showToast('Pool created successfully (Art. 21)', 'success');
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="p-6 space-y-5">

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Compliance Year</label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {POOL_YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex gap-2 pb-0.5">
          <button onClick={selectAll} className="px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Select All
          </button>
          <button onClick={clearAll} className="px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Clear
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-slate-500 text-sm py-4">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading adjusted compliance balances…
        </div>
      )}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {!loading && !error && (
        <>
          {/* Pool sum indicator */}
          <div className={`flex items-center justify-between px-5 py-4 rounded-xl border-2 ${
            selectedCount < 2
              ? 'bg-slate-50 border-slate-200'
              : validation.valid
                ? 'bg-emerald-50 border-emerald-400'
                : 'bg-red-50 border-red-400'
          }`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Pool Sum (Σ CB)</p>
              <p className={`text-3xl font-bold ${
                selectedCount < 2 ? 'text-slate-400'
                : validation.valid ? 'text-emerald-700'
                : 'text-red-600'
              }`}>
                {selectedCount < 2
                  ? '—'
                  : `${validation.totalCB >= 0 ? '+' : ''}${formatGCO2(validation.totalCB)}`
                }
              </p>
              {selectedCount >= 2 && !validation.valid && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <span>⚠</span> {validation.error}
                </p>
              )}
              {selectedCount >= 2 && validation.valid && (
                <p className="text-xs text-emerald-600 mt-1">✓ Pool is valid — total CB ≥ 0</p>
              )}
              {selectedCount < 2 && (
                <p className="text-xs text-slate-400 mt-1">Select at least 2 ships to form a pool</p>
              )}
            </div>

            <button
              onClick={handleCreatePool}
              disabled={!validation.valid || isCreating || !!createdPool}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors
                bg-blue-600 text-white hover:bg-blue-700 shadow-sm
                disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isCreating ? 'Creating…' : createdPool ? 'Pool Created ✓' : 'Create Pool'}
            </button>
          </div>

          {/* Ship selection table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Ships Available for Pooling</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedCount} of {allMembers.length} selected
                  {selectedCount >= 2 && ' · CB After columns show greedy allocation preview'}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['', 'Ship ID', 'Vessel Type', 'CB Before', 'Status', 'CB After (Preview)', 'Change'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allMembers.map(member => {
                    const previewEntry = preview.find(p => p.shipId === member.shipId);
                    return (
                      <ShipRow
                        key={member.shipId}
                        member={member}
                        selected={selectedIds.has(member.shipId)}
                        onToggle={() => toggleMember(member.shipId)}
                        preview={selectedIds.has(member.shipId) ? previewEntry : undefined}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pool result */}
          {createdPool && (
            <div className="space-y-3">
              <PoolResult members={createdPool.members as PoolAllocation[]} />
              <button
                onClick={resetPool}
                className="text-sm text-slate-500 underline hover:text-slate-700"
              >
                Create another pool
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
