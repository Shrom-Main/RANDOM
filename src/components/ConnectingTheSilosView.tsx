/**
 * POC 1 Flagship Demonstration: "Connecting the Silos"
 *
 * Implements Section 39 & 58 of POC 1 Specification:
 * Traces a single economic transaction across:
 * TRADE -> POSITION -> BOOK ACCOUNTING -> TAX LOT -> PARTNERSHIP BASIS ->
 * § 743(b) -> § 755 -> DEPRECIATION -> INVESTOR ALLOCATION -> K-1 -> WITHHOLDING -> AUDIT TRAIL
 *
 * Includes the crucial Partner Death / IRC § 1014 Step-Up Scenario (Steps 8-11)
 * and the complete 25-step guided walkthrough.
 */

import React, { useState } from 'react';
import {
  GitCommit,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Building2,
  Layers,
  FileText,
  DollarSign,
  TrendingUp,
  Cpu,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { MathView } from './MathView';
import { DEMO_25_STEPS, SYNTHETIC_ENTITIES, SYNTHETIC_ASSETS } from '../engine/synthetic-fund-data';
import { computeSection743bStepUp, computeSection704cLayer } from '../engine/deterministic-tax-engine';

export const ConnectingTheSilosView: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(7); // Default to Step 8 (Partner Death)
  const [isAutomatedRunning, setIsAutomatedRunning] = useState<boolean>(false);
  const [partnerDeathFmv, setPartnerDeathFmv] = useState<number>(10000000);
  const [isSection754Active, setIsSection754Active] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'DEMO_SCRIPT' | 'PARTNER_DEATH' | 'SILO_TRACE'>('PARTNER_DEATH');

  const currentStep = DEMO_25_STEPS[currentStepIndex];

  // Dynamic recalculation of Partner Death Step-Up under IRC § 1014 & § 743(b)
  const deathCalculation = computeSection743bStepUp({
    transferEventId: 'EVT-008-DEATH',
    transfereePartnerId: 'ENT-INV-US-01-SUCCESSOR',
    transferorPartnerId: 'ENT-INV-US-01-DECEDENT',
    effectiveDate: '2023-06-15',
    transferReason: 'DEATH_IRC_1014',
    outsideBasisPriceOrFmv: partnerDeathFmv,
    transfereeShareOfInsideBasis: 4000000,
    isSection754InEffect: isSection754Active,
    capitalAssetFmvDisparityPct: 0.80,
    usefulLifeYears: 15
  });

  const runAllSteps = () => {
    setIsAutomatedRunning(true);
    let step = 0;
    const interval = setInterval(() => {
      if (step < DEMO_25_STEPS.length - 1) {
        step++;
        setCurrentStepIndex(step);
      } else {
        clearInterval(interval);
        setIsAutomatedRunning(false);
      }
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="ios-glass-card rounded-2xl p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Connecting the Silos: Flagship Tax Engine Demonstration
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Section 39 &amp; 58 Architecture
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Demonstrating how one economic event propagates through Trade, Position, Tax Lot, Basis, §743(b), §755, Allocation, K-1, and Audit.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center ios-segmented-control text-xs p-1">
            <button
              onClick={() => setActiveSubTab('PARTNER_DEATH')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                activeSubTab === 'PARTNER_DEATH'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Partner Death (§1014 Step-Up)
            </button>
            <button
              onClick={() => setActiveSubTab('DEMO_SCRIPT')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                activeSubTab === 'DEMO_SCRIPT'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              25-Step Guided Script
            </button>
            <button
              onClick={() => setActiveSubTab('SILO_TRACE')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                activeSubTab === 'SILO_TRACE'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Silo Propagation Graph
            </button>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: PARTNER DEATH / IRC § 1014 STEP-UP (SECTION 18 OF PROMPT) */}
      {activeSubTab === 'PARTNER_DEATH' && (
        <div className="space-y-6">
          <div className="ios-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  Critical Demonstration Scenario (Prompt Section 18)
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  Partner Death &amp; Testamentary Transfer under IRC § 1014, § 754 &amp; § 743(b)
                </h2>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Proves why static tax spreadsheets fail: Partner dies &rarr; Outside basis steps up to FMV &rarr; Inside basis remains unchanged &rarr; §754 triggers transferee-specific §743(b) adjustment &rarr; §755 allocates between ordinary vs capital assets.
                </p>
              </div>

              {/* Dynamic Interactive Parameter Sliders */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSection754Active(!isSection754Active)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    isSection754Active
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}
                >
                  §754 Election: {isSection754Active ? 'ACTIVE' : 'INACTIVE (REVOKED)'}
                </button>
              </div>
            </div>

            {/* Date-of-Death Fair Market Value Slider */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Date-of-Death Fair Market Value (Outside Basis under § 1014):</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  ${(partnerDeathFmv / 1000000).toFixed(2)} Million
                </span>
              </div>
              <input
                type="range"
                min="5000000"
                max="20000000"
                step="500000"
                value={partnerDeathFmv}
                onChange={(e) => setPartnerDeathFmv(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>$5.0M Min</span>
                <span>$10.0M Baseline Case</span>
                <span>$20.0M Max</span>
              </div>
            </div>

            {/* The 10-Step Deterministic Flow Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-black/60 p-3.5 rounded-xl border border-white/10 space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-400">Step 1 &amp; 2: Pre-Death State</span>
                <h3 className="text-xs font-bold text-white">Partner Holds 20% Interest</h3>
                <p className="text-[11px] text-zinc-400">
                  Historical outside basis: <strong className="text-zinc-200">$4,000,000</strong>. Partnership holds appreciated logistics hub and inventory.
                </p>
                <div className="text-[10px] font-mono text-blue-400">Inside Basis Share: $4.0M</div>
              </div>

              <div className="bg-black/60 p-3.5 rounded-xl border border-amber-500/20 space-y-1.5">
                <span className="text-[10px] font-mono text-amber-400">Step 3 &amp; 4: Death &amp; §1014</span>
                <h3 className="text-xs font-bold text-white">Outside Basis Stepped-Up</h3>
                <p className="text-[11px] text-zinc-400">
                  Interest passes to testamentary trust. Basis stepped up to FMV of <strong className="text-emerald-300">${(partnerDeathFmv / 1000000).toFixed(2)}M</strong>.
                </p>
                <div className="text-[10px] font-mono text-emerald-400">§1014(a) Nonrecognition</div>
              </div>

              <div className="bg-black/60 p-3.5 rounded-xl border border-purple-500/20 space-y-1.5">
                <span className="text-[10px] font-mono text-purple-400">Step 5 &amp; 6: Basis Disparity</span>
                <h3 className="text-xs font-bold text-white">§ 743(b) Adjustment</h3>
                <p className="text-[11px] text-zinc-400">
                  Gross adjustment: <strong className="text-purple-300">${(deathCalculation.grossSection743bAdjustment / 1000000).toFixed(2)}M</strong>.
                  {isSection754Active ? ' Active §754 applies adjustment.' : ' Disallowed without §754!'}
                </p>
                <div className="text-[10px] font-mono text-purple-400">Outside - Inside = Disparity</div>
              </div>

              <div className="bg-black/60 p-3.5 rounded-xl border border-emerald-500/20 space-y-1.5">
                <span className="text-[10px] font-mono text-emerald-400">Step 7 &amp; 8: §755 Allocation</span>
                <h3 className="text-xs font-bold text-white">Class Allocation &amp; Shield</h3>
                <p className="text-[11px] text-zinc-400">
                  Capital: <strong className="text-white">${(deathCalculation.section755Allocation.capitalAssetPortion / 1000000).toFixed(2)}M</strong> | Ordinary: <strong className="text-white">${(deathCalculation.section755Allocation.ordinaryAssetPortion / 1000000).toFixed(2)}M</strong>.
                </p>
                <div className="text-[10px] font-mono text-emerald-400">Extra Deprec: ${deathCalculation.annualPartnerSpecificDepreciation.toLocaleString()}/yr</div>
              </div>
            </div>

            {/* KaTeX Mathematical Formulas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-blue-950/20 p-3 rounded-xl border border-blue-500/20 space-y-1">
                <span className="text-[10px] font-mono uppercase text-blue-300 font-bold block">Gross § 743(b) Basis Step-Up</span>
                <div className="py-1">
                  <MathView formula={`\\Delta_{743(b)} = \\text{Basis}_{1014} - b_{\\text{inside}} = \\$${(deathCalculation.grossSection743bAdjustment / 1000000).toFixed(2)}\\text{M}`} />
                </div>
                <span className="text-[10px] text-zinc-400 block font-mono">Personal to transferee successor trust</span>
              </div>

              <div className="bg-purple-950/20 p-3 rounded-xl border border-purple-500/20 space-y-1">
                <span className="text-[10px] font-mono uppercase text-purple-300 font-bold block">§ 755 Class Allocation</span>
                <div className="py-1">
                  <MathView formula={`\\Delta_{755} = \\$${(deathCalculation.section755Allocation.capitalAssetPortion / 1000000).toFixed(2)}\\text{M}_{\\text{Cap}} + \\$${(deathCalculation.section755Allocation.ordinaryAssetPortion / 1000000).toFixed(2)}\\text{M}_{\\text{Ord}}`} />
                </div>
                <span className="text-[10px] text-zinc-400 block font-mono">Treas. Reg. § 1.755-1(b) Allocation</span>
              </div>

              <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-mono uppercase text-emerald-300 font-bold block">Annual Partner-Specific Depreciation</span>
                <div className="py-1">
                  <MathView formula={`D_{743} = \\frac{\\Delta_{\\text{Cap}}}{15\\text{ yrs}} = \\$${deathCalculation.annualPartnerSpecificDepreciation.toLocaleString()}\\text{/yr}`} />
                </div>
                <span className="text-[10px] text-zinc-400 block font-mono">Tax Shield: ${deathCalculation.taxShieldOnAssetSale.toLocaleString()}/yr @ 37% bracket</span>
              </div>
            </div>

            {/* Audit Chain Trace for Partner Death */}
            <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Provenance &amp; Calculation Audit Trail:
              </span>
              <div className="space-y-1">
                {deathCalculation.auditChainDescription.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300 font-mono">
                    <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">
                      {idx + 1}
                    </span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: 25-STEP GUIDED DEMONSTRATION SCRIPT */}
      {activeSubTab === 'DEMO_SCRIPT' && (
        <div className="space-y-6">
          <div className="ios-glass-card rounded-2xl p-6 border border-white/10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                  Guided Script Milestone {currentStep.stepNumber} of 25
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  {currentStep.title}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Category: <strong className="text-zinc-200">{currentStep.category}</strong> | Statute: <strong className="text-blue-300">{currentStep.governingStatute}</strong> ({currentStep.treasuryRegulation})
                </p>
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                  disabled={currentStepIndex === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                >
                  &larr; Previous Step
                </button>
                <button
                  onClick={() => setCurrentStepIndex(Math.min(DEMO_25_STEPS.length - 1, currentStepIndex + 1))}
                  disabled={currentStepIndex === DEMO_25_STEPS.length - 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                >
                  Next Step &rarr;
                </button>
                <button
                  onClick={runAllSteps}
                  disabled={isAutomatedRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors cursor-pointer shadow-sm"
                >
                  <Play className={`w-3.5 h-3.5 ${isAutomatedRunning ? 'animate-spin' : ''}`} />
                  <span>{isAutomatedRunning ? 'Playing...' : 'Auto-Run All 25'}</span>
                </button>
              </div>
            </div>

            {/* Step Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStepIndex + 1) / DEMO_25_STEPS.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>Step 1: Fund Formation</span>
                <span>Step 8: Partner Death</span>
                <span>Step 16: §163(j)</span>
                <span>Step 25: Reconciled</span>
              </div>
            </div>

            {/* Current Step Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Milestone Description &amp; Facts</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {currentStep.description}
                </p>

                <div className="p-3 bg-purple-950/20 rounded-lg border border-purple-500/20 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-purple-300 font-bold block">Deterministic Calculation:</span>
                  <p className="text-xs text-white font-medium">{currentStep.calculationSummary}</p>
                  <div className="pt-2">
                    <MathView formula={currentStep.formulaKatex} />
                  </div>
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Provenance Chain &amp; Audit Trail</h4>
                <div className="space-y-2">
                  {currentStep.auditTrailChain.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5 text-xs text-zinc-300">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-2.5 bg-black/60 rounded-lg border border-white/5 text-xs">
                  <span className="text-zinc-400">Reconciliation Control Status:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    currentStep.reconciliationStatus === 'CONTINUE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {currentStep.reconciliationStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick 25-step grid picker */}
            <div className="pt-2">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">Jump to Step:</span>
              <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-25 gap-1.5">
                {DEMO_25_STEPS.map((s, idx) => (
                  <button
                    key={s.stepNumber}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`py-1 rounded text-center text-xs font-mono font-semibold transition-all cursor-pointer ${
                      currentStepIndex === idx
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {s.stepNumber}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-VIEW 3: SILO PROPAGATION GRAPH (SECTION 39 OF PROMPT) */}
      {activeSubTab === 'SILO_TRACE' && (
        <div className="space-y-6">
          <div className="ios-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                Silo Elimination Architecture (Prompt Section 38 &amp; 39)
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                Unified Event Propagation Pipeline
              </h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                The same economic event flows seamlessly across every institutional representation without redundant reconciliation workpapers.
              </p>
            </div>

            {/* Visual 12-Stage Silo Pipeline */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
              {[
                { stage: '1. TRADE', desc: 'Purchase $10M Partnership Interest', status: 'VERIFIED' },
                { stage: '2. POSITION', desc: '20% Ownership Recorded in Custody', status: 'VERIFIED' },
                { stage: '3. BOOK ACCT', desc: 'GAAP Capital Account: $10.0M', status: 'VERIFIED' },
                { stage: '4. TAX LOT', desc: 'Tax Lot #LOT-08 created at $10.0M FMV', status: 'VERIFIED' },
                { stage: '5. PARTNERSHIP BASIS', desc: 'Inside Basis remains $4.0M', status: 'VERIFIED' },
                { stage: '6. §743(b) ADJUSTMENT', desc: '+$6.0M Step-Up calculated', status: 'VERIFIED' },
                { stage: '7. §755 ALLOCATION', desc: '$4.8M Capital / $1.2M Ordinary', status: 'VERIFIED' },
                { stage: '8. DEPRECIATION', desc: '+$320k/yr Extra Tax Depreciation', status: 'VERIFIED' },
                { stage: '9. INVESTOR ALLOCATION', desc: 'Distributive share adjusted on K-1', status: 'VERIFIED' },
                { stage: '10. K-1 REPORTING', desc: 'Box 20 Code V Statement attached', status: 'VERIFIED' },
                { stage: '11. WITHHOLDING', desc: '1446(f) 10% gross certification', status: 'VERIFIED' },
                { stage: '12. AUDIT TRAIL', desc: 'Full DAG Lineage preserved', status: 'VERIFIED' }
              ].map((silo, idx) => (
                <div key={idx} className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1 relative group hover:border-purple-500/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-purple-400 font-bold">{silo.stage}</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-zinc-300 font-medium">{silo.desc}</p>
                </div>
              ))}
            </div>

            {/* Fund Structure Map */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Synthetic Multi-Tier Investment Network ({SYNTHETIC_ENTITIES.length} Entities Plotted)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {SYNTHETIC_ENTITIES.map(ent => (
                  <div key={ent.id} className="p-3 bg-white/5 rounded-lg border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{ent.name}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">{ent.legalType} ({ent.jurisdiction})</div>
                    <div className="flex justify-between font-mono text-[10px] pt-1 border-t border-white/5">
                      <span className="text-zinc-500">Classification:</span>
                      <span className="text-zinc-300">{ent.taxClassification}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-zinc-500">Book Capital:</span>
                      <span className="text-emerald-400 font-bold">${(ent.currentBookCapital / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
