/**
 * Top-Level Multi-Fund Computational Investment Tax Research Dashboard
 * 
 * In direct accordance with Sections 5, 64, 65 & 66:
 * - Replaces single-fund views with the master Computational Research Laboratory
 * - 5 Strategic KPI Panes:
 *   1. UNIVERSE: Funds (10), AUM ($139.5B), Asset Classes (18), Jurisdictions (5), Entities (42), Investors (340+)
 *   2. TAX: Taxable Income, Tax Leakage, Withholding, Realised & Unrealised Gains, ECI, UBTI, §704(c), §743(b), §163(j)
 *   3. MARKET: Blended Return (+14.2%), Volatility (8.8%), Gross Exposure ($142B), Turnover (165%)
 *   4. OPERATIONS: Reconciliation Breaks (4), Missing Private Facts (8), Low-Confidence Facts (12), Manual Interventions
 *   5. RESEARCH: Discovered Correlations (3), Detected Divergences (2), Fitted Functional Forms (6), Unresolved Residuals (1)
 * - Global Active Fund Switcher with automatic synchronization
 * - Direct drill-down to Multi-Asset Wave, State Sufficiency Graph, Model Discovery Lab, and Rule Graph
 */

import React from 'react';
import { 
  Building2, 
  TrendingUp, 
  Scale, 
  Activity, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Globe, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  ArrowRight,
  Calculator,
  Search,
  ExternalLink,
  Sliders,
  PieChart,
  HardDrive
} from 'lucide-react';
import { FundModel } from '../types/research-lab';
import { INITIAL_FUND_REGISTRY } from '../data/fund-registry-data';

interface ResearchLabDashboardViewProps {
  activeFundId: string;
  onSelectFund: (fundId: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const ResearchLabDashboardView: React.FC<ResearchLabDashboardViewProps> = ({
  activeFundId,
  onSelectFund,
  onNavigateToTab
}) => {
  const activeFund = INITIAL_FUND_REGISTRY.find(f => f.id === activeFundId) || INITIAL_FUND_REGISTRY[0];

  // Global aggregate metrics across all 10 funds in registry
  const totalAumUsd = INITIAL_FUND_REGISTRY.reduce((sum, f) => sum + f.aum_usd, 0);
  const totalTaxableIncome = INITIAL_FUND_REGISTRY.reduce((sum, f) => sum + f.tax_metrics.taxable_income_ytd, 0);
  const totalWithholding = INITIAL_FUND_REGISTRY.reduce((sum, f) => sum + f.tax_metrics.withholding_paid, 0);
  const totalRealizedLt = INITIAL_FUND_REGISTRY.reduce((sum, f) => sum + f.tax_metrics.realised_gains_lt, 0);
  const totalUnrealized = INITIAL_FUND_REGISTRY.reduce((sum, f) => sum + f.tax_metrics.unrealised_gains, 0);
  const totalExceptions = INITIAL_FUND_REGISTRY.reduce((sum, f) => sum + f.tax_metrics.operational_exceptions_count, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner: Master Research Charter */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-blue-950/40 border border-white/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold uppercase">
                Active Research Laboratory
              </span>
              <span className="text-xs text-zinc-400 font-mono">10 Institutional Funds · 18 Asset Classes · Global Temporal State</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Computational Investment Tax Research Laboratory
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
              Synthesizing Market Data, Investment Events, Multi-Tier Fund Structures, Tax Law, Accounting State, 
              Deterministic State Engines, and Mathematical Model Discovery into an auditable research environment.
            </p>
          </div>

          {/* Active Fund Switcher Widget */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/15 space-y-2 shrink-0 sm:min-w-[280px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">Active Fund Context:</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">{activeFund.type}</span>
            </div>
            <select
              value={activeFundId}
              onChange={(e) => onSelectFund(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              {INITIAL_FUND_REGISTRY.map(f => (
                <option key={f.id} value={f.id}>
                  {f.code} — {f.name}
                </option>
              ))}
            </select>
            <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between pt-1">
              <span>AUM: ${(activeFund.aum_usd / 1000000000).toFixed(1)}B</span>
              <span>Leakage: {activeFund.tax_metrics.tax_leakage_rate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Strategic KPI Panes (Section 5) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        
        {/* Pane 1: UNIVERSE */}
        <div className="p-4 rounded-3xl bg-zinc-950/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>1. Universe</span>
            </span>
            <span className="text-[9px] font-mono text-zinc-500">10 Funds</span>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">
              ${(totalAumUsd / 1000000000).toFixed(1)}B
            </div>
            <div className="text-[11px] text-zinc-400">Total Enrolled AUM</div>
          </div>
          <div className="space-y-1 text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/5">
            <div className="flex justify-between"><span>Asset Classes:</span><span className="text-white font-bold">18 Classes</span></div>
            <div className="flex justify-between"><span>Jurisdictions:</span><span className="text-white font-bold">5 Cross-Border</span></div>
            <div className="flex justify-between"><span>Entities:</span><span className="text-white font-bold">42 Nodes</span></div>
          </div>
        </div>

        {/* Pane 2: TAX METRICS */}
        <div className="p-4 rounded-3xl bg-zinc-950/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>2. Tax State</span>
            </span>
            <span className="text-[9px] font-mono text-emerald-300">Deterministic</span>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              ${(totalTaxableIncome / 1000000000).toFixed(2)}B
            </div>
            <div className="text-[11px] text-zinc-400">Taxable Distributive Income</div>
          </div>
          <div className="space-y-1 text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/5">
            <div className="flex justify-between"><span>Realized LTCG:</span><span className="text-white font-bold">${(totalRealizedLt / 1000000).toFixed(0)}M</span></div>
            <div className="flex justify-between"><span>Unrealized Gain:</span><span className="text-white font-bold">${(totalUnrealized / 1000000000).toFixed(1)}B</span></div>
            <div className="flex justify-between"><span>Withholding:</span><span className="text-white font-bold">${(totalWithholding / 1000000).toFixed(0)}M</span></div>
          </div>
        </div>

        {/* Pane 3: MARKET DYNAMICS */}
        <div className="p-4 rounded-3xl bg-zinc-950/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>3. Market Data</span>
            </span>
            <span className="text-[9px] font-mono text-zinc-500">Live / Historic</span>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-cyan-300">
              +14.2%
            </div>
            <div className="text-[11px] text-zinc-400">Blended Annual Return</div>
          </div>
          <div className="space-y-1 text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/5">
            <div className="flex justify-between"><span>Annualized Vol:</span><span className="text-white font-bold">8.8%</span></div>
            <div className="flex justify-between"><span>Portfolio Turnover:</span><span className="text-white font-bold">165%</span></div>
            <div className="flex justify-between"><span>Max Drawdown:</span><span className="text-white font-bold">-4.2%</span></div>
          </div>
        </div>

        {/* Pane 4: OPERATIONS & EXCEPTIONS */}
        <div className="p-4 rounded-3xl bg-zinc-950/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>4. Operations</span>
            </span>
            <span className="text-[9px] font-mono text-amber-300">Reconciliations</span>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-amber-300">
              {totalExceptions} Breaks
            </div>
            <div className="text-[11px] text-zinc-400">Total Tracking Exceptions</div>
          </div>
          <div className="space-y-1 text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/5">
            <div className="flex justify-between"><span>Missing Private Facts:</span><span className="text-amber-300 font-bold">8 Facts</span></div>
            <div className="flex justify-between"><span>Reconciliation Breaks:</span><span className="text-amber-300 font-bold">4 Breaks</span></div>
            <div className="flex justify-between"><span>Manual Overrides:</span><span className="text-white font-bold">3 Cases</span></div>
          </div>
        </div>

        {/* Pane 5: RESEARCH & DISCOVERY */}
        <div className="p-4 rounded-3xl bg-zinc-950/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>5. Research</span>
            </span>
            <span className="text-[9px] font-mono text-purple-300">Discovery Lab</span>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-purple-300">
              6 Models
            </div>
            <div className="text-[11px] text-zinc-400">Fitted Functional Forms</div>
          </div>
          <div className="space-y-1 text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/5">
            <div className="flex justify-between"><span>Correlations Found:</span><span className="text-white font-bold">3 Verified</span></div>
            <div className="flex justify-between"><span>Divergences:</span><span className="text-white font-bold">2 Tracked</span></div>
            <div className="flex justify-between"><span>Hypotheses:</span><span className="text-white font-bold">2 Active</span></div>
          </div>
        </div>

      </div>

      {/* Core Analytical Launch Strips */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Launch 1: Rebuilt Multi-Asset Wave */}
        <div 
          onClick={() => onNavigateToTab('multi-asset-wave')}
          className="p-5 rounded-3xl bg-zinc-950 border border-white/10 hover:border-cyan-500/50 hover:bg-zinc-900/80 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              Multi-Asset Wave Engine
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Temporal join of market movements, position updates, book-to-tax basis disparity, and Section 1256 character waves.
            </p>
          </div>
          <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
            Launch Wave Engine →
          </div>
        </div>

        {/* Launch 2: State Sufficiency Error Graph */}
        <div 
          onClick={() => onNavigateToTab('state-sufficiency')}
          className="p-5 rounded-3xl bg-zinc-950 border border-white/10 hover:border-purple-500/50 hover:bg-zinc-900/80 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              State Sufficiency Graph S(t)
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Interactive point-in-time state reconstruction, missing variable identification, and dependency DAG tracing.
            </p>
          </div>
          <div className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
            Inspect Sufficiency Graph →
          </div>
        </div>

        {/* Launch 3: Model Discovery Lab */}
        <div 
          onClick={() => onNavigateToTab('model-discovery')}
          className="p-5 rounded-3xl bg-zinc-950 border border-white/10 hover:border-emerald-500/50 hover:bg-zinc-900/80 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 group-hover:scale-110 transition-transform">
              <Calculator className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Model Discovery Lab
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Fit candidate equations (linear, exponential, logistic), residual checks, cross-fund validation, and unit-checking.
            </p>
          </div>
          <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
            Open Discovery Studio →
          </div>
        </div>

        {/* Launch 4: Master Fund Registry */}
        <div 
          onClick={() => onNavigateToTab('fund-registry')}
          className="p-5 rounded-3xl bg-zinc-950 border border-white/10 hover:border-blue-500/50 hover:bg-zinc-900/80 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-300 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
              Fund Registry &amp; Universes
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Create, clone, compare funds, manage multi-asset portfolios, and generate synthetic funds with ground truth.
            </p>
          </div>
          <div className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider">
            Explore Fund Registry →
          </div>
        </div>

      </div>

      {/* Active Fund Snapshot Card */}
      <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Active Fund Portfolio Context</div>
            <h3 className="text-base font-bold text-white mt-0.5">{activeFund.name} ({activeFund.code})</h3>
          </div>
          <button
            onClick={() => onNavigateToTab('workbench')}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
          >
            <span>Open in State Machine Workbench</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5">
            <div className="text-zinc-500 text-[10px]">AUM (USD)</div>
            <div className="text-base font-bold text-white mt-1">${(activeFund.aum_usd / 1000000000).toFixed(2)}B</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5">
            <div className="text-zinc-500 text-[10px]">Effective Tax Leakage</div>
            <div className="text-base font-bold text-emerald-400 mt-1">{activeFund.tax_metrics.tax_leakage_rate}%</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5">
            <div className="text-zinc-500 text-[10px]">Turnover Rate</div>
            <div className="text-base font-bold text-cyan-300 mt-1">{activeFund.tax_metrics.turnover_rate}%</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5">
            <div className="text-zinc-500 text-[10px]">State Sufficiency S(t)</div>
            <div className="text-base font-bold text-purple-300 mt-1">{activeFund.tax_metrics.state_sufficiency_score}</div>
          </div>
        </div>
      </div>

    </div>
  );
};
