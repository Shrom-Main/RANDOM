/**
 * Interactive SEC EDGAR Search Component
 * Provides live search across private fund filings, CIK directory, and direct links to SEC.gov archives.
 */

import React, { useState, useMemo } from 'react';
import { SEC_FILINGS_DATABASE, SecFilingRecord } from '../data/sec-filings-database';
import { 
  Search, 
  ExternalLink, 
  Filter, 
  Building2, 
  Calendar, 
  FileText, 
  ArrowRight, 
  X,
  FileCheck,
  Hash,
  Sparkles,
  Info
} from 'lucide-react';

interface SecSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCaseFund?: (caseId: string) => void;
  onNavigateToLedger?: (cikOrName: string) => void;
}

export const SecSearchModal: React.FC<SecSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCaseFund,
  onNavigateToLedger
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('ALL');
  const [selectedFormType, setSelectedFormType] = useState<string>('ALL');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  // Quick preset CIK buttons
  const presetCiks = [
    { name: 'Bridgewater PA II', cik: '0001358883', caseId: 'case-bridgewater-pa2' },
    { name: 'Elliott Associates', cik: '0000904495', caseId: 'case-elliott-associates' },
    { name: 'Citadel Wellington', cik: '0001423053', caseId: 'case-citadel-wellington' },
    { name: 'Pershing Square', cik: '0001336528', caseId: 'case-pershing-square' },
    { name: 'Blackstone BREP IX', cik: '0001755100', caseId: 'case-blackstone-brep' },
    { name: 'Carlyle Global Part.', cik: '0001527166', caseId: 'case-carlyle-continuation' },
    { name: 'KKR North America XI', cik: '0001553406', caseId: 'case-kkr-na11' },
    { name: 'Adams Street Sec. 7', cik: '0001851299', caseId: 'case-adams-street-secondary' },
    { name: 'HarbourVest PAF', cik: '0001799276', caseId: 'case-harbourvest-fof' },
    { name: 'Hamilton Lane PAF', cik: '0001830131', caseId: 'case-hamilton-lane' }
  ];

  // Filtered filings
  const filteredFilings = useMemo(() => {
    return SEC_FILINGS_DATABASE.filter(f => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        f.entityName.toLowerCase().includes(q) ||
        f.adviserName.toLowerCase().includes(q) ||
        f.cik.includes(q) ||
        f.accessionNumber.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.keyDisclosedFacts.some(fact => fact.toLowerCase().includes(q));

      const matchesStrategy = selectedStrategy === 'ALL' || f.fundType === selectedStrategy;
      const matchesForm = selectedFormType === 'ALL' || f.formType === selectedFormType;
      const matchesDomain = selectedDomain === 'ALL' || f.taxRelevanceDomain === selectedDomain;

      return matchesQuery && matchesStrategy && matchesForm && matchesDomain;
    });
  }, [searchQuery, selectedStrategy, selectedFormType, selectedDomain]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#0b101b] border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-[#0d1424] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <Building2 className="w-4 h-4" />
              <span>SEC EDGAR Primary Filing Archive & Full-Text Search</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">Authoritative Tier 1 Evidence</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Search Real-World SEC Filings (Form ADV, Form D, Form D/A, 13F)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Query official SEC EDGAR regulatory filings, verify CIK numbers and accession records, and link empirical tax facts to POC1 computational states.
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar & External Search Quick Links */}
        <div className="p-5 border-b border-white/10 ios-glass-subtle space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Fund Name, Adviser, CIK (e.g. 0001358883), Accession No., or key tax term..."
                className="w-full pl-10 pr-4 py-2.5 ios-glass text-sm text-white placeholder-slate-500 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-sans"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Direct External SEC.gov Live Links */}
            <div className="flex items-center gap-2">
              <a
                href={`https://www.sec.gov/edgar/searchedgar/companysearch?search_text=${encodeURIComponent(searchQuery || 'hedge fund')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 ios-glass text-xs text-slate-200 border border-white/10 rounded-2xl hover:bg-white/15 transition-all font-medium whitespace-nowrap cursor-pointer shadow-sm"
                title="Search company database directly on SEC.gov"
              >
                <span>SEC Company Search</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              </a>

              <a
                href={`https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(searchQuery || '§754 election')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 ios-glass text-xs text-slate-200 border border-white/10 rounded-2xl hover:bg-white/15 transition-all font-medium whitespace-nowrap cursor-pointer shadow-sm"
                title="Search SEC EDGAR Full-Text Search (EFTS)"
              >
                <span>SEC EFTS Full-Text</span>
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              </a>
            </div>
          </div>

          {/* Quick CIK Preset Chips */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Case Study Ecosystems (Click to load CIK &amp; filings):</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {presetCiks.map((chip) => (
                <button
                  key={chip.cik}
                  onClick={() => setSearchQuery(chip.cik)}
                  className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer font-mono ${
                    searchQuery === chip.cik 
                      ? 'bg-blue-600/30 text-blue-200 border-blue-500 font-bold shadow-sm'
                      : 'ios-glass-subtle text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {chip.name} ({chip.cik})
                </button>
              ))}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="flex items-center gap-1 text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Strategy Filter */}
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Fund Strategies</option>
              <option value="Hedge Fund">Hedge Funds</option>
              <option value="Private Equity">Private Equity</option>
              <option value="Fund-of-Funds">Fund-of-Funds</option>
            </select>

            {/* Form Type Filter */}
            <select
              value={selectedFormType}
              onChange={(e) => setSelectedFormType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Filing Types</option>
              <option value="Form D">Form D (Initial Notice)</option>
              <option value="Form D/A">Form D/A (Amended Notice)</option>
              <option value="Form ADV Part 1A">Form ADV Part 1A</option>
              <option value="13F-HR">13F-HR Holdings</option>
            </select>

            {/* Tax Domain Filter */}
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Tax Domains</option>
              <option value="§704(b)">§704(b) Book Revaluation</option>
              <option value="§704(c)">§704(c) Built-In Gain</option>
              <option value="§743(b)">§743(b) Basis Adjustment</option>
              <option value="Tiered / Cascade">Tiered Partnership Cascade</option>
              <option value="Outside Initial Domain">Outside Initial Domain</option>
            </select>

            <span className="ml-auto text-[11px] text-slate-500 font-mono">
              Found {filteredFilings.length} matching filings
            </span>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredFilings.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">No matching SEC filings found</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No indexed filings match &quot;{searchQuery}&quot;. Try broadening your keywords, resetting filters, or using the external SEC.gov links above to query all 20+ million EDGAR archives.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedStrategy('ALL'); setSelectedFormType('ALL'); setSelectedDomain('ALL'); }}
                className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded-lg hover:text-white border border-slate-700 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredFilings.map((filing) => (
              <div 
                key={filing.accessionNumber}
                className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-white text-sm hover:text-emerald-400 transition-colors">
                      {filing.entityName}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                      filing.formType === 'Form D/A' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      filing.formType === 'Form D' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      filing.formType === 'Form ADV Part 1A' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                      'bg-purple-950 text-purple-300 border border-purple-800'
                    }`}>
                      {filing.formType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {filing.fundType}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900">
                      {filing.taxRelevanceDomain}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-500" />
                      CIK: <strong className="text-slate-200">{filing.cik}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Filed: <span className="text-slate-200">{filing.filingDate}</span>
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-300">
                  <span className="text-slate-500 font-medium">Investment Adviser: </span>
                  <span className="text-slate-200">{filing.adviserName}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {filing.description}
                </p>

                {/* Economic offering figures */}
                {(filing.totalOfferingAmount || filing.totalAmountSold || filing.investorCount) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 text-[11px] font-mono">
                    {filing.totalOfferingAmount && (
                      <div>
                        <span className="text-slate-500 block">Total Offering:</span>
                        <span className="text-slate-200 font-semibold">{filing.totalOfferingAmount}</span>
                      </div>
                    )}
                    {filing.totalAmountSold && (
                      <div>
                        <span className="text-slate-500 block">Total Sold:</span>
                        <span className="text-emerald-400 font-semibold">{filing.totalAmountSold}</span>
                      </div>
                    )}
                    {filing.minimumInvestment && (
                      <div>
                        <span className="text-slate-500 block">Min Investment:</span>
                        <span className="text-slate-200">{filing.minimumInvestment}</span>
                      </div>
                    )}
                    {filing.investorCount && (
                      <div>
                        <span className="text-slate-500 block">Accredited LPs:</span>
                        <span className="text-cyan-400 font-semibold">{filing.investorCount}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Key Disclosed Tax Facts */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Disclosed Tax & Structural Facts:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-slate-300 space-y-0.5">
                    {filing.keyDisclosedFacts.map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-[11px] text-slate-500 font-mono">
                    Accession: {filing.accessionNumber}
                  </div>

                  <div className="flex items-center gap-2">
                    {filing.relevantCaseId && onSelectCaseFund && (
                      <button
                        onClick={() => {
                          onSelectCaseFund(filing.relevantCaseId!);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-medium transition-colors cursor-pointer"
                        title="Load this fund into the Interactive Workbench"
                      >
                        <span>Load in Workbench</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onNavigateToLedger && (
                      <button
                        onClick={() => {
                          onNavigateToLedger(filing.entityName);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        title="View provenance in Master Evidence Ledger"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Evidence Ledger</span>
                      </button>
                    )}

                    <a
                      href={filing.primaryDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium cursor-pointer"
                      title="Open primary filing on SEC.gov"
                    >
                      <span>SEC.gov Link</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0d1424] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            <span>SEC EDGAR Tier 1 Primary Authority Gateway</span>
          </div>
          <div>
            Press ESC or click close to return to workbench
          </div>
        </div>

      </div>
    </div>
  );
};
