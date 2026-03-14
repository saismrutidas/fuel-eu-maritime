import { InMemoryRouteRepository } from './InMemoryRouteRepository';
import { InMemoryBankingRepository } from './InMemoryBankingRepository';
import { InMemoryPoolRepository } from './InMemoryPoolRepository';
import { GetRoutesUseCase } from '../../core/application/GetRoutesUseCase';
import { SetBaselineUseCase } from '../../core/application/SetBaselineUseCase';
import { GetComparisonUseCase } from '../../core/application/GetComparisonUseCase';
import { GetComplianceBalanceUseCase } from '../../core/application/GetComplianceBalanceUseCase';
import { BankSurplusUseCase } from '../../core/application/BankSurplusUseCase';
import { ApplyBankedUseCase } from '../../core/application/ApplyBankedUseCase';
import { GetAdjustedCBUseCase } from '../../core/application/GetAdjustedCBUseCase';
import { CreatePoolUseCase } from '../../core/application/CreatePoolUseCase';

// Repositories (outbound adapters)
export const routeRepository   = new InMemoryRouteRepository();
export const bankingRepository = new InMemoryBankingRepository();
export const poolRepository    = new InMemoryPoolRepository();

// Use cases (application layer — wired with repo implementations)
export const getRoutesUseCase            = new GetRoutesUseCase(routeRepository);
export const setBaselineUseCase          = new SetBaselineUseCase(routeRepository);
export const getComparisonUseCase        = new GetComparisonUseCase(routeRepository);
export const getComplianceBalanceUseCase = new GetComplianceBalanceUseCase(bankingRepository);
export const bankSurplusUseCase          = new BankSurplusUseCase(bankingRepository);
export const applyBankedUseCase          = new ApplyBankedUseCase(bankingRepository);
export const getAdjustedCBUseCase        = new GetAdjustedCBUseCase(poolRepository);
export const createPoolUseCase           = new CreatePoolUseCase(poolRepository);
