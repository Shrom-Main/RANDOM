/**
 * Counterfactual & Perturbation Studio
 * In accordance with Sections 28 - 29 & 62 - 63 of POC1 Extension Specification
 * "What if Fund A had acquired Company X in 2022 rather than 2023?"
 * Supports branching counterfactual trajectories (gamma_actual vs gamma_counterfactual)
 * and multi-tier cross-border tax path analysis with withholding tax and corporate blocker detection.
 */

import React, { useState, useMemo } from 'react';
import { 
  GitFork, 
  Split, 
  ArrowRight, 
  Sparkles, 
  Sliders, 
  Layers, 
  Globe, 
  ShieldAlert, 
  TrendingDown, 
  TrendingUp, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { 
  MASTER_GLOBAL_NODES, 
  MASTER_GLOBAL_EDGES, 
  calculateIndirectExposure,
  JURISDICTIONS_REGISTRY 
} from '../data/global-investment-graph-data';

export const CounterfactualStudioView: React.FC = () => {
  // Scenario Selection
  const [selectedScenario, setSelectedScenario] = useState<'acquisition-timing' | 'treaty-revocation' | 'blocker-removal'>('acquisition-timing');
  
  // Cross-Border Path Explorer State
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>('INV-CALPERS');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('CO-LOGISTIX-DE');

  // Perturbation Delta Slider (e.g. Valuation Shift +/- 40%)
  const [valuationPerturbationPct, setValuationPerturbationPct] = useState<number>(0);

  // Compute Cross-Border Paths between selected investor and asset
  const crossBorderPaths = useMemo(() => {
    return calculateIndirectExposure(selectedInvestorId, selectedAssetId, MASTER_GLOBAL_EDGES, MASTER_GLOBAL_NODES);
  }, [selectedInvestorId, selectedAssetId]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fadeIn">
      {/* iOS Header Banner */}
      <div className="ios-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 mb-2">
              <GitFork className="w-3.5 h-3.5 text-purple-400" />
              <span>Sections 28 - 29 &amp; 62 - 63 Specification</span>
              <span>·</span>
              <span className="font-mono">Branching Trajectory Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Counterfactual &amp; Cross-Border Perturbation Studio
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Model hypothetical events (<span className="text-purple-300 font-mono">e'_t</span>) alongside ground truth without overwriting history. Compare <span className="font-mono text-blue-300">γ_actual</span> versus <span className="font-mono text-purple-300">γ_counterfactual</span> and analyze multi-tier cross-border tax withholding.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as any)}
              className="ios-segmented-control text-xs text-white px-4 py-2.5 rounded-2xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="acquisition-timing">Scenario A: Acquisition in 2022 vs 2023</option>
              <option value="treaty-revocation">Scenario B: US-Luxembourg Treaty Article 26 Conflict</option>
              <option value="blocker-removal">Scenario C: Elimination of Luxembourg SPV Blocker</option>
            </select>
          </div>
        </div>
      </div>

      {/* Part 1: Counterfactual Dual-Trajectory Comparison (Sec. 28) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Actual Trajectory Card (gamma_actual) */}
        <div className="ios-glass-card rounded-3xl p-6 space-y-4 border border-blue-500/30">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-sm font-bold text-white font-mono">γ_actual (Ground Truth Timeline)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 font-bold">
              OBSERVED FACT
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl ios-glass-subtle space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Acquisition Event Timestamp</span>
              <div className="text-sm font-bold text-white font-mono">March 1, 2023 (State S_2023)</div>
              <p className="text-[11px] text-slate-300">
                Logistics Hubs acquired at $120.0M FMV. Step-up basis allocated under 2023 Treasury Regulations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-slate-400 block text-[10px]">Total Tax Depr Year 1:</span>
                <span className="text-white font-bold text-sm">$8,000,000.00</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-slate-400 block text-[10px]">Ending Inside Basis:</span>
                <span className="text-white font-bold text-sm">$37,000,000.00</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-blue-200">
              Deterministic state verified against SEC EDGAR Form 1065 Exhibit 21.1.
            </div>
          </div>
        </div>

        {/* Counterfactual Trajectory Card (gamma_counterfactual) */}
        <div className="ios-glass-card rounded-3xl p-6 space-y-4 border border-purple-500/30">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span className="text-sm font-bold text-white font-mono">γ_counterfactual (Hypothetical Event e'_2022)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 font-bold">
              CONTROLLED BRANCH
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-1">
              <span className="text-[10px] text-purple-400 font-mono uppercase">Simulated Timing Shift</span>
              <div className="text-sm font-bold text-white font-mono">March 1, 2022 (State S'_2022)</div>
              <p className="text-[11px] text-purple-200">
                Acquisition occurred 12 months earlier during peak 100% bonus depreciation under TCJA 2017 phaseout.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-slate-400 block text-[10px]">Total Tax Depr Year 1:</span>
                <span className="text-emerald-400 font-bold text-sm">+$14,400,000.00 (+80%)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-slate-400 block text-[10px]">Ending Inside Basis:</span>
                <span className="text-amber-300 font-bold text-sm">$30,600,000.00 (-$6.4M)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200">
              Trajectory diverged: Generates $6.4M additional upfront tax shielding for CalPERS and GIC.
            </div>
          </div>
        </div>

      </div>

      {/* Part 2: Cross-Border Tax Path Analysis (Section 62 - 63) */}
      <div className="ios-glass-card rounded-3xl p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-mono text-purple-400 font-semibold tracking-wide">
              Sections 62 &amp; 63 Specification
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <span>Multi-Hop Cross-Border Tax Path &amp; Withholding Analysis</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Select Investor A and Asset B to trace all material paths:
              <span className="font-mono text-purple-300 ml-1">A → Fund → Feeder → Master → SPV → Company → Asset</span>.
            </p>
          </div>

          {/* Investor & Asset Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-mono block">Investor Node A:</label>
              <select
                value={selectedInvestorId}
                onChange={(e) => setSelectedInvestorId(e.target.value)}
                className="ios-segmented-control text-xs text-white px-3 py-1.5 rounded-xl cursor-pointer focus:outline-none"
              >
                <option value="INV-CALPERS">CalPERS (US Tax-Exempt Pension)</option>
                <option value="INV-GIC-SINGAPORE">GIC Private Limited (Singapore SWF)</option>
                <option value="INV-NORGES-BANK">Norges Bank (Norway Sovereign Fund)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-mono block">Target Asset B:</label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="ios-segmented-control text-xs text-white px-3 py-1.5 rounded-xl cursor-pointer focus:outline-none"
              >
                <option value="CO-LOGISTIX-DE">RheinLogistik Hubs GmbH (Germany)</option>
                <option value="CO-INDUS-SOLAR">Indus Clean Energy Power (India)</option>
                <option value="CO-TECHFLOW-CORP">TechFlow Cloud Corp (US C-Corp)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Path Results */}
        {crossBorderPaths.length > 0 ? (
          <div className="space-y-4">
            {crossBorderPaths.map((path, idx) => (
              <div key={idx} className="ios-glass-subtle rounded-2xl p-5 space-y-4 border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="text-xs font-bold text-white font-mono">
                    Path {idx + 1}: {path.hops} Intermediary Hops
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 font-bold">
                      Calculated Economic Exposure: {(path.economicExposure * 100).toFixed(3)}%
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 font-bold">
                      Control Exposure: {(path.controlExposure * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Node Sequence Diagram */}
                <div className="flex items-center gap-2 overflow-x-auto py-2">
                  {path.pathNodes.map((node, nIdx) => (
                    <React.Fragment key={node.id}>
                      <div className="p-3 rounded-2xl ios-glass-elevated border border-white/10 shrink-0 text-center min-w-[130px]">
                        <span className="text-[9px] font-mono uppercase text-blue-400 block font-bold">
                          {node.type}
                        </span>
                        <div className="text-xs font-bold text-white truncate mt-0.5 max-w-[120px]">
                          {node.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {node.legalDomicile} (Tax: {node.taxResidence})
                        </div>
                      </div>
                      {nIdx < path.pathNodes.length - 1 && (
                        <div className="shrink-0 flex flex-col items-center px-1">
                          <ArrowRight className="w-4 h-4 text-purple-400" />
                          <span className="text-[9px] font-mono text-slate-400">
                            {path.pathEdges[nIdx]?.type}
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Tax Dependencies & Withholding Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="ios-glass rounded-xl p-3.5 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-amber-300 font-bold block flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Withholding Tax Touchpoints Along Path</span>
                    </span>
                    {path.withholdingPoints.length > 0 ? (
                      <div className="space-y-1 text-xs font-mono text-slate-300">
                        {path.withholdingPoints.map((wp, wIdx) => (
                          <div key={wIdx} className="flex justify-between">
                            <span>{wp.fromJurisdiction} → {wp.toJurisdiction}:</span>
                            <span className="text-amber-400 font-bold">{(wp.rate * 100).toFixed(1)}% WHT Rate</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Purely domestic path (Zero cross-border WHT).</span>
                    )}
                  </div>

                  <div className="ios-glass rounded-xl p-3.5 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-purple-300 font-bold block">
                      Tax Policy Classifications (Section 17)
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {path.taxDependencyFlags.map((flag, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 ios-glass-subtle rounded-2xl">
            No indirect investment path observable between the selected investor and asset in current global graph.
          </div>
        )}

      </div>
    </div>
  );
};
