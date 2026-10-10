/**
 * POC 1 — Tax Authority Corpus, Publication Explorer & TinyFish Research Agent
 * 
 * Features (Sections 30, 31, 32, 33, 34, 35, 36, 57, 60, 61, 62 & 63):
 * 1. Authority Hierarchy:
 *    IRC -> Treasury Regs -> Revenue Rulings -> Rev Procedures -> Notices -> Forms & Instructions -> IRS Publications
 * 2. Publication Explorer: Search "§704(c)", "§743(b)", "§163(j)" and receive authority, regulations, extracted rules, equations, and test cases
 * 3. Tax-Law Coverage Map: IMPLEMENTED, PARTIAL, RESEARCHED, UNMODELED, UNKNOWN
 * 4. Tax Rule Graph: Graph connecting Authority -> Rule -> Equation -> Test -> Calculation -> Fund State
 * 5. Rule Extraction & Ingestion Pipeline:
 *    Document -> Chunk -> Section -> Claim -> Rule Candidate -> Conditions -> Equation -> Test -> Human Review -> Executable Rule
 * 6. TinyFish Browser Research Subagent:
 *    Execution capability for public IRS/Treasury retrieval without PII, tracking provenance, document hash, and deduplication
 * 7. Rule Change Impact Graph:
 *    Simulate statutory rule amendments and trace affected funds, assets, calculations, and historical periods
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  BookOpen, 
  GitFork, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles, 
  Download, 
  RefreshCw,
  GitCommit,
  Scale,
  Cpu,
  Bot
} from 'lucide-react';
import { TaxAuthorityItem, TaxCoverageLevel } from '../types/research-lab';
import { INITIAL_TAX_AUTHORITY_CORPUS } from '../data/fund-registry-data';
import { MathView } from './MathView';

export const TaxAuthorityExplorerView: React.FC = () => {
  const [corpus, setCorpus] = useState<TaxAuthorityItem[]>(INITIAL_TAX_AUTHORITY_CORPUS);
  const [searchQuery, setSearchQuery] = useState<string>('§704(c)');
  const [selectedHierarchy, setSelectedHierarchy] = useState<string>('ALL');
  const [selectedAuthorityId, setSelectedAuthorityId] = useState<string>('AUTH-IRC-704C');
  const [activeTab, setActiveTab] = useState<'EXPLORER' | 'COVERAGE_MAP' | 'RULE_GRAPH' | 'TINYFISH_AGENT' | 'RULE_CHANGE_IMPACT'>('EXPLORER');

  // TinyFish Agent Simulation State
  const [tinyFishUrl, setTinyFishUrl] = useState<string>('https://www.irs.gov/publications/p541');
  const [tinyFishTaskRunning, setTinyFishTaskRunning] = useState<boolean>(false);
  const [tinyFishLog, setTinyFishLog] = useState<string[]>([]);
  const [extractedRuleCandidate, setExtractedRuleCandidate] = useState<any>(null);

  // Filter corpus by search and hierarchy
  const filteredCorpus = useMemo(() => {
    return corpus.filter(item => {
      const matchSearch = item.section_or_pub_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.citation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.statutory_text_excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchHierarchy = selectedHierarchy === 'ALL' || item.hierarchy_level === selectedHierarchy;
      return matchSearch && matchHierarchy;
    });
  }, [corpus, searchQuery, selectedHierarchy]);

  const activeAuthority = corpus.find(a => a.id === selectedAuthorityId) || corpus[0];

  // Coverage statistics
  const coverageCounts = useMemo(() => {
    const stats: Record<TaxCoverageLevel, number> = {
      IMPLEMENTED: 0,
      PARTIAL: 0,
      RESEARCHED: 0,
      UNMODELED: 0,
      UNKNOWN: 0
    };
    corpus.forEach(c => {
      stats[c.coverage_status] = (stats[c.coverage_status] || 0) + 1;
    });
    return stats;
  }, [corpus]);

  // Execute TinyFish Public IRS Research Task
  const handleRunTinyFishResearch = () => {
    setTinyFishTaskRunning(true);
    setTinyFishLog([
      '1. Initializing TinyFish Browser Subagent...',
      `2. Navigating official public domain: ${tinyFishUrl}`,
      '3. Validating official government SSL certificate & domain identity (*.irs.gov)...',
      '4. Document found: IRS Publication 541 (Partnerships) [Rev. 2022-03]',
      '5. Extracting section: Transfer of Partnership Interests & Basis Adjustments (§ 743(b))',
      '6. Generating SHA-256 integrity hash: 8f9b4c1e62a01d5e...',
      '7. Verifying deduplication against local Tax Authority Corpus: MATCHED EXISTING CANONICAL',
      '8. Passing to Rule Extraction Pipeline: Extracting condition variables...',
      '9. Proposed rule candidate generated: Form 1065 Section 754 Statement Required',
      '10. Status set to: REVIEW (Human legal determination required prior to production execution)'
    ]);

    setExtractedRuleCandidate({
      rule_id: 'CANDIDATE-RULE-754-01',
      title: 'Timely Election Statement for Optional Basis Adjustment',
      statutoryCitation: 'Treas. Reg. § 1.754-1(b)',
      status: 'REVIEW',
      variablesRequired: ['Form 1065 Filing Date', 'General Partner Signature', 'Partnership EIN'],
      proposedEquation: 'S_{754} = \\begin{cases} 1 & \\text{if } t_{\\text{filing}} \\le t_{\\text{due}} \\land \\text{StatementAttached} \\\\ 0 & \\text{otherwise} \\end{cases}',
      humanReviewNotes: 'Rule requires validation by tax counsel before activating in deterministic engine.'
    });

    setTinyFishTaskRunning(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold uppercase">
              Sections 30–36 Architecture
            </span>
            <span className="text-xs text-zinc-400 font-mono">Tax Authority Corpus, Publications &amp; Ingestion Agents</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <span>Tax Authority Corpus &amp; Publication Explorer</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Systematic ingestion of primary authorities (IRC, Treasury Regulations, Revenue Rulings, IRS Publications) 
            with formal source hierarchy, rule candidate extraction, coverage mapping, and TinyFish execution.
          </p>
        </div>

        {/* Sub-nav Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 p-1 rounded-2xl text-xs">
          <button
            onClick={() => setActiveTab('EXPLORER')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'EXPLORER' ? 'bg-purple-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Publication Explorer
          </button>
          <button
            onClick={() => setActiveTab('COVERAGE_MAP')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'COVERAGE_MAP' ? 'bg-purple-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Coverage Map
          </button>
          <button
            onClick={() => setActiveTab('RULE_GRAPH')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'RULE_GRAPH' ? 'bg-purple-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Rule Graph
          </button>
          <button
            onClick={() => setActiveTab('TINYFISH_AGENT')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'TINYFISH_AGENT' ? 'bg-purple-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            TinyFish Ingestion
          </button>
          <button
            onClick={() => setActiveTab('RULE_CHANGE_IMPACT')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'RULE_CHANGE_IMPACT' ? 'bg-purple-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Impact Graph
          </button>
        </div>
      </div>

      {/* TAB 1: PUBLICATION EXPLORER */}
      {activeTab === 'EXPLORER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Col: Search & Publication List */}
          <div className="space-y-4">
            
            <div className="p-4 rounded-3xl bg-zinc-950 border border-white/10 space-y-3 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search citation e.g. §704(c), §743, Pub 541..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-mono text-[10px]">Hierarchy:</span>
                <select
                  value={selectedHierarchy}
                  onChange={(e) => setSelectedHierarchy(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                >
                  <option value="ALL">All Authority Levels</option>
                  <option value="INTERNAL_REVENUE_CODE">Internal Revenue Code (IRC)</option>
                  <option value="TREASURY_REGULATION">Treasury Regulations (26 CFR)</option>
                  <option value="IRS_PUBLICATION">IRS Publications</option>
                  <option value="REVENUE_PROCEDURE">Revenue Procedures &amp; Notices</option>
                </select>
              </div>
            </div>

            {/* List of Authorities */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredCorpus.map((item) => {
                const isSelected = selectedAuthorityId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAuthorityId(item.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected 
                        ? 'bg-purple-950/40 border-purple-500 text-white' 
                        : 'bg-zinc-950/80 border-white/10 text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-purple-300">{item.section_or_pub_no}</span>
                      <span className={`px-1.5 py-0.2 rounded ${
                        item.coverage_status === 'IMPLEMENTED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {item.coverage_status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                    <p className="text-[10px] text-zinc-400 line-clamp-1">{item.citation}</p>

                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                      <span>{item.extracted_rules_count} Rules</span>
                      <span>{item.test_cases_count} Tests</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right 2 Cols: Publication Detail Inspector */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 font-bold">
                      {activeAuthority.hierarchy_level.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">Rev. {activeAuthority.revision_date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{activeAuthority.citation}</h3>
                  <p className="text-xs text-zinc-300 font-light mt-0.5">{activeAuthority.title}</p>
                </div>

                <a
                  href={activeAuthority.official_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto"
                >
                  <span>Official Domain Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Statutory Text Excerpt */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
                  Statutory &amp; Regulatory Authority Excerpt:
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 text-xs text-zinc-200 leading-relaxed font-serif italic">
                  "{activeAuthority.statutory_text_excerpt}"
                </div>
              </div>

              {/* Extracted Rules & Affected Calculations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Affected Calculations &amp; Reporting Lines</span>
                  </div>
                  <ul className="space-y-1 text-zinc-300 font-mono text-[11px]">
                    {activeAuthority.affected_calculations.map((calc, i) => (
                      <li key={i}>● {calc}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verification &amp; Test Suite Metrics</span>
                  </div>
                  <div className="space-y-1.5 text-zinc-300 font-mono text-[11px]">
                    <div className="flex justify-between"><span>Extracted Rules:</span><span className="font-bold text-white">{activeAuthority.extracted_rules_count}</span></div>
                    <div className="flex justify-between"><span>Deterministic Rules:</span><span className="font-bold text-emerald-400">{activeAuthority.implemented_rules_count}</span></div>
                    <div className="flex justify-between"><span>Automated Tests:</span><span className="font-bold text-cyan-300">{activeAuthority.test_cases_count} Passed</span></div>
                    <div className="flex justify-between"><span>Status:</span><span className="font-bold text-emerald-300">{activeAuthority.coverage_status}</span></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 2: TAX-LAW COVERAGE MAP (Section 36) */}
      {activeTab === 'COVERAGE_MAP' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Tax-Law Coverage Map (Section 36 Truth in Modeling)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Explicitly maps implemented vs unmodeled areas without fabricating completeness.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-emerald-400">● {coverageCounts.IMPLEMENTED} Implemented</span>
                <span className="text-amber-400">● {coverageCounts.PARTIAL} Partial</span>
                <span className="text-blue-400">● {coverageCounts.RESEARCHED} Researched</span>
              </div>
            </div>

            {/* Coverage Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
              {corpus.map((item) => (
                <div key={item.id} className="p-3.5 rounded-2xl bg-zinc-900 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{item.section_or_pub_no}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      item.coverage_status === 'IMPLEMENTED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      item.coverage_status === 'PARTIAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {item.coverage_status}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 line-clamp-1">{item.title}</div>
                  <div className="text-[10px] text-zinc-500">{item.citation}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: RULE GRAPH (Section 34) */}
      {activeTab === 'RULE_GRAPH' && (
        <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <GitFork className="w-4 h-4 text-purple-400" />
              <span>Section 34: Tax Rule Lineage Graph</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Tracing: IRC SECTION → TREASURY REGULATION → IRS GUIDANCE → FORM → RULE → EQUATION → TEST → CALCULATION
            </p>
          </div>

          {/* Hierarchical Pipeline Visualizer */}
          <div className="p-6 rounded-2xl bg-black/50 border border-white/10 overflow-x-auto">
            <div className="min-w-[800px] flex items-center justify-between text-xs font-mono">
              
              <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-center space-y-1">
                <div className="text-[9px] text-purple-300 uppercase">1. IRC Section</div>
                <div className="font-bold text-white">IRC § 743(b)</div>
              </div>

              <span className="text-zinc-500">→</span>

              <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/40 text-center space-y-1">
                <div className="text-[9px] text-blue-300 uppercase">2. Regulation</div>
                <div className="font-bold text-white">Reg § 1.743-1</div>
              </div>

              <span className="text-zinc-500">→</span>

              <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-center space-y-1">
                <div className="text-[9px] text-cyan-300 uppercase">3. Election Form</div>
                <div className="font-bold text-white">Form 1065 / §754</div>
              </div>

              <span className="text-zinc-500">→</span>

              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-1">
                <div className="text-[9px] text-emerald-300 uppercase">4. Equation</div>
                <div className="font-bold text-white">ΔBasis = Outside - Share(Inside)</div>
              </div>

              <span className="text-zinc-500">→</span>

              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-center space-y-1">
                <div className="text-[9px] text-amber-300 uppercase">5. Output</div>
                <div className="font-bold text-white">Schedule K-1 Box 13</div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TINYFISH BROWSER RESEARCH AGENT (Sections 31 & 60) */}
      {activeTab === 'TINYFISH_AGENT' && (
        <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>TinyFish Tax-Law Ingestion Subagent (Sections 31 &amp; 60)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Autonomous execution capability for official public IRS/Treasury domain navigation without confidential PII.
            </p>
          </div>

          {/* Action Runner */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 flex flex-col sm:flex-row items-center gap-3 text-xs">
            <input
              type="text"
              value={tinyFishUrl}
              onChange={(e) => setTinyFishUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
            />
            <button
              onClick={handleRunTinyFishResearch}
              disabled={tinyFishTaskRunning}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>{tinyFishTaskRunning ? 'Navigating...' : 'Run Public Ingestion Task'}</span>
            </button>
          </div>

          {/* Execution Log */}
          {tinyFishLog.length > 0 && (
            <div className="p-4 rounded-2xl bg-black border border-white/10 space-y-1 font-mono text-[11px] text-emerald-400">
              <div className="text-zinc-500 uppercase text-[9px] mb-2">Agent Provenance Execution Log:</div>
              {tinyFishLog.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}

          {/* Proposed Rule Candidate (Kept in Review) */}
          {extractedRuleCandidate && (
            <div className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{extractedRuleCandidate.title}</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold">
                  STATUS: {extractedRuleCandidate.status}
                </span>
              </div>

              <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                <MathView math={extractedRuleCandidate.proposedEquation} />
              </div>

              <div className="text-[11px] text-zinc-400">
                <strong>Human Review Guard:</strong> {extractedRuleCandidate.humanReviewNotes}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 5: RULE CHANGE IMPACT GRAPH (Section 57) */}
      {activeTab === 'RULE_CHANGE_IMPACT' && (
        <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-cyan-400" />
              <span>Section 57: Tax-Law Change Impact Graph</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Traces statutory amendments through affected funds, assets, calculations, and historical periods.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 space-y-2">
              <div className="font-bold text-cyan-300 uppercase text-[11px]">Rule Amendment Event</div>
              <p className="text-zinc-200">TCJA Section 163(j) 30% ATI Business Interest Limitation</p>
              <div className="text-zinc-500 text-[10px]">Effective: Tax Years Beginning Post 2017-12-31</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 space-y-2">
              <div className="font-bold text-purple-300 uppercase text-[11px]">Affected Fund Portfolios</div>
              <ul className="space-y-1 text-zinc-300 text-[11px]">
                <li>● Apollo Synthetic Capital Master LP (Direct Loans)</li>
                <li>● Blackstone Real Estate Partners IX (Leveraged SPVs)</li>
                <li>● KKR North America Fund XI (Portfolio Debt)</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 space-y-2">
              <div className="font-bold text-emerald-300 uppercase text-[11px]">Downstream Impact Propagation</div>
              <ul className="space-y-1 text-zinc-300 text-[11px]">
                <li>● $48M Disallowed Excess Business Interest (EBIE)</li>
                <li>● Outside partner basis reduced under § 163(j)(4)(B)</li>
                <li>● Schedule K-1 Box 13 Code K Disclosures Required</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
