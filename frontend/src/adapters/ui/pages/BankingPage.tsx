import {
  getComplianceBalanceUseCase,
  bankSurplusUseCase,
  applyBankedUseCase,
} from '../../infrastructure/container';
import { useBanking, SHIP_OPTIONS, YEAR_OPTIONS } from '../hooks/useBanking';
import { validateBankSurplus } from '../../../core/domain/bankingRules';
import { formatGCO2 } from '../../../shared/formatters';
import { showToast } from '../components/Toast';

// ─── KPI card ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
}) {
  const valueColor =
    positive === null || positive === undefined ? 'text-slate-800'
    : positive ? 'text-emerald-600'
    : 'text-red-500';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex-1">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Action form ─────────────────────────────────────────────────────────────
function ActionForm({
  title, description, accentColor, inputLabel, placeholder,
  amount, setAmount, onSubmit, submitting, canSubmit,
  disabledReason, errorMsg,
}: {
  title: string;
  description: string;
  accentColor: string;
  inputLabel: string;
  placeholder: string;
  amount: string;
  setAmount: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  canSubmit: boolean;
  disabledReason?: string;
  errorMsg: string | null;
}) {
  return (
    <div className={`bg-white border-2 rounded-xl p-5 shadow-sm ${canSubmit ? accentColor : 'border-slate-200'}`}>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <p className="text-xs text-slate-400 mt-0.5 mb-4">{description}</p>

      {disabledReason && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
          <span className="text-lg leading-none">🔒</span>
          <span>{disabledReason}</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">{inputLabel}</label>
          <input
            type="number"
            min="1"
            placeholder={placeholder}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={!!disabledReason || submitting}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <span>⚠</span> {errorMsg}
          </p>
        )}

        <button
          onClick={onSubmit}
          disabled={!canSubmit || submitting || !!disabledReason}
          className="w-full py-2 px-4 text-sm font-semibold rounded-lg transition-colors
            bg-blue-600 text-white hover:bg-blue-700
            disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          {submitting ? 'Processing…' : title}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BankingPage() {
  const {
    selectedShip, selectedYear, setSelectedShip, setSelectedYear,
    balance, loading, error,
    bankAmount, setBankAmount, bankError, canBank, isBanking,
    applyAmount, setApplyAmount, applyError, canApply, isApplying,
    submitBank: rawSubmitBank,
    submitApply: rawSubmitApply,
  } = useBanking(getComplianceBalanceUseCase, bankSurplusUseCase, applyBankedUseCase);

  async function submitBank() {
    await rawSubmitBank();
    if (!bankError) showToast(`Surplus banked for ${selectedShip}`, 'success');
  }

  async function submitApply() {
    await rawSubmitApply();
    if (!applyError) showToast(`Banked surplus applied for ${selectedShip}`, 'success');
  }

  // Domain-driven disable reason for banking
  const bankDisabledReason = balance && balance.cbBefore <= 0
    ? validateBankSurplus(balance.cbBefore, 1).error
    : undefined;

  const applyDisabledReason = balance && balance.applied <= 0
    ? 'No banked surplus available. Bank a positive CB first.'
    : undefined;

  return (
    <div className="p-6 space-y-6">

      {/* Ship + year selectors */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Select Ship & Year</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Ship ID</label>
            <select
              value={selectedShip}
              onChange={e => setSelectedShip(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SHIP_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Year</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Loading / error */}
      {loading && (
        <div className="flex items-center gap-3 text-slate-500 text-sm py-4">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading compliance balance…
        </div>
      )}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* KPI cards */}
      {balance && !loading && (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <KpiCard
              label="CB Before"
              value={formatGCO2(balance.cbBefore)}
              sub="Raw compliance balance"
              positive={balance.cbBefore > 0 ? true : balance.cbBefore < 0 ? false : null}
            />
            <div className="flex items-center justify-center text-slate-300 text-2xl font-light select-none">→</div>
            <KpiCard
              label="Banked / Applied"
              value={`${balance.applied >= 0 ? '+' : ''}${formatGCO2(balance.applied)}`}
              sub={balance.applied > 0 ? 'Surplus stored in bank' : balance.applied < 0 ? 'Deficit offset applied' : 'No banking activity'}
              positive={balance.applied >= 0 ? true : false}
            />
            <div className="flex items-center justify-center text-slate-300 text-2xl font-light select-none">→</div>
            <KpiCard
              label="CB After"
              value={formatGCO2(balance.cbAfter)}
              sub="Adjusted balance"
              positive={balance.cbAfter > 0 ? true : balance.cbAfter < 0 ? false : null}
            />
          </div>

          {/* Compliance status banner */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border ${
            balance.cbAfter > 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span className="text-xl">{balance.cbAfter > 0 ? '✅' : '❌'}</span>
            <div>
              <span className="font-semibold">{selectedShip} ({selectedYear})</span>
              {' — '}
              {balance.cbAfter > 0
                ? `In surplus by ${formatGCO2(balance.cbAfter)}. Eligible for banking.`
                : `In deficit by ${formatGCO2(Math.abs(balance.cbAfter))}. Apply banked surplus or pool to resolve.`
              }
            </div>
          </div>

          {/* Action forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ActionForm
              title="Bank Surplus CB"
              description="Store positive compliance balance for use in future periods (Art. 20)."
              accentColor="border-emerald-300"
              inputLabel="Amount to bank (gCO₂e)"
              placeholder="e.g. 10000000"
              amount={bankAmount}
              setAmount={setBankAmount}
              onSubmit={submitBank}
              submitting={isBanking}
              canSubmit={canBank}
              disabledReason={bankDisabledReason}
              errorMsg={bankError}
            />
            <ActionForm
              title="Apply Banked Surplus"
              description="Offset a current deficit by drawing from previously banked surplus (Art. 20)."
              accentColor="border-blue-300"
              inputLabel="Amount to apply (gCO₂e)"
              placeholder="e.g. 5000000"
              amount={applyAmount}
              setAmount={setApplyAmount}
              onSubmit={submitApply}
              submitting={isApplying}
              canSubmit={canApply}
              disabledReason={applyDisabledReason}
              errorMsg={applyError}
            />
          </div>
        </>
      )}
    </div>
  );
}
