import { useState, useEffect, useCallback } from 'react';
import type { ComplianceBalance } from '../../../core/domain/entities';
import type { GetComplianceBalanceUseCase } from '../../../core/application/GetComplianceBalanceUseCase';
import type { BankSurplusUseCase } from '../../../core/application/BankSurplusUseCase';
import type { ApplyBankedUseCase } from '../../../core/application/ApplyBankedUseCase';
import { validateBankSurplus, validateApplyBanked } from '../../../core/domain/bankingRules';

export const SHIP_OPTIONS = ['R001', 'R002', 'R003', 'R004', 'R005'];
export const YEAR_OPTIONS = [2024, 2025];

export interface UseBankingResult {
  selectedShip: string;
  selectedYear: number;
  setSelectedShip: (s: string) => void;
  setSelectedYear: (y: number) => void;
  balance: ComplianceBalance | null;
  loading: boolean;
  error: string | null;
  // bank form
  bankAmount: string;
  setBankAmount: (v: string) => void;
  bankError: string | null;
  canBank: boolean;
  isBanking: boolean;
  submitBank: () => Promise<void>;
  // apply form
  applyAmount: string;
  setApplyAmount: (v: string) => void;
  applyError: string | null;
  canApply: boolean;
  isApplying: boolean;
  submitApply: () => Promise<void>;
}

export function useBanking(
  getBalance: GetComplianceBalanceUseCase,
  bankSurplus: BankSurplusUseCase,
  applyBanked: ApplyBankedUseCase,
): UseBankingResult {
  const [selectedShip, setSelectedShip] = useState(SHIP_OPTIONS[0]);
  const [selectedYear, setSelectedYear] = useState(YEAR_OPTIONS[0]);
  const [balance, setBalance] = useState<ComplianceBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bankAmount, setBankAmount] = useState('');
  const [bankError, setBankError] = useState<string | null>(null);
  const [isBanking, setIsBanking] = useState(false);

  const [applyAmount, setApplyAmount] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const loadBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const b = await getBalance.execute(selectedShip, selectedYear);
      setBalance(b);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [getBalance, selectedShip, selectedYear]);

  useEffect(() => { void loadBalance(); }, [loadBalance]);

  // Derive live validation state directly from domain rules
  const bankAmountNum = parseFloat(bankAmount);
  const bankValidation = balance
    ? validateBankSurplus(balance.cbBefore, isNaN(bankAmountNum) ? 0 : bankAmountNum)
    : { valid: false, error: 'Loading…' };
  const canBank = bankValidation.valid;

  const applyAmountNum = parseFloat(applyAmount);
  const applyValidation = balance
    ? validateApplyBanked(isNaN(applyAmountNum) ? 0 : applyAmountNum, balance.applied)
    : { valid: false, error: 'Loading…' };
  const canApply = applyValidation.valid;

  const submitBank = useCallback(async () => {
    if (!canBank) { setBankError(bankValidation.error ?? 'Invalid'); return; }
    setIsBanking(true);
    setBankError(null);
    try {
      const updated = await bankSurplus.execute(selectedShip, bankAmountNum, selectedYear);
      setBalance(updated);
      setBankAmount('');
    } catch (e) {
      setBankError(String(e).replace('Error: ', ''));
    } finally {
      setIsBanking(false);
    }
  }, [canBank, bankValidation, bankSurplus, selectedShip, bankAmountNum, selectedYear]);

  const submitApply = useCallback(async () => {
    if (!canApply) { setApplyError(applyValidation.error ?? 'Invalid'); return; }
    setIsApplying(true);
    setApplyError(null);
    try {
      const updated = await applyBanked.execute(selectedShip, applyAmountNum, selectedYear);
      setBalance(updated);
      setApplyAmount('');
    } catch (e) {
      setApplyError(String(e).replace('Error: ', ''));
    } finally {
      setIsApplying(false);
    }
  }, [canApply, applyValidation, applyBanked, selectedShip, applyAmountNum, selectedYear]);

  return {
    selectedShip, selectedYear, setSelectedShip, setSelectedYear,
    balance, loading, error,
    bankAmount, setBankAmount, bankError, canBank, isBanking, submitBank,
    applyAmount, setApplyAmount, applyError, canApply, isApplying, submitApply,
  };
}
