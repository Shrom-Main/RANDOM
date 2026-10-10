/**
 * Master Evidence Ledger View (Section 41 & Section 8)
 * Empirical evidence table tracing SEC EDGAR, IRS Authorities, and Fund Disclosures
 * with Provenance Chains, Bitemporal timestamps (tv vs tr), and Boundary Status.
 */

import React, { useState, useMemo } from 'react';
import { MASTER_EVIDENCE_TABLE, EmpiricalEvidenceItem } from '../data/master-evidence';
import { Search, Filter, ArrowRight, ExternalLink, ShieldCheck, AlertCircle, XCircle } from 'lucide-react';
import { DomainRegime, FactStatus } from '../types/tax-state';

export const EvidenceLedgerView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEvidence, setSelectedEvidence] = useState<EmpiricalEvidenceItem | null>(null);

  const filteredEvidence = useMemo(() => {
    return MASTER_EVIDENCE_TABLE.filter(item => {
      const matchesSearch = 
        item.evidenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fundOrAdviser.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.extractedFact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceFiling.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDomain = selectedDomain === 'ALL' || item.pocDomain === selectedDomain;
      const matchesStatus = selectedStatus === 'ALL' || item.factStatus === selectedStatus;

      return matchesSearch && matchesDomain && matchesStatus;
    });
  }, [searchTerm, selectedDomain, selectedStatus]);

  // Compute summary stats
  const totalCount = MASTER_EVIDENCE_TABLE.length;
  const observedCount = MASTER_EVIDENCE_TABLE.filter(e => e.factStatus === 'OBSERVED').length;
  const inferredCount = MASTER_EVIDENCE_TABLE.filter(e => e.factStatus === 'INFERRED').length;
  const unknownCount = MASTER_EVIDENCE_TABLE.filter(e => e.factStatus === 'UNKNOWN').length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Editorial Header */}
      <div className="mb-6">
        <div className="text-xs text-slate-500 mb-1">
          <span>Primary Empirical Research</span>
          <span aria-hidden="true"> · </span>
          <span>Section 41 Deliverable</span>
          <span aria-hidden="true"> · </span>
          <span>SEC EDGAR & Primary Tax Authorities</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Master Empirical Evidence Ledger
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Chronological ledger documenting publicly observable SEC filings, regulatory disclosures, and statutory authorities.
          Every state transition is grounded in an explicit provenance mapping: 
          <code className="text-emerald-400 font-mono text-xs ml-1">Source → Fact → Rule → Transition → Output</code>.
        </p>
      </div>

      {/* Summary Metrics Bar - Unboxed Editorial Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800 mb-6">
        <div>
          <div className="text-xs text-slate-400">Total Documented Items</div>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">{totalCount}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Directly Observed (Tier 1/2)</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">{observedCount}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Inferred from Disclosures</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1 tabular-nums">{inferredCount}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Unknown / Boundary Fault</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1 tabular-nums">{unknownCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by fund, CIK, or fact..."
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Domain Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-md border border-slate-800 text-xs">
            <span className="text-slate-500 px-2 text-[11px]">Domain:</span>
            {['ALL', '§704(b)', '§704(c)', '§743(b)', '§754', 'OUTSIDE_INITIAL_DOMAIN'].map(d => (
              <button
                key={d}
                onClick={() => setSelectedDomain(d)}
                className={`px-2 py-1 rounded text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  selectedDomain === d
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d === 'OUTSIDE_INITIAL_DOMAIN' ? 'Outside Domain' : d}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-md border border-slate-800 text-xs">
            <span className="text-slate-500 px-2 text-[11px]">Status:</span>
            {['ALL', 'OBSERVED', 'INFERRED', 'UNKNOWN'].map(s => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedStatus === s
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0d1322]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium">
              <th className="py-2.5 px-3">Evidence ID</th>
              <th className="py-2.5 px-3">Fund / Adviser (CIK)</th>
              <th className="py-2.5 px-3">Filing Source</th>
              <th className="py-2.5 px-3">Valid Time (tv)</th>
              <th className="py-2.5 px-3">Record Time (tr)</th>
              <th className="py-2.5 px-3">Domain</th>
              <th className="py-2.5 px-3">Fact Status</th>
              <th className="py-2.5 px-3">Boundary</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredEvidence.map((item) => (
              <tr 
                key={item.evidenceId}
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-2.5 px-3 font-mono font-medium text-emerald-400 whitespace-nowrap">
                  {item.evidenceId}
                </td>
                <td className="py-2.5 px-3 text-slate-200 max-w-[220px] truncate" title={item.fundOrAdviser}>
                  {item.fundOrAdviser}
                </td>
                <td className="py-2.5 px-3 text-slate-400 max-w-[200px] truncate" title={item.sourceFiling}>
                  {item.sourceFiling}
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                  {item.effectiveDate}
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                  {item.filingDate}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`font-mono ${
                    item.pocDomain === 'OUTSIDE_INITIAL_DOMAIN' 
                      ? 'text-rose-400 font-semibold' 
                      : 'text-slate-300'
                  }`}>
                    {item.pocDomain}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`font-medium ${
                    item.factStatus === 'OBSERVED' 
                      ? 'text-emerald-400' 
                      : item.factStatus === 'INFERRED' 
                      ? 'text-amber-400' 
                      : 'text-rose-400'
                  }`}>
                    {item.factStatus}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`inline-flex items-center gap-1 ${
                    item.boundaryStatus === 'Closed' 
                      ? 'text-emerald-400' 
                      : item.boundaryStatus === 'Review' 
                      ? 'text-amber-400' 
                      : 'text-rose-400'
                  }`}>
                    {item.boundaryStatus === 'Closed' && <ShieldCheck className="w-3 h-3" />}
                    {item.boundaryStatus === 'Review' && <AlertCircle className="w-3 h-3" />}
                    {item.boundaryStatus === 'Reject' && <XCircle className="w-3 h-3" />}
                    <span>{item.boundaryStatus}</span>
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => setSelectedEvidence(item)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                  >
                    Provenance
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Provenance Detail Drawer */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-lg max-w-2xl w-full p-6 text-xs text-slate-300 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-emerald-400 font-bold text-sm">{selectedEvidence.evidenceId}</span>
                <span className="text-slate-400 ml-2">· Provenance & Bitemporal Mapping</span>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="text-slate-400 hover:text-white text-base px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-slate-500 font-semibold mb-1">Entity & Disclosure Source:</div>
              <div className="text-sm font-medium text-white">{selectedEvidence.fundOrAdviser}</div>
              <div className="text-slate-400 mt-0.5">{selectedEvidence.sourceFiling}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-900 rounded border border-slate-800">
              <div>
                <div className="text-slate-500 text-[11px]">Valid Time (tv - Effective):</div>
                <div className="font-mono text-white text-sm mt-0.5">{selectedEvidence.effectiveDate}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[11px]">Record Time (tr - Disclosure):</div>
                <div className="font-mono text-amber-400 text-sm mt-0.5">{selectedEvidence.filingDate}</div>
              </div>
            </div>

            <div>
              <div className="text-slate-500 font-semibold mb-1">Extracted Empirical Fact:</div>
              <div className="p-3 bg-slate-900/80 rounded border border-slate-800 text-slate-200 leading-relaxed">
                {selectedEvidence.extractedFact}
              </div>
            </div>

            <div>
              <div className="text-slate-500 font-semibold mb-1">Target Computational State Variable:</div>
              <div className="font-mono text-emerald-300 p-2 bg-slate-950 rounded border border-slate-800">
                {selectedEvidence.targetStateVariable}
              </div>
            </div>

            <div>
              <div className="text-slate-500 font-semibold mb-1">Formal Provenance Chain (Source → Fact → Rule → Transition → Output):</div>
              <div className="font-mono text-xs text-slate-300 p-3 bg-slate-950 rounded border border-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedEvidence.provenanceChain}
              </div>
            </div>

            {selectedEvidence.boundaryFaultReason && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded text-rose-300">
                <span className="font-semibold">Computational Boundary Reason: </span>
                <span>{selectedEvidence.boundaryFaultReason}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium cursor-pointer"
              >
                Close Provenance Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
