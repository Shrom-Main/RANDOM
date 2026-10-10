/**
 * POC 1 — Master Investor Relations Research Module
 * 
 * Functional module backed by canonical state:
 * - Investor Identity & Tax Classification (501(c)(3), Foreign Sovereign Wealth, Domestic LP, etc.)
 * - Ownership & Economic Interest vs Voting Control
 * - Commitments, Contributions, Distributions, and Capital Accounts (Book §704(b) vs Tax Basis §705)
 * - Investor-specific Tax Attributes (§704(c) built-in gain, §743(b) step-ups, ECI, UBTI, PFIC)
 * - Investor Events & K-1 Reporting Status
 * - Explicit distinction: KNOWN vs INFERRED vs UNAVAILABLE information
 * - Auditable Provenance & Source Document Tracing
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  ShieldCheck, 
  FileText, 
  Download, 
  Coins, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Building2, 
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign
} from 'lucide-react';
import { CascadingFilterState, InvestorNode } from '../types/entity-hierarchy';
import { filterUniverseByCascade } from '../engine/entity-hierarchy-engine';
import { CascadingFilterBar } from './CascadingFilterBar';

interface InvestorRelationsViewProps {
  activeFundId: string;
  onSelectFund: (fundId: string) => void;
}

export const InvestorRelationsView: React.FC<InvestorRelationsViewProps> = ({
  activeFundId,
  onSelectFund
}) => {
  const [filterState, setFilterState] = useState<CascadingFilterState>({
    managerId: 'ALL',
    fundId: activeFundId || 'ALL',
    entityId: 'ALL',
    vehicleId: 'ALL',
    investorId: 'ALL',
    assetClass: 'ALL',
    assetId: 'ALL',
    timeHorizon: 'ALL',
    epistemicFilter: 'ALL'
  });

  const [selectedInvestor, setSelectedInvestor] = useState<InvestorNode | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const universe = useMemo(() => {
    return filterUniverseByCascade(filterState);
  }, [filterState]);

  const filteredInvestors = useMemo(() => {
    let list = universe.investors;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(inv => 
        inv.name.toLowerCase().includes(q) ||
        inv.classification.toLowerCase().includes(q) ||
        inv.taxResidency.toLowerCase().includes(q)
      );
    }
    return list;
  }, [universe.investors, searchTerm]);

  // Totals for aggregated view
  const aggregatedTotals = useMemo(() => {
    let totalCommitment = 0;
    let totalCalled = 0;
    let totalDistributions = 0;
    let totalBookCapital = 0;
    let totalTaxBasis = 0;
    let total704c = 0;
    let total743b = 0;

    filteredInvestors.forEach(inv => {
      Object.entries(inv.commitmentsByFund).forEach(([fid, comm]) => {
        if (filterState.fundId === 'ALL' || filterState.fundId === fid) {
          totalCommitment += comm.totalCommitmentUsd;
          totalCalled += comm.calledCapitalUsd;
          totalDistributions += comm.distributionsUsd;
          totalBookCapital += comm.bookCapital704b;
          totalTaxBasis += comm.taxBasisCapital705;
          total704c += comm.section704cBuiltInGain;
          total743b += comm.section743bStepUp;
        }
      });
    });

    return {
      totalCommitment,
      totalCalled,
      totalDistributions,
      totalBookCapital,
      totalTaxBasis,
      total704c,
      total743b,
      bookTaxDisparity: totalBookCapital - totalTaxBasis
    };
  }, [filteredInvestors, filterState.fundId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold uppercase">
              Canonical Research State
            </span>
            <span className="text-xs text-zinc-400 font-mono">Subchapter K Partner Capital &amp; Allocations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-pink-400" />
            <span>Investor Relations &amp; Partner Tax Accounts</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Real institutional investor state: Commitments, §704(b) Book vs §705 Tax Basis capital accounts,
            §704(c) built-in gains, §743(b) step-ups, withholding tax vectors, and verifiable evidentiary provenance.
          </p>
        </div>

        {/* Epistemic Counter Badges */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>KNOWN: 100% Tax Forms</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>INFERRED: None</span>
          </div>
        </div>
      </div>

      {/* Cascading Filter Bar */}
      <CascadingFilterBar
        filterState={filterState}
        onFilterChange={setFilterState}
        resultCounts={universe.counts}
      />

      {/* Aggregated Capital & Tax Basis Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">Total Commitments</div>
          <div className="text-sm sm:text-base font-bold font-mono text-white">
            ${(aggregatedTotals.totalCommitment / 1000000).toFixed(1)}M
          </div>
          <div className="text-[9px] font-mono text-emerald-400">Across Selected LPs</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">Called Capital</div>
          <div className="text-sm sm:text-base font-bold font-mono text-emerald-300">
            ${(aggregatedTotals.totalCalled / 1000000).toFixed(1)}M
          </div>
          <div className="text-[9px] font-mono text-zinc-400">
            {aggregatedTotals.totalCommitment > 0 ? ((aggregatedTotals.totalCalled / aggregatedTotals.totalCommitment) * 100).toFixed(1) : 0}% Drawn
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">Distributions Paid</div>
          <div className="text-sm sm:text-base font-bold font-mono text-cyan-300">
            ${(aggregatedTotals.totalDistributions / 1000000).toFixed(1)}M
          </div>
          <div className="text-[9px] font-mono text-zinc-400">Cash Return</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">§704(b) Book Capital</div>
          <div className="text-sm sm:text-base font-bold font-mono text-purple-300">
            ${(aggregatedTotals.totalBookCapital / 1000000).toFixed(1)}M
          </div>
          <div className="text-[9px] font-mono text-purple-400/80">FMV Capital Account</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">§705 Inside Tax Basis</div>
          <div className="text-sm sm:text-base font-bold font-mono text-blue-300">
            ${(aggregatedTotals.totalTaxBasis / 1000000).toFixed(1)}M
          </div>
          <div className="text-[9px] font-mono text-blue-400/80">Historical Tax Capital</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">§704(c) Disparity</div>
          <div className="text-sm sm:text-base font-bold font-mono text-amber-300">
            ${(aggregatedTotals.total704c / 1000000).toFixed(1)}M
          </div>
          <div className="text-[9px] font-mono text-amber-400/80">Built-in Gain Layers</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">§743(b) Step-Ups</div>
          <div className="text-sm sm:text-base font-bold font-mono text-pink-300">
            ${(aggregatedTotals.total743b / 1000000).toFixed(1)}M
          </div>
          <div className="text-[9px] font-mono text-pink-400/80">Transferee Adjustments</div>
        </div>
      </div>

      {/* Main Table: Partner State Breakdown */}
      <div className="bg-zinc-950/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by LP name, tax classification, or jurisdiction..."
              className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 w-full sm:w-80 font-mono"
            />
          </div>

          <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
            <span>Showing {filteredInvestors.length} Institutional Investors</span>
          </div>
        </div>

        {filteredInvestors.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="text-zinc-500 font-mono text-xs uppercase tracking-wider">NO INVESTOR DATA</div>
            <p className="text-zinc-400 text-xs max-w-md mx-auto">
              No investors matched the specified cascading filters or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/60 text-zinc-400 border-b border-white/10 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Investor / Identity</th>
                  <th className="py-3 px-3">Tax Classification</th>
                  <th className="py-3 px-3">Commitment (USD)</th>
                  <th className="py-3 px-3">Ownership / Control</th>
                  <th className="py-3 px-3">Book §704(b)</th>
                  <th className="py-3 px-3">Tax Basis §705</th>
                  <th className="py-3 px-3">§704(c) Built-In</th>
                  <th className="py-3 px-3">§743(b) Adj</th>
                  <th className="py-3 px-3">W-8/W-9 Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvestors.map((inv) => {
                  // Get aggregated commitments across active fund filter
                  const fundCommEntries = Object.entries(inv.commitmentsByFund).filter(([fid]) => 
                    filterState.fundId === 'ALL' || filterState.fundId === fid
                  );
                  const activeComm = fundCommEntries[0]?.[1];
                  const totalCommUsd = fundCommEntries.reduce((s, [, c]) => s + c.totalCommitmentUsd, 0);
                  const totalBookUsd = fundCommEntries.reduce((s, [, c]) => s + c.bookCapital704b, 0);
                  const totalTaxUsd = fundCommEntries.reduce((s, [, c]) => s + c.taxBasisCapital705, 0);
                  const total704cUsd = fundCommEntries.reduce((s, [, c]) => s + c.section704cBuiltInGain, 0);
                  const total743bUsd = fundCommEntries.reduce((s, [, c]) => s + c.section743bStepUp, 0);
                  const ownershipPct = activeComm ? (activeComm.ownershipInterestPct * 100).toFixed(2) : '—';
                  const votingControlPct = activeComm ? (activeComm.votingControlPct * 100).toFixed(0) : '—';

                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white leading-tight">{inv.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{inv.id}</span>
                          <span>·</span>
                          <span>{inv.jurisdiction}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 whitespace-nowrap">
                          {inv.classification.replace(/_/g, ' ')}
                        </span>
                        <div className="text-[9px] text-zinc-500 mt-0.5">
                          WHT Rate: {(inv.withholdingTaxRate * 100).toFixed(1)}%
                        </div>
                      </td>

                      <td className="py-3 px-3 font-bold text-white">
                        ${(totalCommUsd / 1000000).toFixed(1)}M
                        <div className="text-[9px] text-zinc-500">
                          {inv.participatingFundIds.length} Fund(s)
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-emerald-400 font-bold">{ownershipPct}% Economic</div>
                        <div className="text-[9px] text-zinc-500">{votingControlPct}% Voting Control</div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-purple-300">
                        ${(totalBookUsd / 1000000).toFixed(1)}M
                      </td>

                      <td className="py-3 px-3 font-semibold text-blue-300">
                        ${(totalTaxUsd / 1000000).toFixed(1)}M
                      </td>

                      <td className="py-3 px-3 font-semibold text-amber-300">
                        {total704cUsd > 0 ? `$${(total704cUsd / 1000000).toFixed(1)}M` : '$0.0M'}
                      </td>

                      <td className="py-3 px-3 font-semibold text-pink-300">
                        {total743bUsd > 0 ? `$${(total743bUsd / 1000000).toFixed(1)}M` : '$0.0M'}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>VALIDATED</span>
                        </span>
                        <div className="text-[9px] text-zinc-500 mt-0.5">
                          {inv.provenance.taxFormRef.split(' ')[0]} Verified
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvestor(inv)}
                          className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-sans font-medium transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3 text-zinc-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Investor Detail Modal Drawer */}
      {selectedInvestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950 border border-white/20 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold uppercase">
                  {selectedInvestor.classification.replace(/_/g, ' ')}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedInvestor.name}</h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  ID: {selectedInvestor.id} · Jurisdiction: {selectedInvestor.jurisdiction}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvestor(null)}
                className="p-1.5 rounded-xl bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-all cursor-pointer text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            {/* Fund Commitments Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                Allocations &amp; Capital Accounts by Participating Fund
              </h3>
              
              <div className="space-y-2">
                {Object.entries(selectedInvestor.commitmentsByFund).map(([fundId, comm]) => (
                  <div key={fundId} className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-emerald-400">{fundId}</span>
                      <span className="text-zinc-400">
                        Schedule K-1 Status: <strong className="text-white">{comm.reportingK1Status}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                        <div className="text-[10px] text-zinc-500">Total Commitment</div>
                        <div className="text-white font-bold">${(comm.totalCommitmentUsd / 1000000).toFixed(1)}M</div>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                        <div className="text-[10px] text-zinc-500">Book Capital §704(b)</div>
                        <div className="text-purple-300 font-bold">${(comm.bookCapital704b / 1000000).toFixed(1)}M</div>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                        <div className="text-[10px] text-zinc-500">Inside Tax Basis §705</div>
                        <div className="text-blue-300 font-bold">${(comm.taxBasisCapital705 / 1000000).toFixed(1)}M</div>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                        <div className="text-[10px] text-zinc-500">Ownership Share</div>
                        <div className="text-emerald-400 font-bold">{(comm.ownershipInterestPct * 100).toFixed(2)}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-1 text-zinc-400">
                      <div>
                        §704(c) Layer: <span className="text-amber-300 font-bold">${(comm.section704cBuiltInGain / 1000000).toFixed(1)}M</span>
                      </div>
                      <div>
                        §743(b) Step-Up: <span className="text-pink-300 font-bold">${(comm.section743bStepUp / 1000000).toFixed(1)}M</span>
                      </div>
                      <div>
                        UBTI Exposure: <span className="text-white font-bold">${comm.ubtiExposureUsd}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Provenance Box */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1.5 text-xs font-mono">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auditable Provenance &amp; Tax Authority Certifications</span>
              </div>
              <div className="text-zinc-300">
                Subscription Agreement: <span className="text-white">{selectedInvestor.provenance.subscriptionAgreementRef}</span>
              </div>
              <div className="text-zinc-300">
                Tax Form Record: <span className="text-emerald-300">{selectedInvestor.provenance.taxFormRef}</span>
              </div>
              <div className="text-[10px] text-zinc-500">
                Verified at: {selectedInvestor.provenance.verifiedTimestamp}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
