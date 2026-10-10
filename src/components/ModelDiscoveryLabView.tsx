/**
 * POC 1 — Model Discovery Lab & Mathematical Approximation Studio
 * 
 * Features (Sections 18–29 & 47–56):
 * 1. Model Discovery Workflow:
 *    Select Dataset → Select Variables → Fit Models → Residuals → Cross-Fund Test → Out-of-Sample Validation
 * 2. Candidate Model Families: Linear, Polynomial, Exponential Decay, Logistic, Power-Law
 * 3. Formal distinction: Observational Model != Tax Law Rule
 * 4. Interactive Correlation Engine (Pearson, Spearman, p-value, sample size)
 * 5. Divergence Detection Engine (Series A vs Series B, start, duration, magnitude, contributing events)
 * 6. Dimensional & Unit-Checking Formula Editor (enforces dimensional consistency: USD + % rejected)
 * 7. Cross-Fund & Cross-Asset comparison matrices
 * 8. Automated Hypothesis Management (H-001, H-002) with candidate explanations
 */

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Calculator, 
  TrendingUp, 
  Layers, 
  GitFork, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Sliders, 
  Play, 
  RotateCcw,
  BarChart2,
  Table,
  Cpu,
  Search,
  ArrowRight,
  Database
} from 'lucide-react';
import { MathView } from './MathView';
import { INITIAL_FUND_REGISTRY } from '../data/fund-registry-data';
import { 
  CANONICAL_CORRELATION_PAIRS, 
  CANONICAL_DIVERGENCES, 
  INITIAL_RESEARCH_HYPOTHESES,
  generateCrossFundMatrix
} from '../engine/correlation-divergence-engine';
import { fitCandidateModels, checkDimensionalConsistency } from '../engine/mathematical-approximation-engine';
import { ModelFittingResult, ResearchHypothesis, DivergenceObservation } from '../types/research-lab';

interface ModelDiscoveryLabViewProps {
  activeFundId?: string;
  onSelectFund?: (fundId: string) => void;
}

export const ModelDiscoveryLabView: React.FC<ModelDiscoveryLabViewProps> = ({
  activeFundId,
  onSelectFund
}) => {
  const [activeTab, setActiveTab] = useState<'DISCOVERY' | 'CORRELATIONS' | 'DIVERGENCES' | 'HYPOTHESES' | 'CROSS_FUND' | 'FORMULA_EDITOR'>('DISCOVERY');

  // Discovery Controls
  const [selectedXMetric, setSelectedXMetric] = useState<string>('turnover_rate');
  const [selectedYMetric, setSelectedYMetric] = useState<string>('tax_leakage_rate');
  const [selectedCandidateModel, setSelectedCandidateModel] = useState<string>('LINEAR');
  const [outOfSampleRatio, setOutOfSampleRatio] = useState<number>(30); // 30% test holdout

  // Unit-Checking Formula Editor State
  const [formulaName, setFormulaName] = useState<string>('Tax Leakage Turnover Linear Approximation');
  const [leftUnit, setLeftUnit] = useState<string>('USD');
  const [operator, setOperator] = useState<'+' | '-' | '*' | '/' | '^'>('*');
  const [rightUnit, setRightUnit] = useState<string>('PERCENT');
  const [customEquationLatex, setCustomEquationLatex] = useState<string>('y(x) = 0.045 + 0.065 \\cdot x');

  // Compute 2D points from fund registry based on selected metrics
  const scatterPoints = useMemo(() => {
    return INITIAL_FUND_REGISTRY.map((f, i) => {
      const xVal = (f.tax_metrics as any)[selectedXMetric] ?? (f.aum_usd / 1000000000);
      const yVal = (f.tax_metrics as any)[selectedYMetric] ?? f.tax_metrics.tax_leakage_rate;
      return {
        id: f.id,
        x: parseFloat(Number(xVal).toFixed(2)),
        y: parseFloat(Number(yVal).toFixed(2)),
        label: f.name,
        code: f.code,
        isSelected: f.id === activeFundId
      };
    });
  }, [selectedXMetric, selectedYMetric, activeFundId]);

  // Fit all models to current scatter
  const fittedModels = useMemo(() => {
    return fitCandidateModels(scatterPoints, selectedXMetric, selectedYMetric);
  }, [scatterPoints, selectedXMetric, selectedYMetric]);

  const bestFit = fittedModels.find(m => m.is_best_fit) || fittedModels[0];

  // Dimensional Unit Check
  const unitValidation = useMemo(() => {
    return checkDimensionalConsistency(leftUnit, operator, rightUnit);
  }, [leftUnit, operator, rightUnit]);

  // Cross-Fund Matrix
  const crossFundMatrix = useMemo(() => {
    return generateCrossFundMatrix(INITIAL_FUND_REGISTRY);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold uppercase">
              Section 52 Research Engine
            </span>
            <span className="text-xs text-zinc-400 font-mono">Mathematical Model Discovery &amp; Validation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-emerald-400" />
            <span>Model Discovery Lab &amp; Cross-Sectional Falsification</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Autonomous discovery of empirical mathematical models across multi-fund observations. 
            Strictly distinguishes <strong>Empirical Observational Models</strong> from <strong>Statutory Tax Rules</strong>.
          </p>
        </div>

        {/* Sub-nav Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 p-1 rounded-2xl text-xs">
          <button
            onClick={() => setActiveTab('DISCOVERY')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'DISCOVERY' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Model Fitter
          </button>
          <button
            onClick={() => setActiveTab('CORRELATIONS')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'CORRELATIONS' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Correlations (3)
          </button>
          <button
            onClick={() => setActiveTab('DIVERGENCES')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'DIVERGENCES' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Divergences (2)
          </button>
          <button
            onClick={() => setActiveTab('HYPOTHESES')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'HYPOTHESES' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Hypotheses
          </button>
          <button
            onClick={() => setActiveTab('CROSS_FUND')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'CROSS_FUND' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Fund Matrix
          </button>
          <button
            onClick={() => setActiveTab('FORMULA_EDITOR')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'FORMULA_EDITOR' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Unit Editor
          </button>
        </div>
      </div>

      {/* TAB 1: MODEL FITTER & DISCOVERY */}
      {activeTab === 'DISCOVERY' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="p-4 rounded-3xl bg-zinc-950 border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-mono">X Variable:</span>
                <select
                  value={selectedXMetric}
                  onChange={(e) => setSelectedXMetric(e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1 text-white focus:outline-none cursor-pointer"
                >
                  <option value="turnover_rate">Turnover Rate (%)</option>
                  <option value="basis_gap_ratio">Basis Gap Ratio</option>
                  <option value="volatility_annualized">Volatility (%)</option>
                  <option value="state_sufficiency_score">State Sufficiency S(t)</option>
                  <option value="operational_exceptions_count">Operational Exceptions</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-mono">Y Target:</span>
                <select
                  value={selectedYMetric}
                  onChange={(e) => setSelectedYMetric(e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1 text-white focus:outline-none cursor-pointer"
                >
                  <option value="tax_leakage_rate">Tax Leakage Rate (%)</option>
                  <option value="annual_return">Annual Return (%)</option>
                  <option value="operational_exceptions_count">Operational Exceptions</option>
                  <option value="state_sufficiency_score">State Sufficiency S(t)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-mono">Test Holdout:</span>
                <span className="font-mono text-emerald-300 font-bold">{outOfSampleRatio}%</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
              Observational approximation — not a statutory tax formula
            </div>
          </div>

          {/* Model Fitting Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Scatter Plot & Fitted Curve */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-[#090d16] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Cross-Sectional Regression: {selectedXMetric} vs {selectedYMetric}</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">10 Institutional Funds · N = {scatterPoints.length}</p>
                </div>

                {bestFit && (
                  <div className="text-xs font-mono px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Highest Goodness of Fit: {bestFit.family} (R² = {bestFit.r_squared})
                  </div>
                )}
              </div>

              {/* Scatter Plot SVG */}
              <div className="w-full h-72 relative pt-2">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 260">
                  {/* Grid Lines */}
                  <line x1="0" y1="65" x2="1000" y2="65" stroke="#ffffff10" strokeDasharray="2 2" />
                  <line x1="0" y1="130" x2="1000" y2="130" stroke="#ffffff10" strokeDasharray="2 2" />
                  <line x1="0" y1="195" x2="1000" y2="195" stroke="#ffffff10" strokeDasharray="2 2" />

                  {/* Scatter Points */}
                  {scatterPoints.map((pt, i) => {
                    // Normalize X and Y to viewBox
                    const maxX = Math.max(...scatterPoints.map(p => p.x)) || 100;
                    const minX = Math.min(...scatterPoints.map(p => p.x)) || 0;
                    const maxY = Math.max(...scatterPoints.map(p => p.y)) || 50;
                    const minY = Math.min(...scatterPoints.map(p => p.y)) || 0;

                    const x = ((pt.x - minX) / (maxX - minX || 1)) * 900 + 50;
                    const y = 240 - ((pt.y - minY) / (maxY - minY || 1)) * 200;

                    return (
                      <g 
                        key={i} 
                        className="group cursor-pointer"
                        onClick={() => onSelectFund && onSelectFund(pt.id)}
                      >
                        <circle 
                          cx={x} 
                          cy={y} 
                          r={pt.isSelected ? "9" : "6"} 
                          fill={pt.isSelected ? "#38bdf8" : "#10b981"} 
                          stroke={pt.isSelected ? "#ffffff" : "none"}
                          strokeWidth={pt.isSelected ? "2" : "0"}
                          className="transition-transform group-hover:scale-150" 
                        />
                        <text 
                          x={x + 8} 
                          y={y - 8} 
                          fill={pt.isSelected ? "#38bdf8" : "#a1a1aa"} 
                          fontWeight={pt.isSelected ? "bold" : "normal"}
                          fontSize="11" 
                          fontFamily="monospace"
                        >
                          {pt.code}{pt.isSelected ? ' ★' : ''}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Point Listing */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono pt-3 border-t border-white/10">
                {scatterPoints.map((pt, i) => (
                  <div key={i} className="p-2 rounded-xl bg-zinc-900 border border-white/5">
                    <div className="font-bold text-white">{pt.code}</div>
                    <div className="text-zinc-400">X: {pt.x} · Y: {pt.y}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Candidate Model Comparison Matrix */}
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-zinc-950 border border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Candidate Models Fitted</span>
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-400">{fittedModels.length} Evaluated</span>
                </div>

                <div className="space-y-2">
                  {fittedModels.map((fit) => (
                    <div
                      key={fit.model_id}
                      className={`p-3 rounded-2xl border transition-all ${
                        fit.is_best_fit 
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-white' 
                          : 'bg-zinc-900/60 border-white/5 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{fit.family}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          fit.is_best_fit ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'bg-white/10 text-zinc-400'
                        }`}>
                          R² = {fit.r_squared}
                        </span>
                      </div>

                      <div className="my-1.5 bg-black/40 p-2 rounded-xl border border-white/5 overflow-x-auto text-[11px]">
                        <MathView math={fit.formula_latex} />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>RMSE: {fit.rmse}</span>
                        <span>MAE: {fit.mae}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: CORRELATIONS ENGINE */}
      {activeTab === 'CORRELATIONS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CANONICAL_CORRELATION_PAIRS.map((corr) => (
              <div key={corr.id} className="p-5 rounded-3xl bg-zinc-950 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                    Pearson r = {corr.pearson_r}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">p = {corr.p_value}</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{corr.variable_x_label}</h4>
                  <div className="text-xs text-zinc-400">vs {corr.variable_y_label}</div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 text-xs text-zinc-300 leading-relaxed">
                  {corr.distinction_notes}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/10">
                  <span>Sample: N = {corr.sample_size}</span>
                  <span>Spearman ρ = {corr.spearman_rho}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DIVERGENCES ENGINE */}
      {activeTab === 'DIVERGENCES' && (
        <div className="space-y-4">
          {CANONICAL_DIVERGENCES.map((div) => (
            <div key={div.id} className="p-6 rounded-3xl bg-zinc-950 border border-amber-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                    Detected Structural Divergence #{div.id}
                  </div>
                  <h4 className="text-base font-bold text-white">{div.title}</h4>
                </div>

                <div className="text-xs font-mono px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Duration: {div.duration_days} Days · Peak Δ: ${(div.max_divergence_magnitude / 1000000).toFixed(1)}M
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-1.5">
                  <div className="font-bold text-white text-[11px] uppercase font-mono text-cyan-400">
                    Contributing Events
                  </div>
                  <ul className="space-y-1 text-zinc-300 text-[11px]">
                    {div.contributing_events.map((e, i) => (
                      <li key={i}>● {e}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-1.5">
                  <div className="font-bold text-white text-[11px] uppercase font-mono text-emerald-400">
                    Statutory Rules Involved
                  </div>
                  <ul className="space-y-1 text-emerald-200 text-[11px] font-mono">
                    {div.tax_rules_involved.map((r, i) => (
                      <li key={i}>● {r}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-1.5">
                  <div className="font-bold text-white text-[11px] uppercase font-mono text-amber-400">
                    Candidate Explanations
                  </div>
                  <ul className="space-y-1 text-amber-200 text-[11px]">
                    {div.potential_explanations.map((p, i) => (
                      <li key={i}>● {p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: HYPOTHESES REPOSITORY */}
      {activeTab === 'HYPOTHESES' && (
        <div className="space-y-4">
          {INITIAL_RESEARCH_HYPOTHESES.map((hyp) => (
            <div key={hyp.id} className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 font-bold">
                      Hypothesis {hyp.code}
                    </span>
                    <span className="text-xs font-mono text-emerald-400">Status: {hyp.status}</span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">{hyp.title}</h4>
                </div>

                <div className="text-xs font-mono px-3 py-1 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300">
                  Cross-Fund R² = {hyp.r_squared_across_funds} · RMSE = {hyp.out_of_sample_rmse}
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong>Observed Phenomenon:</strong> {hyp.observed_phenomenon}
              </p>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
                  Candidate Explanations (Falsification Testing):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {hyp.candidate_explanations.map((cand) => (
                    <div key={cand.id} className="p-3 rounded-2xl bg-zinc-900 border border-white/5 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-zinc-400">Weight: {(cand.probability_weight * 100).toFixed(0)}%</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                          cand.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300' : cand.status === 'FALSIFIED' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {cand.status}
                        </span>
                      </div>
                      <p className="text-zinc-200 text-[11px]">{cand.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: CROSS-FUND MATRIX */}
      {activeTab === 'CROSS_FUND' && (
        <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 overflow-x-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-400" />
            <span>Cross-Fund Multi-Dimensional Comparison Matrix (Section 54)</span>
          </h3>

          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 text-[11px]">
                <th className="py-2.5 px-3">Metric Dimension</th>
                {crossFundMatrix.funds.map(f => (
                  <th key={f.id} className="py-2.5 px-3 text-right">{f.code}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 text-[11px]">
              {crossFundMatrix.dimensions.map((dim, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white">{dim.label}</td>
                  {dim.values.map((v: number, j: number) => (
                    <td key={j} className="py-2.5 px-3 text-right">
                      {typeof v === 'number' && v > 1000 ? (v / 1000000).toFixed(1) + 'M' : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: DIMENSIONAL & UNIT-CHECKING FORMULA EDITOR */}
      {activeTab === 'FORMULA_EDITOR' && (
        <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Dimensional &amp; Unit-Checking Formula Editor (Sections 50 &amp; 51)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Enforces formal dimensional consistency across computational tax equations. 
              Automatically catches and rejects illegal dimensional additions (e.g. USD + percentage).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-zinc-400 font-mono">Left Dimension (Unit):</label>
              <select
                value={leftUnit}
                onChange={(e) => setLeftUnit(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
              >
                <option value="USD">USD (Monetary Basis)</option>
                <option value="PERCENT">PERCENT (Allocation Ratio)</option>
                <option value="USD/SHARE">USD/SHARE (Stock Price)</option>
                <option value="SHARES">SHARES (Unit Quantity)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 font-mono">Mathematical Operator:</label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as any)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
              >
                <option value="*">* Multiplication</option>
                <option value="+">+ Addition (Requires identical units)</option>
                <option value="-">- Subtraction (Requires identical units)</option>
                <option value="/">/ Division</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 font-mono">Right Dimension (Unit):</label>
              <select
                value={rightUnit}
                onChange={(e) => setRightUnit(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
              >
                <option value="PERCENT">PERCENT (Allocation Ratio)</option>
                <option value="USD">USD (Monetary Basis)</option>
                <option value="SHARES">SHARES (Unit Quantity)</option>
                <option value="USD/SHARE">USD/SHARE (Stock Price)</option>
              </select>
            </div>
          </div>

          {/* Validation Result Box */}
          <div className={`p-4 rounded-2xl border text-xs font-mono space-y-1 ${
            unitValidation.is_valid 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
              : 'bg-red-500/10 border-red-500/30 text-red-200'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {unitValidation.is_valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
              <span>{unitValidation.is_valid ? 'Dimensionally Consistent Equation' : 'Dimensional Violation Detected'}</span>
            </div>
            {unitValidation.is_valid ? (
              <p>Evaluated Result Unit: <strong>{unitValidation.resulting_unit}</strong></p>
            ) : (
              <p>{unitValidation.error_message}</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
