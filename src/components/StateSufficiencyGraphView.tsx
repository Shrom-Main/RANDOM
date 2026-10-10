/**
 * Interactive Point-in-Time State Sufficiency & Error Graph Studio
 * 
 * Formal Definition (Sections 15, 16 & 17):
 * S(t) = 1 - (validated_required_state_variables(t) / total_required_state_variables(t))
 * 
 * Interactive Capabilities:
 * 1. Longitudinal timeline graph of S(t) from 2021 to 2026.
 * 2. Click any point to deterministically execute RECONSTRUCT_STATE(timestamp).
 * 3. Shows for the selected point:
 *    - Date, Sufficiency Error, Missing Variables, Affected Calculations, Affected Funds/Assets, Affected Tax Rules, Source Documents
 * 4. Draws interactive dependency graph through the point:
 *    State Sufficiency -> Missing Basis / Election -> §743(b) / §704(c) Allocation
 * 5. Integrated Mathematical Approximation Engine:
 *    Fits Linear, Polynomial, Exponential Decay, and Logistic models to the observed curve,
 *    displaying LaTeX equations, parameters, R^2, RMSE, and residual distributions.
 */

import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Calculator, 
  Sparkles, 
  FileText, 
  Layers, 
  Sliders, 
  ChevronRight, 
  RotateCcw,
  GitCommit,
  TrendingDown,
  Info
} from 'lucide-react';
import { MathView } from './MathView';
import { INITIAL_FUND_REGISTRY } from '../data/fund-registry-data';
import { 
  generateStateSufficiencyTimeline, 
  reconstructStateAtTimestamp 
} from '../engine/state-sufficiency-engine';
import { fitCandidateModels } from '../engine/mathematical-approximation-engine';
import { ModelFittingResult } from '../types/research-lab';

interface StateSufficiencyGraphViewProps {
  activeFundId?: string;
  onSelectFund?: (fundId: string) => void;
}

export const StateSufficiencyGraphView: React.FC<StateSufficiencyGraphViewProps> = ({
  activeFundId,
  onSelectFund
}) => {
  const [selectedFundId, setSelectedFundId] = useState<string>(activeFundId || INITIAL_FUND_REGISTRY[0].id);
  const [selectedStep, setSelectedStep] = useState<number>(23); // Default latest
  const [showModelFitter, setShowModelFitter] = useState<boolean>(true);
  const [selectedCandidateModelId, setSelectedCandidateModelId] = useState<string>('FIT-EXP-03');

  // Synchronise with activeFundId from global header
  React.useEffect(() => {
    if (activeFundId && selectedFundId !== activeFundId) {
      setSelectedFundId(activeFundId);
    }
  }, [activeFundId]);

  const handleFundChange = (newFundId: string) => {
    setSelectedFundId(newFundId);
    setSelectedStep(23);
    if (onSelectFund) {
      onSelectFund(newFundId);
    }
  };

  const activeFund = INITIAL_FUND_REGISTRY.find(f => f.id === selectedFundId) || INITIAL_FUND_REGISTRY[0];
  
  // Generate 23-quarter timeline points
  const timelinePoints = useMemo(() => {
    return generateStateSufficiencyTimeline(selectedFundId);
  }, [selectedFundId]);

  const activePoint = timelinePoints[selectedStep - 1] || timelinePoints[timelinePoints.length - 1];

  // Reconstructed State at clicked timestamp
  const reconstructedState = useMemo(() => {
    return reconstructStateAtTimestamp(selectedFundId, activePoint.date);
  }, [selectedFundId, activePoint.date]);

  // Fit mathematical models to timeline
  const fittedModels = useMemo(() => {
    const data2D = timelinePoints.map((pt, i) => ({ x: i + 1, y: pt.sufficiency_error }));
    return fitCandidateModels(data2D, 'Quarterly Step', 'Sufficiency Error S(t)');
  }, [timelinePoints]);

  const activeFit = fittedModels.find(m => m.model_id === selectedCandidateModelId) || fittedModels[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header & Definition */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold uppercase">
              Formal Analytical Engine
            </span>
            <span className="text-xs text-zinc-400 font-mono">Sections 15, 16 &amp; 17 Specification</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-purple-400" />
            <span>State Sufficiency &amp; Incompleteness Error Graph</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Formal metric tracking computational closure across longitudinal regulatory disclosures:
            <span className="font-mono text-emerald-300 ml-1">S(t) = 1 - (validated_required_variables / total_required_variables)</span>.
          </p>
        </div>

        {/* Fund Selector */}
        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={selectedFundId}
              onChange={(e) => handleFundChange(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
            >
              {INITIAL_FUND_REGISTRY.map(f => (
                <option key={f.id} value={f.id} className="bg-zinc-900">
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dataset Metadata Card (POC 1 Section 4 Requirement) */}
      <div className="p-4 rounded-2xl bg-[#090d16] border border-white/10 text-xs font-mono space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">
              Dataset ID: DS-SUFF-{activeFund.code}
            </span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-300">Fund: {activeFund.name} ({activeFund.code})</span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-400">Time Range: 2021-03-31 → 2026-09-27</span>
          </div>
          <div className="text-zinc-400 flex items-center gap-2">
            <span>Points: {timelinePoints.length}</span>
            <span>·</span>
            <span className="text-purple-300">Metric: S(t) = 1 - (validated / total)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-zinc-400 pt-1">
          <div><span className="text-zinc-500">Units:</span> Error Fraction [0.0 - 1.0]</div>
          <div><span className="text-zinc-500">Transformation:</span> Point-in-Time Regulatory Fact Audit</div>
          <div><span className="text-zinc-500">Aggregation:</span> Quarterly Canonical Snapshot</div>
          <div><span className="text-zinc-500">Provenance:</span> SEC EDGAR CIK {activeFund.cik || 'Form ADV Part 1A'}</div>
        </div>
      </div>

      {/* Main Interactive Graph & Model Fitting Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive S(t) Graph */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-3xl bg-[#090d16] border border-white/10 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-purple-400" />
                  <span>State Sufficiency Error Trajectory S(t)</span>
                </h3>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Click any point along the curve to inspect deterministic state at timestamp
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-3 h-0.5 bg-purple-400"></span>
                  <span>Observed S(t)</span>
                </span>
                {activeFit && (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-3 h-0.5 bg-emerald-400 stroke-dasharray"></span>
                    <span>Fitted: {activeFit.family} (R² = {activeFit.r_squared})</span>
                  </span>
                )}
              </div>
            </div>

            {/* SVG Interactive Timeline Curve */}
            <div className="w-full h-64 relative pt-4">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 240">
                <defs>
                  <linearGradient id="suffGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="60" x2="1000" y2="60" stroke="#ffffff10" strokeDasharray="2 2" />
                <line x1="0" y1="120" x2="1000" y2="120" stroke="#ffffff10" strokeDasharray="2 2" />
                <line x1="0" y1="180" x2="1000" y2="180" stroke="#ffffff10" strokeDasharray="2 2" />

                {/* Shaded Area Under Observed S(t) */}
                <polygon
                  fill="url(#suffGrad)"
                  points={`0,240 ${timelinePoints.map((pt, i) => `${(i / 22) * 1000},${240 - pt.sufficiency_error * 220}`).join(' ')} 1000,240`}
                />

                {/* Observed S(t) Polyline */}
                <polyline
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="3"
                  points={timelinePoints.map((pt, i) => `${(i / 22) * 1000},${240 - pt.sufficiency_error * 220}`).join(' ')}
                />

                {/* Fitted Candidate Model Overlay */}
                {activeFit && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    points={activeFit.residuals.map((r, i) => `${(i / (activeFit.residuals.length - 1)) * 1000},${Math.max(10, Math.min(235, 240 - r.y_predicted * 220))}`).join(' ')}
                  />
                )}

                {/* Interactive Clickable Points */}
                {timelinePoints.map((pt, i) => {
                  const x = (i / 22) * 1000;
                  const y = 240 - pt.sufficiency_error * 220;
                  const isSelected = selectedStep === pt.step;

                  return (
                    <g 
                      key={pt.step} 
                      className="cursor-pointer group"
                      onClick={() => setSelectedStep(pt.step)}
                    >
                      {isSelected && (
                        <>
                          <line x1={x} y1="0" x2={x} y2="240" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2 2" />
                          <circle cx={x} cy={y} r="10" fill="#06b6d4" opacity="0.3" className="animate-ping" />
                        </>
                      )}
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={isSelected ? '6' : '4'} 
                        fill={isSelected ? '#06b6d4' : '#a855f7'} 
                        className="transition-transform group-hover:scale-150"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* X Axis Time Labels */}
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-3 px-1">
                <span>Q1 2021 (Genesis)</span>
                <span>Q4 2022</span>
                <span>Q2 2024</span>
                <span>Q3 2026 (Live Step)</span>
              </div>
            </div>

            {/* Clicked Point Summary Bar */}
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span className="font-semibold text-white">Selected Timestamp:</span>
                <span className="font-mono text-cyan-300">{activePoint.date} (Step {activePoint.step}/23)</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span>Validated Facts: <strong className="text-emerald-400">{activePoint.validated_count}</strong></span>
                <span>Missing: <strong className="text-amber-400">{activePoint.missing_count}</strong></span>
                <span>Sufficiency Error S(t): <strong className="text-purple-300">{(activePoint.sufficiency_error * 100).toFixed(1)}%</strong></span>
              </div>
            </div>

          </div>

          {/* Section 17: Interactive Dependency Graph Through Point */}
          <div className="p-5 rounded-3xl bg-zinc-950/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 font-mono">
                <GitCommit className="w-4 h-4 text-cyan-400" />
                <span>Section 17: Dependency DAG Through Point ({activePoint.date})</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">Deterministic Lineage Propagation</span>
            </div>

            {/* Dependency Tree Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              
              {/* Level 1: State Sufficiency Root */}
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-1.5">
                <div className="text-[10px] font-mono font-bold text-purple-400 uppercase">
                  1. Sufficiency Metric S(t)
                </div>
                <div className="font-mono text-sm font-bold text-white">
                  S({activePoint.date}) = {(activePoint.sufficiency_error * 100).toFixed(1)}%
                </div>
                <p className="text-[11px] text-zinc-300 leading-tight">
                  {activePoint.missing_count === 0 ? 'Full deterministic closure achieved.' : 'Statutory frontier requires human election determination.'}
                </p>
              </div>

              {/* Level 2: Missing State Variables */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                  2. Missing Variables
                </div>
                {activePoint.missing_variables.length > 0 ? (
                  <ul className="space-y-1 text-[11px] text-amber-200 font-mono">
                    {activePoint.missing_variables.map((v, i) => (
                      <li key={i} className="line-clamp-1">● {v}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[11px] text-emerald-400 font-mono">✓ Zero missing variables</div>
                )}
              </div>

              {/* Level 3: Affected Calculations */}
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-1.5">
                <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                  3. Affected Calculations
                </div>
                {activePoint.affected_calculations.length > 0 ? (
                  <ul className="space-y-1 text-[11px] text-cyan-200 font-mono">
                    {activePoint.affected_calculations.map((c, i) => (
                      <li key={i} className="line-clamp-1">● {c}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[11px] text-emerald-400 font-mono">✓ All calculations executable</div>
                )}
              </div>

              {/* Level 4: Source Documents */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                  4. Source Anchors
                </div>
                <ul className="space-y-1 text-[11px] text-emerald-200 font-mono">
                  {activePoint.source_documents.slice(0, 2).map((s, i) => (
                    <li key={i} className="line-clamp-1">● {s}</li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

        </div>

        {/* Right Col: Mathematical Approximation Engine (Sections 18, 19 & 20) */}
        <div className="space-y-4">
          
          <div className="p-5 rounded-3xl bg-zinc-950 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
                <Calculator className="w-4 h-4" />
                <span>Model Approximation Engine</span>
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                L-S Regression
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Fits candidate model families to observed curve S(t). Computes parameters, R², RMSE, and residual distributions without declaring causality.
            </p>

            {/* Candidate Models Selector */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">
                Candidate Functional Forms:
              </div>

              {fittedModels.map((fit) => {
                const isSelected = selectedCandidateModelId === fit.model_id;
                return (
                  <div
                    key={fit.model_id}
                    onClick={() => setSelectedCandidateModelId(fit.model_id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white' 
                        : 'bg-zinc-900/60 border-white/5 text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{fit.family}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        fit.is_best_fit ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-zinc-400'
                      }`}>
                        {fit.is_best_fit ? '★ Best Fit' : `R² = ${fit.r_squared}`}
                      </span>
                    </div>

                    <div className="my-1.5 bg-black/40 p-2 rounded-xl border border-white/5 overflow-x-auto text-[11px]">
                      <MathView math={fit.formula_latex} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span>RMSE: {fit.rmse}</span>
                      <span>MAE: {fit.mae}</span>
                      <span>N = {fit.sample_size}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Parameter Inspector for Active Fit */}
            {activeFit && (
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2 text-xs font-mono">
                <div className="text-[10px] uppercase text-zinc-400 font-bold">
                  Estimated Parameters ({activeFit.family}):
                </div>
                {Object.entries(activeFit.parameters).map(([param, val]) => (
                  <div key={param} className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">{activeFit.parameter_labels[param] || param}:</span>
                    <span className="text-emerald-300 font-bold">{val}</span>
                  </div>
                ))}
                
                <div className="pt-2 border-t border-white/10 text-[10px] text-amber-300/80 leading-relaxed font-sans">
                  <strong>Extrapolation Guard:</strong> {activeFit.extrapolation_warning}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Corresponding Reconciled Observation Dataset Table (POC 1 Section 4) */}
      <div className="p-5 rounded-3xl bg-zinc-950/80 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>State Sufficiency Observation Dataset ({timelinePoints.length} Quarterly Records)</span>
          </h4>
          <span className="text-[10px] font-mono text-zinc-500">
            Consumes exact same timeline dataset as S(t) graph
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 text-[11px] font-mono">
                <th className="py-2.5 px-3">Step</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Sufficiency Error S(t)</th>
                <th className="py-2.5 px-3 text-right">Completeness Score</th>
                <th className="py-2.5 px-3 text-right">Validated Facts</th>
                <th className="py-2.5 px-3 text-right">Missing Facts</th>
                <th className="py-2.5 px-3">Critical Missing Variables</th>
                <th className="py-2.5 px-3">Affected Rules</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 font-mono text-[11px]">
              {timelinePoints.map((pt) => {
                const isSelected = selectedStep === pt.step;
                return (
                  <tr 
                    key={pt.step} 
                    className={`transition-colors ${isSelected ? 'bg-purple-500/15 text-white font-bold' : 'hover:bg-white/5'}`}
                  >
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${isSelected ? 'bg-purple-500 text-white font-bold' : 'bg-white/10 text-zinc-300'}`}>
                        t = {pt.step}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{pt.date}</td>
                    <td className="py-2.5 px-3 text-right text-purple-300 font-bold">
                      {(pt.sufficiency_error * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">
                      {(pt.sufficiency_score * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-200">
                      {pt.validated_count}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-300 font-semibold">
                      {pt.missing_count}
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-zinc-400 max-w-[200px] truncate">
                      {pt.missing_variables.length > 0 ? pt.missing_variables.join(', ') : 'None (Fully Closed)'}
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-zinc-400">
                      {pt.affected_tax_rules.join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedStep(pt.step)}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] cursor-pointer transition-colors"
                      >
                        Inspect S(t)
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
