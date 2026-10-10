/**
 * POC 1 — Master Fund Registry & Multi-Fund Dynamic Research Environment
 * 
 * Satisfies Sections 1, 2, 3, 4, 7 & 8:
 * 1. Persistent Fund Registry backed by fundRegistryStore
 * 2. Complete Search operation:
 *    Search input → query → registry → result → selection → state load → UI update
 *    Multi-dimensional search: name, fund ID, manager, legal entity, CIK, strategy, asset class, jurisdiction
 * 3. Batch Add Funds (JSON / CSV) with validation report:
 *    Imported / Rejected / Duplicate / Missing Required Fields / Needs Review
 * 4. Single Fund Creation with full computational state S_t = (G_t, X_t, A_t, I_t, C_t, P_t, V_t)
 * 5. Deep Inspect Modal:
 *    Entities, investors, debt, tax attributes, provenance, freshness
 * 6. Experimental Determinability Audit:
 *    What part is mechanically determinable by computation vs what part requires human determination?
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Layers, 
  Plus, 
  Copy, 
  Archive, 
  Sliders, 
  CheckCircle2, 
  TrendingUp, 
  Search, 
  Sparkles, 
  Scale, 
  Globe, 
  FileText,
  RotateCcw,
  Cpu,
  BarChart3,
  GitCompare,
  ArrowRight,
  Upload,
  AlertTriangle,
  Info,
  Clock,
  ShieldCheck,
  Coins,
  DollarSign,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { FundModel, FundType, ResearchUniverse, MultiAssetRecord } from '../types/research-lab';
import { fundRegistryStore, BatchImportReport } from '../engine/fund-registry-store';
import { generateSyntheticFunds, testGroundTruthRecovery, GroundTruthRecoveryResult } from '../engine/synthetic-multi-fund-generator';
import { calculateDeterminabilityAudit } from '../engine/entity-hierarchy-engine';
import { MechanicalDeterminabilityAudit } from '../types/entity-hierarchy';

interface FundRegistryViewProps {
  activeFundId: string;
  onSelectFund: (fundId: string) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const FundRegistryView: React.FC<FundRegistryViewProps> = ({
  activeFundId,
  onSelectFund,
  onNavigateToTab
}) => {
  const [funds, setFunds] = useState<FundModel[]>([]);
  const [selectedFundIdsForCompare, setSelectedFundIdsForCompare] = useState<string[]>([
    'fund-bridgewater-pa2',
    'fund-blackstone-brep',
    'fund-citadel-wellington'
  ]);

  const [activeTab, setActiveTab] = useState<'REGISTRY' | 'COMPARE' | 'GENERATOR'>('REGISTRY');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [strategyFilter, setStrategyFilter] = useState<string>('ALL');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [inspectedFund, setInspectedFund] = useState<FundModel | null>(null);
  const [batchReport, setBatchReport] = useState<BatchImportReport | null>(null);

  // Batch Ingestion Text state
  const [batchText, setBatchText] = useState<string>('');
  const [batchFormat, setBatchFormat] = useState<'JSON' | 'CSV'>('JSON');

  // Single Fund Creation Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    type: 'Hedge Fund' as FundType,
    adviser_name: '',
    jurisdiction: 'Delaware LP / Cayman Feeder',
    formation_date: new Date().toISOString().split('T')[0],
    aum_usd: 500000000,
    strategy_description: '',
    cik: '',
    section_754_elected: true,
    section_704c_method: 'TRADITIONAL' as 'TRADITIONAL' | 'CURATIVE' | 'REMEDIAL',
    section_163j_limitation_active: false
  });

  // Generator State
  const [genCount, setGenCount] = useState<number>(5);
  const [injectSlope, setInjectSlope] = useState<number>(0.065);
  const [recoveryResult, setRecoveryResult] = useState<GroundTruthRecoveryResult | null>(null);

  // Subscribe to persistent fundRegistryStore
  useEffect(() => {
    const unsubscribe = fundRegistryStore.subscribe((updatedFunds) => {
      setFunds(updatedFunds);
    });
    return unsubscribe;
  }, []);

  // Filtered funds using multi-dimensional search
  const filteredFunds = useMemo(() => {
    return fundRegistryStore.searchFunds({
      query: searchTerm,
      strategy: strategyFilter,
      jurisdiction: jurisdictionFilter
    });
  }, [funds, searchTerm, strategyFilter, jurisdictionFilter]);

  // Clone fund
  const handleCloneFund = (fundToClone: FundModel) => {
    const clonedRes = fundRegistryStore.createFund({
      ...fundToClone,
      name: `${fundToClone.name} (Cloned Sandbox)`,
      code: `${fundToClone.code}-CLONE`,
      status: 'SYNTHETIC',
      is_synthetic: true
    });
    if (clonedRes.success && clonedRes.fund) {
      onSelectFund(clonedRes.fund.id);
    }
  };

  // Submit Single Fund
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = fundRegistryStore.createFund({
      ...createForm,
      aum_usd: Number(createForm.aum_usd)
    });

    if (result.success && result.fund) {
      setIsAddModalOpen(false);
      onSelectFund(result.fund.id);
      setCreateForm({
        name: '',
        code: '',
        type: 'Hedge Fund',
        adviser_name: '',
        jurisdiction: 'Delaware LP / Cayman Feeder',
        formation_date: new Date().toISOString().split('T')[0],
        aum_usd: 500000000,
        strategy_description: '',
        cik: '',
        section_754_elected: true,
        section_704c_method: 'TRADITIONAL',
        section_163j_limitation_active: false
      });
    } else {
      alert(`Error creating fund: ${result.error}`);
    }
  };

  // Run Batch Ingestion
  const handleBatchImport = () => {
    if (!batchText.trim()) return;

    let parsedData: any[] = [];
    try {
      if (batchFormat === 'JSON') {
        const parsed = JSON.parse(batchText);
        parsedData = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Simple CSV parser
        const lines = batchText.trim().split('\n');
        if (lines.length < 2) throw new Error('CSV must contain a header row and at least one data row.');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        parsedData = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const rowObj: any = {};
          headers.forEach((h, i) => {
            rowObj[h] = values[i] !== undefined ? values[i] : '';
          });
          return rowObj;
        });
      }

      const report = fundRegistryStore.batchImport(parsedData, batchFormat);
      setBatchReport(report);
      if (report.imported.length > 0) {
        onSelectFund(report.imported[0].id);
      }
    } catch (err: any) {
      alert(`Parse Error: ${err.message}`);
    }
  };

  // Load sample batch templates
  const loadSampleBatchJson = () => {
    setBatchFormat('JSON');
    setBatchText(JSON.stringify([
      {
        name: "Millennium International Ltd",
        code: "MLN-INTL",
        type: "Multi-strategy Fund",
        aum_usd: 6200000000,
        adviser_name: "Millennium Management LLC",
        jurisdiction: "Cayman Islands",
        cik: "0001004438",
        section_754_elected: true,
        section_704c_method: "CURATIVE",
        strategy_description: "Global multi-manager statistical arbitrage and quantitative macro."
      },
      {
        name: "Two Sigma Compass Fund, LP",
        code: "TS-COMPASS",
        type: "Hedge Fund",
        aum_usd: 8400000000,
        adviser_name: "Two Sigma Investments, LP",
        jurisdiction: "Delaware LP",
        cik: "0001179392",
        section_754_elected: true,
        section_704c_method: "TRADITIONAL",
        strategy_description: "Systematic multi-asset model-driven algorithmic fund."
      }
    ], null, 2));
  };

  const loadSampleBatchCsv = () => {
    setBatchFormat('CSV');
    setBatchText(`name,code,type,aum_usd,adviser_name,jurisdiction,cik,section_754_elected\nD.E. Shaw Composite Fund LLC,DES-COMP,Multi-strategy Fund,15000000000,D.E. Shaw & Co. L.P.,Delaware LLC,0001009207,true\nAQR Global Risk Premium Fund,AQR-GRP,Hedge Fund,5200000000,AQR Capital Management LLC,Delaware LP,0001167483,true`);
  };

  // Synthetic Generator
  const handleGenerateSynthetic = () => {
    const newSynFunds = generateSyntheticFunds({
      count: genCount,
      knownCorrelationSlope: injectSlope,
      injectKnownCorrelation: true
    });
    newSynFunds.forEach(f => fundRegistryStore.createFund(f));
    const benchmark = testGroundTruthRecovery(newSynFunds, injectSlope);
    setRecoveryResult(benchmark);
  };

  const determinabilityAudit: MechanicalDeterminabilityAudit | null = useMemo(() => {
    if (!inspectedFund) return null;
    return calculateDeterminabilityAudit(inspectedFund.id);
  }, [inspectedFund]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold uppercase">
              Canonical Fund Universe &amp; State Store
            </span>
            <span className="text-xs text-zinc-400 font-mono">Dynamic Multi-Fund Research Environment</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-400" />
            <span>Fund Registry &amp; Multi-Fund Lab</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            A fund is a research dataset. Search, add, batch-import, inspect, filter, and persist funds with full computational state $S_t = (G_t, X_t, A_t, I_t, C_t, P_t, V_t)$.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Batch Ingest (JSON/CSV)</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Single Fund</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 p-1 rounded-2xl text-xs font-mono">
          <button
            onClick={() => setActiveTab('REGISTRY')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'REGISTRY' ? 'bg-blue-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Fund Universe ({funds.length})
          </button>
          <button
            onClick={() => setActiveTab('COMPARE')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'COMPARE' ? 'bg-blue-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Compare ({selectedFundIdsForCompare.length})
          </button>
          <button
            onClick={() => setActiveTab('GENERATOR')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'GENERATOR' ? 'bg-blue-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Synthetic Generator
          </button>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset fund registry to canonical seed cases? Custom funds will be removed.')) {
              fundRegistryStore.resetToDefaults();
            }
          }}
          className="text-zinc-500 hover:text-zinc-300 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* TAB 1: FUND REGISTRY WITH MULTI-DIMENSIONAL SEARCH */}
      {activeTab === 'REGISTRY' && (
        <div className="space-y-4">
          
          {/* Multi-Dimensional Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950 p-3 rounded-2xl border border-white/10 text-xs font-mono">
            <div className="relative w-full sm:w-96">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, ID, manager, entity, CIK, or strategy..."
                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-zinc-400">Strategy:</span>
              <select
                value={strategyFilter}
                onChange={(e) => setStrategyFilter(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Strategies</option>
                <option value="Hedge Fund">Hedge Fund</option>
                <option value="Private Equity">Private Equity</option>
                <option value="Real Estate Fund">Real Estate Fund</option>
                <option value="Credit Fund">Credit Fund</option>
                <option value="Venture Capital">Venture Capital</option>
                <option value="Multi-strategy Fund">Multi-strategy Fund</option>
              </select>

              <span className="text-zinc-400 ml-2">Jurisdiction:</span>
              <select
                value={jurisdictionFilter}
                onChange={(e) => setJurisdictionFilter(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Jurisdictions</option>
                <option value="Delaware">Delaware</option>
                <option value="Cayman">Cayman Islands</option>
                <option value="Luxembourg">Luxembourg</option>
              </select>
            </div>
          </div>

          {/* Genuine Empty State */}
          {filteredFunds.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-zinc-950/80 border border-white/10 space-y-3 font-mono">
              <Search className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="text-zinc-400 font-bold text-sm">NO RESULTS FOUND</div>
              <p className="text-zinc-500 text-xs max-w-md mx-auto">
                No funds in the persistent registry matched query "{searchTerm}" with strategy "{strategyFilter}".
              </p>
              <button
                onClick={() => { setSearchTerm(''); setStrategyFilter('ALL'); setJurisdictionFilter('ALL'); }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFunds.map((fund) => {
                const isActive = fund.id === activeFundId;
                const isComparing = selectedFundIdsForCompare.includes(fund.id);
                const freshness = fundRegistryStore.getFreshness(fund.id);

                return (
                  <div
                    key={fund.id}
                    className={`p-5 rounded-3xl border transition-all space-y-4 ${
                      isActive 
                        ? 'bg-blue-950/30 border-blue-500/50 shadow-xl shadow-blue-500/10' 
                        : 'bg-zinc-950/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                            {fund.code}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">{fund.type}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                            {freshness.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">{fund.name}</h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{fund.jurisdiction}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold font-mono text-white">
                          ${(fund.aum_usd / 1000000000).toFixed(1)}B
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">AUM (USD)</div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans">
                      {fund.strategy_description}
                    </p>

                    {/* Metrics Badges */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-zinc-900/60 border border-white/5 text-[10px] font-mono">
                      <div>
                        <div className="text-zinc-500">§754 Status</div>
                        <div className="text-white font-bold">{fund.section_754_elected ? 'ELECTED' : 'NONE'}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500">704(c) Method</div>
                        <div className="text-white font-bold">{fund.section_704c_method}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500">Sufficiency</div>
                        <div className="text-emerald-400 font-bold">{fund.tax_metrics.state_sufficiency_score}</div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectFund(fund.id)}
                          className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            isActive 
                              ? 'bg-blue-500 text-white font-bold' 
                              : 'bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isActive ? 'Active Fund' : 'Set Active'}</span>
                        </button>

                        <button
                          onClick={() => setInspectedFund(fund)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-all cursor-pointer"
                        >
                          Inspect
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (isComparing) {
                              setSelectedFundIdsForCompare(prev => prev.filter(id => id !== fund.id));
                            } else {
                              setSelectedFundIdsForCompare(prev => [...prev, fund.id]);
                            }
                          }}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                            isComparing ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                          title="Toggle Compare"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleCloneFund(fund)}
                          className="p-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                          title="Clone to Synthetic Sandbox"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPARE */}
      {activeTab === 'COMPARE' && (
        <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5 space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="font-bold text-white text-sm">Side-by-Side Fund State Comparison</h3>
            <span className="text-zinc-500">Comparing {selectedFundIdsForCompare.length} Funds</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="py-2 px-3">Dimension</th>
                  {selectedFundIdsForCompare.map(id => {
                    const f = funds.find(item => item.id === id);
                    return <th key={id} className="py-2 px-3 text-white font-bold">{f?.code || id}</th>;
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-2.5 px-3 text-zinc-400">AUM (USD)</td>
                  {selectedFundIdsForCompare.map(id => {
                    const f = funds.find(item => item.id === id);
                    return <td key={id} className="py-2.5 px-3 font-bold text-emerald-400">${((f?.aum_usd || 0) / 1000000000).toFixed(1)}B</td>;
                  })}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-zinc-400">Jurisdiction</td>
                  {selectedFundIdsForCompare.map(id => {
                    const f = funds.find(item => item.id === id);
                    return <td key={id} className="py-2.5 px-3 text-zinc-300">{f?.jurisdiction}</td>;
                  })}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-zinc-400">Section 754</td>
                  {selectedFundIdsForCompare.map(id => {
                    const f = funds.find(item => item.id === id);
                    return <td key={id} className="py-2.5 px-3 text-zinc-300">{f?.section_754_elected ? 'ELECTED' : 'NONE'}</td>;
                  })}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-zinc-400">Section 704(c) Method</td>
                  {selectedFundIdsForCompare.map(id => {
                    const f = funds.find(item => item.id === id);
                    return <td key={id} className="py-2.5 px-3 text-zinc-300">{f?.section_704c_method}</td>;
                  })}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-zinc-400">State Sufficiency</td>
                  {selectedFundIdsForCompare.map(id => {
                    const f = funds.find(item => item.id === id);
                    return <td key={id} className="py-2.5 px-3 text-emerald-400 font-bold">{f?.tax_metrics?.state_sufficiency_score}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SYNTHETIC GENERATOR */}
      {activeTab === 'GENERATOR' && (
        <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 space-y-4 font-mono text-xs">
          <div className="max-w-2xl space-y-2">
            <h3 className="font-bold text-white text-base">Parameterized Synthetic Fund Generator</h3>
            <p className="text-zinc-400 leading-relaxed font-sans">
              Inject ground-truth mathematical relationships into newly spawned funds. Run automated recovery benchmarks to verify that the empirical observer recovers injected parameter slopes without bias.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md pt-2">
            <div>
              <label className="text-zinc-400">Funds to Generate:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={genCount}
                onChange={(e) => setGenCount(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-zinc-400">Known Beta Slope to Inject:</label>
              <input
                type="number"
                step="0.005"
                value={injectSlope}
                onChange={(e) => setInjectSlope(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white mt-1"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateSynthetic}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate &amp; Run Ground-Truth Recovery Test</span>
          </button>

          {recoveryResult && (
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2 mt-4">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Recovery Benchmark Complete</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>Injected Slope: <strong className="text-white">{recoveryResult.injected_slope}</strong></div>
                <div>Recovered Slope: <strong className="text-emerald-300">{recoveryResult.recovered_slope}</strong></div>
                <div>R-Squared: <strong className="text-white">{recoveryResult.recovered_r2}</strong></div>
                <div>Recovered: <strong className="text-emerald-400">{recoveryResult.is_ground_truth_recovered ? 'YES (BIAS < 2.5%)' : 'NO'}</strong></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INSPECT FUND MODAL & DETERMINABILITY AUDIT */}
      {inspectedFund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-white/20 rounded-3xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto font-mono text-xs">
            
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-bold uppercase">
                  {inspectedFund.type}
                </span>
                <h2 className="text-xl font-bold text-white mt-1 font-sans">{inspectedFund.name}</h2>
                <p className="text-zinc-400 text-xs mt-0.5">
                  ID: {inspectedFund.id} · Code: {inspectedFund.code} · Inception: {inspectedFund.formation_date}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const res = fundRegistryStore.refreshFundData(inspectedFund.id);
                    if (res.success) alert(`Fund data refreshed from authoritative source at ${res.newTimestamp}`);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Feed</span>
                </button>
                <button
                  onClick={() => setInspectedFund(null)}
                  className="p-1 rounded-xl bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* RESEARCH QUESTION: Mechanical vs Human Determination Quotient */}
            {determinabilityAudit && (
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Computational vs Human Determinability Audit
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    determinabilityAudit.status === 'CLOSED_MECHANICAL'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {determinabilityAudit.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                  Experimental Answer to Core Research Question: <strong>{(determinabilityAudit.mechanicalCompletenessRatio * 100).toFixed(1)}%</strong> of this fund's investment tax state is mechanically determinable by the bounded state transition system {"D = {§704(b), §704(c), §743(b), §754}"}.
                </p>

                {/* Deterministic Projections List */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Deterministic State Invariants:</div>
                  {determinabilityAudit.deterministicProjections.map((p, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px]">
                      <div>
                        <strong className="text-emerald-400 font-mono mr-2">{p.statute}</strong>
                        <span className="text-zinc-300">{p.description}</span>
                      </div>
                      <span className="text-emerald-300 font-bold">{p.result.split(':')[0]}</span>
                    </div>
                  ))}
                </div>

                {/* Human Determinations Required */}
                {determinabilityAudit.humanDeterminationsRequired.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <div className="text-[10px] text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Material Ambiguities Requiring Human Legal Determination:</span>
                    </div>
                    {determinabilityAudit.humanDeterminationsRequired.map(h => (
                      <div key={h.id} className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1 text-[11px]">
                        <div className="font-bold text-amber-300">{h.issueTitle}</div>
                        <p className="text-zinc-300 font-sans">{h.statutoryAmbiguityReason}</p>
                        <div className="text-[10px] text-zinc-500">Source: {h.sourceDocument} · Precedent: {h.suggestedJudicialPrecedent}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fund Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-0.5">
                <div className="text-zinc-500 text-[10px]">AUM (USD)</div>
                <div className="text-base font-bold text-white">${(inspectedFund.aum_usd / 1000000000).toFixed(2)}B</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-0.5">
                <div className="text-zinc-500 text-[10px]">Adviser / Sponsor</div>
                <div className="text-white truncate">{inspectedFund.adviser_name}</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-0.5">
                <div className="text-zinc-500 text-[10px]">Section 754 Election</div>
                <div className="text-emerald-400 font-bold">{inspectedFund.section_754_elected ? 'ACTIVE' : 'NO'}</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-0.5">
                <div className="text-zinc-500 text-[10px]">Section 704(c) Method</div>
                <div className="text-cyan-300 font-bold">{inspectedFund.section_704c_method}</div>
              </div>
            </div>

            {/* Assets in Fund Portfolio */}
            <div className="space-y-2">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Underlying Multi-Asset Portfolio:</div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {inspectedFund.assets?.map(a => (
                  <div key={a.asset_id} className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-white mr-2">{a.name}</span>
                      <span className="text-zinc-500 text-[10px]">[{a.asset_type} · {a.tax_character}]</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">${(a.fair_value / 1000000).toFixed(1)}M</div>
                      <div className="text-[9px] text-zinc-500">Basis: ${(a.tax_basis / 1000000).toFixed(1)}M</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE FUND CREATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <form onSubmit={handleCreateSubmit} className="bg-zinc-950 border border-white/20 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Register Institutional Fund &amp; Create Computational State S_t</span>
              </h2>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-zinc-400">Fund Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Citadel Wellington Fund Ltd"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Fund Code / Ticker:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CIT-WELL"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Strategy Classification:</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white cursor-pointer"
                >
                  <option value="Hedge Fund">Hedge Fund</option>
                  <option value="Private Equity">Private Equity</option>
                  <option value="Credit Fund">Credit Fund</option>
                  <option value="Real Estate Fund">Real Estate Fund</option>
                  <option value="Multi-strategy Fund">Multi-strategy Fund</option>
                  <option value="Venture Capital">Venture Capital</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">AUM (USD):</label>
                <input
                  type="number"
                  required
                  value={createForm.aum_usd}
                  onChange={(e) => setCreateForm({ ...createForm, aum_usd: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Manager / Sponsor:</label>
                <input
                  type="text"
                  placeholder="e.g. Citadel Enterprise Americas LLC"
                  value={createForm.adviser_name}
                  onChange={(e) => setCreateForm({ ...createForm, adviser_name: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Jurisdiction:</label>
                <input
                  type="text"
                  value={createForm.jurisdiction}
                  onChange={(e) => setCreateForm({ ...createForm, jurisdiction: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">SEC EDGAR CIK (if registered):</label>
                <input
                  type="text"
                  placeholder="e.g. 0001423053"
                  value={createForm.cik}
                  onChange={(e) => setCreateForm({ ...createForm, cik: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Section 704(c) Method:</label>
                <select
                  value={createForm.section_704c_method}
                  onChange={(e) => setCreateForm({ ...createForm, section_704c_method: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white cursor-pointer"
                >
                  <option value="TRADITIONAL">Traditional Method</option>
                  <option value="CURATIVE">Curative Allocations Method</option>
                  <option value="REMEDIAL">Remedial Allocations Method</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400">Strategy Description:</label>
              <textarea
                rows={2}
                value={createForm.strategy_description}
                onChange={(e) => setCreateForm({ ...createForm, strategy_description: e.target.value })}
                placeholder="Institutional investment approach and portfolio composition..."
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.section_754_elected}
                  onChange={(e) => setCreateForm({ ...createForm, section_754_elected: e.target.checked })}
                  className="rounded bg-zinc-900 border-white/10 text-blue-500"
                />
                <span className="text-white font-mono">IRC Section 754 Election in effect</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold cursor-pointer"
              >
                Create &amp; Persist Fund
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BATCH INGESTION MODAL */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-white/20 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl font-mono text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Batch Ingest Funds (JSON &amp; CSV)</span>
                </h2>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Pre-insertion validation, duplicate detection, and partial-import status reporting.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsBatchModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Format:</span>
                <button
                  onClick={() => setBatchFormat('JSON')}
                  className={`px-2.5 py-1 rounded-lg ${batchFormat === 'JSON' ? 'bg-purple-500 text-white font-bold' : 'bg-white/10 text-zinc-400'}`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setBatchFormat('CSV')}
                  className={`px-2.5 py-1 rounded-lg ${batchFormat === 'CSV' ? 'bg-purple-500 text-white font-bold' : 'bg-white/10 text-zinc-400'}`}
                >
                  CSV
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadSampleBatchJson}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 text-[10px]"
                >
                  Load Sample JSON
                </button>
                <button
                  onClick={loadSampleBatchCsv}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 text-[10px]"
                >
                  Load Sample CSV
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={batchFormat === 'JSON' ? 'Paste structured JSON array of funds...' : 'Paste CSV text with header row...'}
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleBatchImport}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold cursor-pointer"
              >
                Run Batch Validation &amp; Ingest
              </button>
            </div>

            {/* BATCH VALIDATION REPORT */}
            {batchReport && (
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3 pt-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Batch Import Report
                  </span>
                  <span className="text-[10px] text-zinc-500">{batchReport.timestamp}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                    <div className="text-emerald-400 font-bold text-base">{batchReport.imported.length}</div>
                    <div className="text-[10px] text-emerald-300">Imported</div>
                  </div>
                  <div className="p-2 rounded-xl bg-red-950/30 border border-red-500/30">
                    <div className="text-red-400 font-bold text-base">{batchReport.rejected.length}</div>
                    <div className="text-[10px] text-red-300">Rejected</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30">
                    <div className="text-amber-400 font-bold text-base">{batchReport.duplicates.length}</div>
                    <div className="text-[10px] text-amber-300">Duplicate</div>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-500/30">
                    <div className="text-blue-400 font-bold text-base">{batchReport.missingRequiredFields.length}</div>
                    <div className="text-[10px] text-blue-300">Missing Fields</div>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/30">
                    <div className="text-purple-400 font-bold text-base">{batchReport.needsReview.length}</div>
                    <div className="text-[10px] text-purple-300">Needs Review</div>
                  </div>
                </div>

                {batchReport.duplicates.length > 0 && (
                  <div className="p-2 rounded-xl bg-amber-950/20 text-amber-300 text-[11px]">
                    Duplicate Warning: Skipped {batchReport.duplicates.map(d => d.name).join(', ')} (already in universe).
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
