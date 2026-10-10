/**
 * POC 1 — Formal Reconciliation & Invariant Testing Engine
 *
 * Enforces Section 30 & 31 of POC 1 Specification:
 * 1. K-1 Total Allocations == Fund Taxable Income
 * 2. Investor Allocations Sum == 100.00%
 * 3. Tax Capital Rollforward Balances
 * 4. Book-to-Tax Bridge Reconciled
 * 5. Tax Lots Integrity Reconciled
 *
 * Outputs explicit Control Status:
 * - CONTINUE
 * - REVIEW
 * - REJECT
 */

import { ReconciliationStatus } from '../types/tax-engine-v2';

export function runFullReconciliationSuite(params: {
  fundTaxableIncome: number;
  partnerAllocationsTotal: number;
  partnerOwnershipShares: number[];
  openingTaxCapital: number;
  contributions: number;
  taxIncomeAllocated: number;
  distributions: number;
  endingTaxCapital: number;
  bookIncome: number;
  bridgeAdjustmentsTotal: number;
  reportedTaxableIncome: number;
  openingLotsCount: number;
  acquisitionsCount: number;
  disposalsCount: number;
  endingLotsCount: number;
  hasCeilingRuleDistortion?: boolean;
  hasUnverifiedFacts?: boolean;
}): ReconciliationStatus {
  const {
    fundTaxableIncome,
    partnerAllocationsTotal,
    partnerOwnershipShares,
    openingTaxCapital,
    contributions,
    taxIncomeAllocated,
    distributions,
    endingTaxCapital,
    bookIncome,
    bridgeAdjustmentsTotal,
    reportedTaxableIncome,
    openingLotsCount,
    acquisitionsCount,
    disposalsCount,
    endingLotsCount,
    hasCeilingRuleDistortion = false,
    hasUnverifiedFacts = false
  } = params;

  const exceptions: { id: string; severity: 'CRITICAL' | 'WARNING' | 'INFO'; message: string; ruleId: string }[] = [];

  // Check 1: K-1 Allocations == Fund Taxable Income
  const k1Diff = Math.abs(partnerAllocationsTotal - fundTaxableIncome);
  const k1TotalMatchesTaxableIncome = k1Diff < 1.0;
  if (!k1TotalMatchesTaxableIncome) {
    exceptions.push({
      id: 'EXC-K1-MISMATCH',
      severity: 'CRITICAL',
      message: `Total Schedule K-1 allocations ($${partnerAllocationsTotal.toLocaleString()}) do not match fund taxable income ($${fundTaxableIncome.toLocaleString()}). Disparity: $${k1Diff.toFixed(2)}.`,
      ruleId: 'IRC § 704(b)'
    });
  }

  // Check 2: Ownership percentages sum to 100%
  const totalShares = partnerOwnershipShares.reduce((a, b) => a + b, 0);
  const investorAllocationsSumTo100 = Math.abs(totalShares - 100.0) < 0.0001;
  if (!investorAllocationsSumTo100) {
    exceptions.push({
      id: 'EXC-PARTITION-FAIL',
      severity: 'CRITICAL',
      message: `Complete ownership partition invariant failed: sum(omega_i) = ${totalShares.toFixed(4)}% (Expected exactly 100.0000%).`,
      ruleId: 'Treas. Reg. § 1.704-1(b)(2)'
    });
  }

  // Check 3: Tax Capital Rollforward
  const computedEndingCapital = openingTaxCapital + contributions + taxIncomeAllocated - distributions;
  const capitalDiff = Math.abs(computedEndingCapital - endingTaxCapital);
  const taxCapitalRollforwardBalances = capitalDiff < 1.0;
  if (!taxCapitalRollforwardBalances) {
    exceptions.push({
      id: 'EXC-CAPITAL-ROLLFORWARD',
      severity: 'CRITICAL',
      message: `Tax capital rollforward failed: Computed ending capital ($${computedEndingCapital.toLocaleString()}) does not match reported tax capital ($${endingTaxCapital.toLocaleString()}).`,
      ruleId: 'Form 1065 Schedule M-2'
    });
  }

  // Check 4: Book-to-Tax Bridge
  const computedTaxableFromBridge = bookIncome + bridgeAdjustmentsTotal;
  const bridgeDiff = Math.abs(computedTaxableFromBridge - reportedTaxableIncome);
  const bookToTaxBridgeReconciled = bridgeDiff < 1.0;
  if (!bookToTaxBridgeReconciled) {
    exceptions.push({
      id: 'EXC-BRIDGE-MISMATCH',
      severity: 'CRITICAL',
      message: `Book-to-tax bridge does not close: Book ($${bookIncome.toLocaleString()}) + Adjustments ($${bridgeAdjustmentsTotal.toLocaleString()}) = $${computedTaxableFromBridge.toLocaleString()}, but reported is $${reportedTaxableIncome.toLocaleString()}.`,
      ruleId: 'Form 1065 Schedule M-3'
    });
  }

  // Check 5: Tax Lots Disposal Consistency
  const computedEndingLots = openingLotsCount + acquisitionsCount - disposalsCount;
  const taxLotsDisposalsReconciled = computedEndingLots === endingLotsCount;
  if (!taxLotsDisposalsReconciled) {
    exceptions.push({
      id: 'EXC-LOT-MISMATCH',
      severity: 'WARNING',
      message: `Tax lot rollforward discrepancy: Opening (${openingLotsCount}) + Acq (${acquisitionsCount}) - Disp (${disposalsCount}) = ${computedEndingLots} lots, but system reports ${endingLotsCount} active lots.`,
      ruleId: 'IRC § 1012'
    });
  }

  // Warnings for Ceiling Rule Distortion or Unverified Facts
  if (hasCeilingRuleDistortion) {
    exceptions.push({
      id: 'EXC-CEILING-DISTORTION',
      severity: 'WARNING',
      message: 'Active Section 704(c) traditional method ceiling rule distortion detected. Book depreciation exceeds available partnership tax depreciation.',
      ruleId: 'Treas. Reg. § 1.704-3(b)(1)'
    });
  }

  if (hasUnverifiedFacts) {
    exceptions.push({
      id: 'EXC-UNVERIFIED-FACTS',
      severity: 'WARNING',
      message: 'Unverified candidate facts detected in transaction stream. Review required before promoting to final workpaper.',
      ruleId: 'POC 1 Section 33'
    });
  }

  // Determine overall control status
  let overallControlStatus: 'CONTINUE' | 'REVIEW' | 'REJECT' = 'CONTINUE';

  const hasCritical = exceptions.some(e => e.severity === 'CRITICAL');
  const hasWarning = exceptions.some(e => e.severity === 'WARNING');

  if (hasCritical) {
    overallControlStatus = 'REJECT';
  } else if (hasWarning) {
    overallControlStatus = 'REVIEW';
  } else {
    overallControlStatus = 'CONTINUE';
  }

  return {
    k1TotalMatchesTaxableIncome,
    investorAllocationsSumTo100,
    taxCapitalRollforwardBalances,
    bookToTaxBridgeReconciled,
    taxLotsDisposalsReconciled,
    overallControlStatus,
    activeExceptions: exceptions
  };
}
