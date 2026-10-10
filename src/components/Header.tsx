/**
 * Top Navigation Bar with iOS / iPadOS Glassmorphism
 * Translucent frosted glass aesthetic with iOS blue/emerald/indigo accents.
 * Provides instant global fund switching and seamless navigation across all modules of the
 * Multi-Fund Computational Investment Tax Research Laboratory:
 * - Research Lab Dashboard
 * - Multi-Asset Wave Engine (18 Asset Classes)
 * - State Sufficiency S(t) Error Graph
 * - Model Discovery Lab
 * - Fund Registry & Universes
 * - Tax Authority Corpus & Publications
 * - Research Notebook & Observation Store
 * - Formal Monograph & Live Lab
 * - Formula Auditor & Subgraphs
 * - State Machine Workbench
 * - Recursive Lineage DAG Tracer
 * - Real-World Map & Multi-Exchange Hub
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, 
  Layers, 
  GitFork, 
  Search, 
  FileText, 
  Zap, 
  Download,
  Bot,
  Activity,
  Calculator,
  MapPin,
  Cpu,
  ShieldCheck,
  ChevronDown,
  Sliders,
  Sparkles,
  Database,
  BarChart3,
  GitCommit,
  FlaskConical,
  Scale,
  TrendingUp,
  Building2,
  BookOpen,
  DollarSign,
  Users
} from 'lucide-react';
import { INITIAL_FUND_REGISTRY } from '../data/fund-registry-data';
import { fundRegistryStore } from '../engine/fund-registry-store';
import { FundModel } from '../types/research-lab';

export type ActiveTab = 
  | 'research-observatory'
  | 'research-dashboard'
  | 'multi-asset-wave'
  | 'state-sufficiency'
  | 'model-discovery'
  | 'fund-registry'
  | 'investor-relations'
  | 'org-charts'
  | 'debt-tracking'
  | 'market-movement'
  | 'tax-authority'
  | 'research-notebook'
  | 'research-paper'
  | 'real-world-map'
  | 'formula-auditor'
  | 'workbench' 
  | 'recursive-audit' 
  | 'global-graph'
  | 'scale-stress' 
  | 'counterfactual' 
  | 'overview'
  | 'tax-engine'
  | 'tax-lots'
  | 'reconciliations'
  | 'audit-lineage'
  | 'evidence-ledger'
  | 'silos-demo'
  | 'tinyfish-research'
  | 'authority-registry'
  | 'system-health'
  | 'ai-chat';

export type ModuleCategory = 'RESEARCH_LAB' | 'MATH_AUDIT' | 'SIMULATION_SYSTEMS';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onRunTestSuite: () => void;
  onExportPaper: () => void;
  onOpenSecSearch?: () => void;
  activeFundId?: string;
  onSelectFund?: (fundId: string) => void;
}

export interface NavItem {
  id: ActiveTab;
  label: string;
  category: ModuleCategory;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

export const ALL_NAV_MODULES: NavItem[] = [
  // Category 1: Research Lab & Multi-Asset Engines
  { 
    id: 'research-observatory', 
    label: 'Research Observatory', 
    category: 'RESEARCH_LAB', 
    description: 'Central system & error observatory: endpoint telemetry, invariant conservation, S(t) error, and drillable state records',
    icon: <Activity className="w-3.5 h-3.5 text-cyan-400" />,
    badge: 'OBSERVATORY'
  },
  { 
    id: 'research-dashboard', 
    label: 'Research Dashboard', 
    category: 'RESEARCH_LAB', 
    description: 'Master multi-fund dashboard: Universe ($139B+), Tax, Market, Operations, and Research metrics',
    icon: <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />,
    badge: 'LAB'
  },
  { 
    id: 'multi-asset-wave', 
    label: 'Multi-Asset Wave', 
    category: 'RESEARCH_LAB', 
    description: '18 asset classes: Asset → Event → Price → Position → Value → Tax Basis → Tax Character',
    icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />,
    badge: '18 ASSETS'
  },
  { 
    id: 'state-sufficiency', 
    label: 'State Sufficiency S(t)', 
    category: 'RESEARCH_LAB', 
    description: 'Interactive point-in-time state reconstruction, missing fact identification & dependency DAG tracer',
    icon: <Activity className="w-3.5 h-3.5 text-purple-400" />,
    badge: 'S(t)'
  },
  { 
    id: 'model-discovery', 
    label: 'Model Discovery Lab', 
    category: 'RESEARCH_LAB', 
    description: 'Fit candidate equations (linear, exponential, logistic), residual checks, unit validation & hypotheses',
    icon: <Calculator className="w-3.5 h-3.5 text-emerald-300" />,
    badge: 'FITTER'
  },
  { 
    id: 'fund-registry', 
    label: 'Fund Registry', 
    category: 'RESEARCH_LAB', 
    description: 'Dynamic fund registry, multi-dimensional search, batch JSON/CSV ingestion, and determinability audit',
    icon: <Building2 className="w-3.5 h-3.5 text-blue-400" />,
    badge: 'UNIVERSE'
  },
  { 
    id: 'investor-relations', 
    label: 'Investor Relations', 
    category: 'RESEARCH_LAB', 
    description: 'Institutional LP capital accounts: §704(b) Book vs §705 Tax Basis, §704(c) disparity, and WHT vectors',
    icon: <Users className="w-3.5 h-3.5 text-pink-400" />,
    badge: 'LPs'
  },
  { 
    id: 'org-charts', 
    label: 'Organisation Charts', 
    category: 'SIMULATION_SYSTEMS', 
    description: 'Interactive G_t hierarchy: Manager → Fund → Legal Entity → Vehicle → Investor/Asset with dependency tracing',
    icon: <GitFork className="w-3.5 h-3.5 text-indigo-400" />,
    badge: 'G_t'
  },
  { 
    id: 'debt-tracking', 
    label: 'Debt Tracking', 
    category: 'MATH_AUDIT', 
    description: 'Syndicated credit facilities, SOFR spreads, §752 partner basis allocations, and §163(j) limitations',
    icon: <DollarSign className="w-3.5 h-3.5 text-red-400" />,
    badge: '§752'
  },
  { 
    id: 'market-movement', 
    label: 'Market Movement', 
    category: 'RESEARCH_LAB', 
    description: 'Multi-exchange quotes (Alpaca/EulerPool/NSE), epistemic separation (Observed vs Modelled), and §1256 MTM',
    icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />,
    badge: 'X_t'
  },
  { 
    id: 'tax-authority', 
    label: 'Tax Authority Corpus', 
    category: 'RESEARCH_LAB', 
    description: 'Systematic IRS/Treasury hierarchy, publication explorer, coverage map & TinyFish ingestion agent',
    icon: <BookOpen className="w-3.5 h-3.5 text-purple-300" />,
    badge: 'IRS'
  },
  { 
    id: 'research-notebook', 
    label: 'Research Notebook', 
    category: 'RESEARCH_LAB', 
    description: 'Reproducible observation store, formula objects, snapshots, and Markdown export to Drive',
    icon: <FileText className="w-3.5 h-3.5 text-emerald-400" />,
    badge: 'DRIVE'
  },
  { 
    id: 'research-paper', 
    label: 'Research Monograph', 
    category: 'RESEARCH_LAB', 
    description: '29 formal sections with LaTeX proofs and live Alpaca/EulerPool/NSE empirical experiment runner',
    icon: <FlaskConical className="w-3.5 h-3.5 text-zinc-300" />
  },
  { 
    id: 'real-world-map', 
    label: 'Real World Map', 
    category: 'RESEARCH_LAB', 
    description: 'Real Google Maps platform with ownership concentration and trading volume heatmaps & exchange quotes',
    icon: <MapPin className="w-3.5 h-3.5 text-blue-300" />
  },

  // Category 2: Mathematical Proofs & Auditing
  { 
    id: 'formula-auditor', 
    label: 'Formula Auditor', 
    category: 'MATH_AUDIT', 
    description: 'Step-by-step LaTeX formula evaluation, sensitivity derivatives, and D3 invariant verification',
    icon: <Calculator className="w-3.5 h-3.5 text-emerald-400" />,
    badge: 'KATEX'
  },
  { 
    id: 'workbench', 
    label: 'State Workbench', 
    category: 'MATH_AUDIT', 
    description: 'Interactive state transition simulator S_{t+1} = δ(S_t, e_t, ρ_t), journal entries & tax balance sheet',
    icon: <Sliders className="w-3.5 h-3.5 text-amber-400" />
  },
  { 
    id: 'recursive-audit', 
    label: 'Recursive Lineage', 
    category: 'MATH_AUDIT', 
    description: 'Trace Schedule K-1 output back through 704(c) allocations to 2018 in-kind acquisition contracts',
    icon: <GitCommit className="w-3.5 h-3.5 text-pink-400" />
  },
  { 
    id: 'tax-engine', 
    label: 'Deterministic Tax Engine', 
    category: 'MATH_AUDIT', 
    description: 'Evaluates Section 704(b), 704(c), 743(b), and 754 statutory state transitions deterministically',
    icon: <Scale className="w-3.5 h-3.5 text-emerald-300" />
  },
  { 
    id: 'tax-lots', 
    label: 'Tax Lots & Bridge', 
    category: 'MATH_AUDIT', 
    description: 'Book-to-tax basis reconciliation, tax lot tracking, and 704(c) layer depreciation',
    icon: <Layers className="w-3.5 h-3.5 text-cyan-400" />
  },
  { 
    id: 'reconciliations', 
    label: 'Reconciliations & Parity', 
    category: 'MATH_AUDIT', 
    description: 'Automated invariant tests for balance sheet equality, capital account parity, and basis conservation',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
  },
  { 
    id: 'audit-lineage', 
    label: 'Audit Lineage Trail', 
    category: 'MATH_AUDIT', 
    description: 'Chronological timeline of regulatory events, filing timestamps, and state transitions',
    icon: <Activity className="w-3.5 h-3.5 text-purple-400" />
  },
  { 
    id: 'system-health', 
    label: 'System Health & Self-Audit', 
    category: 'MATH_AUDIT', 
    description: '20-step TinyFish browser audit, metamorphic invariants, graph point lineage, and formula equivalence',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />,
    badge: 'TINYFISH'
  },
  { 
    id: 'evidence-ledger', 
    label: 'Evidence Ledger', 
    category: 'MATH_AUDIT', 
    description: 'Immutable evidentiary store of SEC EDGAR CIK filings, accession numbers, and court transcripts',
    icon: <Database className="w-3.5 h-3.5 text-blue-300" />
  },

  // Category 3: Simulation & Systems
  { 
    id: 'scale-stress', 
    label: 'Scale & Stress Lab', 
    category: 'SIMULATION_SYSTEMS', 
    description: 'Empirical stress testing: 100 to 100,000 entities, ingestion throughput, and memory bounds (L0-L6)',
    icon: <Activity className="w-3.5 h-3.5 text-red-400" />
  },
  { 
    id: 'counterfactual', 
    label: 'Counterfactual Studio', 
    category: 'SIMULATION_SYSTEMS', 
    description: 'What-if branch simulator: test Section 754 elections and alternative 704(c) methods side-by-side',
    icon: <GitFork className="w-3.5 h-3.5 text-indigo-400" />
  },
  { 
    id: 'global-graph', 
    label: 'Global Temporal Graph', 
    category: 'SIMULATION_SYSTEMS', 
    description: 'D3 force-directed multi-entity investment graph G_t(V, E, Θ, τ, ω)',
    icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />
  },
  { 
    id: 'silos-demo', 
    label: 'Silos Flagship Demo', 
    category: 'SIMULATION_SYSTEMS', 
    description: 'Cross-silo corporate structuring demo connecting Delaware LLCs, Cayman SPCs, and Indian FPIs',
    icon: <Cpu className="w-3.5 h-3.5 text-purple-400" />
  },
  { 
    id: 'tinyfish-research', 
    label: 'TinyFish Research Mode', 
    category: 'SIMULATION_SYSTEMS', 
    description: 'Automated entity resolution and discovery crawling across public registries',
    icon: <Search className="w-3.5 h-3.5 text-emerald-300" />
  },
  { 
    id: 'authority-registry', 
    label: 'Authority & Rule Registry', 
    category: 'SIMULATION_SYSTEMS', 
    description: 'Structured database of statutory authorities: IRC sections, Treas. Regs, and Revenue Rulings',
    icon: <FileText className="w-3.5 h-3.5 text-purple-300" />
  },
  { 
    id: 'ai-chat', 
    label: 'AI Auditable Reasoning', 
    category: 'SIMULATION_SYSTEMS', 
    description: 'Auditable LLM tax classifier restricted strictly to cited statutory rules and formal state graphs',
    icon: <Bot className="w-3.5 h-3.5 text-emerald-400" />
  }
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRunTestSuite,
  onExportPaper,
  onOpenSecSearch,
  activeFundId = INITIAL_FUND_REGISTRY[0].id,
  onSelectFund
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [allFunds, setAllFunds] = useState<FundModel[]>(() => fundRegistryStore.getAllFunds());

  useEffect(() => {
    const unsub = fundRegistryStore.subscribe(setAllFunds);
    return unsub;
  }, []);

  const activeFund = allFunds.find(f => f.id === activeFundId) || allFunds[0] || INITIAL_FUND_REGISTRY[0];

  // Top flagship shortcuts displayed directly on the primary nav bar
  const primaryShortcuts: ActiveTab[] = [
    'system-health',
    'fund-registry',
    'investor-relations',
    'org-charts',
    'debt-tracking',
    'market-movement',
    'research-dashboard',
    'multi-asset-wave',
    'state-sufficiency',
    'model-discovery'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="ios-glass sticky top-0 z-50 px-4 sm:px-6 py-2.5 transition-all border-b border-white/10 bg-black/85 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Zone 1: Apple-Style Brand Mark & Global Active Fund Context */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('research-dashboard')}
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-sm hover:border-emerald-400 transition-all cursor-pointer"
            title="Open Computational Investment Tax Research Laboratory"
          >
            <FlaskConical className="w-4 h-4" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <a 
                href="#top" 
                onClick={(e) => { e.preventDefault(); setActiveTab('research-dashboard'); }}
                className="text-sm font-bold tracking-tight text-white hover:text-emerald-300 transition-colors whitespace-nowrap block"
              >
                Computational Tax Lab
              </a>
              <span className="hidden xl:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                MULTI-FUND
              </span>
            </div>

            {/* Global Fund Switcher Selector */}
            {onSelectFund ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">Active Fund:</span>
                <select
                  value={activeFundId}
                  onChange={(e) => onSelectFund(e.target.value)}
                  className="bg-transparent text-emerald-300 text-[11px] font-mono font-semibold focus:outline-none cursor-pointer border-b border-emerald-500/30 hover:border-emerald-400 max-w-[170px] sm:max-w-[220px] truncate"
                >
                  {allFunds.map(f => (
                    <option key={f.id} value={f.id} className="bg-zinc-950 text-white">
                      {f.code} · {f.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="hidden sm:block text-[10px] text-zinc-400 font-mono truncate max-w-[220px]">
                {activeFund.name}
              </span>
            )}
          </div>
        </div>

        {/* Zone 2: Primary Flagship Shortcuts */}
        <nav className="hidden xl:flex items-center gap-1 text-xs bg-white/5 p-1 rounded-full border border-white/10">
          {primaryShortcuts.map(tabId => {
            const item = ALL_NAV_MODULES.find(m => m.id === tabId);
            if (!item) return null;
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-sm font-semibold'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
                title={item.description}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[8px] font-mono px-1 rounded ${
                    isActive ? 'bg-black/30 text-emerald-100' : 'bg-white/10 text-emerald-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* All Modules Dropdown Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium text-xs transition-all cursor-pointer ${
                isDropdownOpen || !primaryShortcuts.includes(activeTab)
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>All Modules (24)</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-950/95 border border-white/15 backdrop-blur-2xl shadow-2xl p-3 z-50 text-xs max-h-[80vh] overflow-y-auto custom-scrollbar">
                
                {/* Category 1 */}
                <div className="mb-3">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 px-2 py-1 flex items-center gap-1.5">
                    <FlaskConical className="w-3 h-3" />
                    <span>Research Lab, Waves &amp; Authority</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {ALL_NAV_MODULES.filter(m => m.category === 'RESEARCH_LAB').map(item => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setIsDropdownOpen(false); }}
                        className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                          activeTab === item.id ? 'bg-emerald-500/20 border border-emerald-500/40 text-white' : 'hover:bg-white/5 text-zinc-300'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">{item.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white flex items-center justify-between">
                            <span>{item.label}</span>
                            {item.badge && <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-300">{item.badge}</span>}
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-1">{item.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category 2 */}
                <div className="mb-3 pt-2 border-t border-white/10">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 px-2 py-1 flex items-center gap-1.5">
                    <Calculator className="w-3 h-3" />
                    <span>Mathematical Proofs &amp; State Audits</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {ALL_NAV_MODULES.filter(m => m.category === 'MATH_AUDIT').map(item => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setIsDropdownOpen(false); }}
                        className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                          activeTab === item.id ? 'bg-cyan-500/20 border border-cyan-500/40 text-white' : 'hover:bg-white/5 text-zinc-300'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">{item.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white flex items-center justify-between">
                            <span>{item.label}</span>
                            {item.badge && <span className="text-[9px] font-mono px-1 rounded bg-cyan-500/20 text-cyan-300">{item.badge}</span>}
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-1">{item.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category 3 */}
                <div className="pt-2 border-t border-white/10">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 px-2 py-1 flex items-center gap-1.5">
                    <Activity className="w-3 h-3" />
                    <span>Stress Labs, Simulations &amp; Graphs</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {ALL_NAV_MODULES.filter(m => m.category === 'SIMULATION_SYSTEMS').map(item => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setIsDropdownOpen(false); }}
                        className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                          activeTab === item.id ? 'bg-purple-500/20 border border-purple-500/40 text-white' : 'hover:bg-white/5 text-zinc-300'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">{item.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white flex items-center justify-between">
                            <span>{item.label}</span>
                            {item.badge && <span className="text-[9px] font-mono px-1 rounded bg-purple-500/20 text-purple-300">{item.badge}</span>}
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-1">{item.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </nav>

        {/* Mobile / Tablet Segmented Selector with all modules */}
        <div className="xl:hidden flex items-center">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as ActiveTab)}
            className="ios-segmented-control text-xs text-white px-3 py-1.5 rounded-full cursor-pointer focus:outline-none bg-zinc-900 border border-white/20 max-w-[180px] sm:max-w-[240px]"
          >
            <optgroup label="Research Lab & Multi-Asset" className="bg-zinc-950 font-bold text-emerald-400">
              {ALL_NAV_MODULES.filter(m => m.category === 'RESEARCH_LAB').map(tab => (
                <option key={tab.id} value={tab.id} className="bg-zinc-900 text-white">
                  {tab.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Mathematical Proofs & Audits" className="bg-zinc-950 font-bold text-cyan-400">
              {ALL_NAV_MODULES.filter(m => m.category === 'MATH_AUDIT').map(tab => (
                <option key={tab.id} value={tab.id} className="bg-zinc-900 text-white">
                  {tab.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Simulation & Systems" className="bg-zinc-950 font-bold text-purple-400">
              {ALL_NAV_MODULES.filter(m => m.category === 'SIMULATION_SYSTEMS').map(tab => (
                <option key={tab.id} value={tab.id} className="bg-zinc-900 text-white">
                  {tab.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Zone 3: Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenSecSearch && (
            <button
              onClick={onOpenSecSearch}
              className="px-3 py-1.5 rounded-xl text-xs font-medium ios-glass-subtle text-slate-200 hover:text-white hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Search SEC EDGAR & Global Registries"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">EDGAR</span>
            </button>
          )}

          <button
            onClick={onRunTestSuite}
            className="px-3 py-1.5 rounded-xl text-xs font-medium ios-glass-subtle text-slate-200 hover:text-white hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Execute Invariant Verification Suite"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Verify Invariants</span>
          </button>

          <button
            onClick={onExportPaper}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export Deliverable to Drive / Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

      </div>
    </header>
  );
};
