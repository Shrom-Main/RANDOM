/**
 * POC 1 — Formal Reconciliation & Invariant Testing Dashboard
 *
 * Implements Section 30, 31, 41, 42 of POC 1 Specification:
 * 1. 5 Core Accounting Invariants:
 *    - K-1 Allocations == Fund Taxable Income
 *    - Investor Allocations Sum == 100.0000%
 *    - Tax Capital Rollforward Balances
 *    - Schedule M-3 Bridge Balances
 *    - Tax Lots Integrity Rollforward
 * 2. Three-state Control Status Badges: CONTINUE | REVIEW | REJECT
 * 3. Interactive Discrepancy Injection & Error Detection Testing
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Sliders,
  DollarSign,
  Layers,
  FileText
} from 'lucide-react';
import { runFullReconciliationSuite } from '../engine/reconciliation-engine';

export const ReconciliationDashboardView: React.FC = () => {
  // Test perturbation states for demonstrating error detection
  const [injectK1Drift, setInjectK1Drift] = useState<number>(0);
  const [injectOwnershipLeak, setInjectOwnershipLeak] = useState<number>(0);
  const [injectCapitalDrift, setInjectCapitalDrift] = useState<number>(0);
  const [hasCeilingDistortion, setHasCeilingDistortion] = useState<boolean>(true);

  const baselineTaxableIncome = 16180000;
  const partnerAllocations = baselineTaxableIncome + injectK1Drift;

  // Run the 5-point formal reconciliation suite
  const status = runFullReconciliationSuite({
    fundTaxableIncome: baselineTaxableIncome,
    partnerAllocationsTotal: partnerAllocations,
    partnerOwnershipShares: [40.0 - injectOwnershipLeak, 35.0, 20.0, 5.0],
    openingTaxCapital: 105000000,
    contributions: 12000000,
    taxIncomeAllocated: baselineTaxableIncome,
    distributions: 15000000,
    endingTaxCapital: 118180000 + injectCapitalDrift,
    bookIncome: 14500000,
    bridgeAdjustmentsTotal: 1680000,
    reportedTaxableIncome: baselineTaxableIncome,
    openingLotsCount: 14,
    acquisitionsCount: 6,
    disposalsCount: 2,
    endingLotsCount: 18,
    hasCeilingRuleDistortion: hasCeilingDistortion,
    hasUnverifiedFacts: false
  });

  const resetInjections = () => {
    setInjectK1Drift(0);
    setInjectOwnershipLeak(0);
    setInjectCapitalDrift(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="ios-glass-card rounded-2xl p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
              status.overallControlStatus === 'CONTINUE'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : status.overallControlStatus === 'REVIEW'
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Formal Reconciliation Controls &amp; Invariants
                </h1>
                <span className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                  status.overallControlStatus === 'CONTINUE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : status.overallControlStatus === 'REVIEW'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                }`}>
                  CONTROL STATUS: {status.overallControlStatus}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Enforcing Sections 30 &amp; 31: K-1 balance, 100% allocation, rollforwards, and Schedule M-3 bridges. Every discrepancy generates an auditable exception.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={resetInjections}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-zinc-200 transition-colors cursor-pointer border border-white/10"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Perturbations</span>
        </button>
      </div>

      {/* 5 CORE ACCOUNTING INVARIANTS STATUS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            title: '1. K-1 Total Parity',
            passed: status.k1TotalMatchesTaxableIncome,
            statute: 'IRC § 704(b)',
            desc: 'Sum(K-1) == Taxable Income ($16.18M)'
          },
          {
            title: '2. 100% Partition',
            passed: status.investorAllocationsSumTo100,
            statute: 'Treas. Reg. § 1.704-1',
            desc: `Sum(omega_i) == ${(100 - injectOwnershipLeak).toFixed(4)}%`
          },
          {
            title: '3. Tax Capital Rollforward',
            passed: status.taxCapitalRollforwardBalances,
            statute: 'Schedule M-2',
            desc: 'Opening + Contrib + Inc - Dist == Ending'
          },
          {
            title: '4. Schedule M-3 Bridge',
            passed: status.bookToTaxBridgeReconciled,
            statute: 'IRC § 446 / GAAP',
            desc: 'Book ($14.5M) + Adj ($1.68M) == Tax'
          },
          {
            title: '5. Tax Lots Integrity',
            passed: status.taxLotsDisposalsReconciled,
            statute: 'IRC § 1012',
            desc: '14 Open + 6 Acq - 2 Disp == 18 Lots'
          }
        ].map((inv, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border space-y-2 ${
              inv.passed
                ? 'bg-black/40 border-white/10'
                : 'bg-red-950/20 border-red-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{inv.title}</span>
              {inv.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className="text-[10px] font-mono text-zinc-400">{inv.statute}</div>
            <div className={`text-[11px] font-mono ${inv.passed ? 'text-zinc-300' : 'text-red-300 font-bold'}`}>
              {inv.desc}
            </div>
            <div className="pt-1">
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                inv.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {inv.passed ? 'SATISFIED' : 'VIOLATION DETECTED'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ACTIVE EXCEPTIONS LIST */}
      <div className="ios-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Active Audit Exceptions ({status.activeExceptions.length})
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Every failed reconciliation produces an explicit exception record requiring reviewer sign-off or fact correction.
            </p>
          </div>
        </div>

        {status.activeExceptions.length === 0 ? (
          <div className="p-6 text-center text-xs text-emerald-400 font-mono flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>All reconciliations closed with zero active exceptions. Integrity verified.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {status.activeExceptions.map((exc) => (
              <div
                key={exc.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                  exc.severity === 'CRITICAL'
                    ? 'bg-red-950/20 border-red-500/30 text-red-200'
                    : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                }`}
              >
                {exc.severity === 'CRITICAL' ? (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-[11px]">{exc.id} · {exc.ruleId}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 font-bold">
                      SEVERITY: {exc.severity}
                    </span>
                  </div>
                  <p className="text-xs">{exc.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DISCREPANCY INJECTION TEST LAB (TRY TO BREAK THE MODEL) */}
      <div className="ios-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
        <div>
          <span className="text-[10px] font-mono uppercase text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
            Adversarial Test Lab (Prompt: "Try to Break It")
          </span>
          <h2 className="text-sm font-bold text-white mt-1">
            Simulate Accounting Discrepancies &amp; Test Control Gates
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Perturb K-1 allocations, ownership partitions, or rollforwards to confirm the system immediately triggers REVIEW or REJECT rather than silently producing invalid tax workpapers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Inject K-1 Allocation Drift:</span>
              <span className="font-mono text-red-400 font-bold">
                {injectK1Drift === 0 ? 'No Drift ($0)' : `+$${injectK1Drift.toLocaleString()}`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1000000"
              step="50000"
              value={injectK1Drift}
              onChange={(e) => setInjectK1Drift(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Inject Ownership Partition Leak:</span>
              <span className="font-mono text-red-400 font-bold">
                {injectOwnershipLeak === 0 ? '100% Complete' : `-${injectOwnershipLeak}% Disparity`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={injectOwnershipLeak}
              onChange={(e) => setInjectOwnershipLeak(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300">Inject Capital Account Imbalance:</span>
              <span className="font-mono text-red-400 font-bold">
                {injectCapitalDrift === 0 ? 'Balances ($0)' : `+$${injectCapitalDrift.toLocaleString()}`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2000000"
              step="100000"
              value={injectCapitalDrift}
              onChange={(e) => setInjectCapitalDrift(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
