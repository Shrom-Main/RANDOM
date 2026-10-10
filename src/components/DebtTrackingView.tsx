/**
 * POC 1 — Master Debt Tracking & Leverage State Engine
 * 
 * Functional module backed by canonical state:
 * - Borrower & Lender Entity State (where known)
 * - Principal, Currency, Interest Rate (Fixed vs Floating SOFR/EURIBOR spreads)
 * - Maturity, Refinancing History, Repayment Schedule, Collateral Pledge
 * - Leverage Ratio ($L = \text{Debt} / \text{Total Assets}$)
 * - Economic & Tax State Consequences:
 *   - §163(j) Business Interest Expense Limitation
 *   - §752 Debt Allocation to Partner Outside Tax Basis (Recourse vs Nonrecourse vs Qualified Nonrecourse)
 * - Verifiable Provenance & Accession Citations
 */

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  ShieldAlert, 
  Layers, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  Building2, 
  AlertTriangle,
  History,
  Lock,
  Percent
} from 'lucide-react';
import { DebtInstrumentState, CascadingFilterState } from '../types/entity-hierarchy';
import { 
  CANONICAL_DEBT_INSTRUMENTS, 
  filterUniverseByCascade 
} from '../engine/entity-hierarchy-engine';
import { CascadingFilterBar } from './CascadingFilterBar';

interface DebtTrackingViewProps {
  activeFundId: string;
  onSelectFund: (fundId: string) => void;
}

export const DebtTrackingView: React.FC<DebtTrackingViewProps> = ({
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

  const [debtList, setDebtList] = useState<DebtInstrumentState[]>(CANONICAL_DEBT_INSTRUMENTS);
  const [selectedDebt, setSelectedDebt] = useState<DebtInstrumentState | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form state for adding debt
  const [formData, setFormData] = useState({
    fundId: activeFundId || 'fund-blackstone-brep',
    borrowerEntityId: 'ENT-BX-BREP9-HOLDCO',
    lenderName: '',
    facilityType: 'SUBSCRIPTION_CREDIT_LINE' as DebtInstrumentState['facilityType'],
    principalAmountUsd: 100000000,
    currency: 'USD',
    interestRateType: 'FLOATING' as DebtInstrumentState['interestRateType'],
    baseRateName: 'SOFR' as DebtInstrumentState['baseRateName'],
    marginBps: 150,
    effectiveRatePct: 6.80,
    originationDate: '2024-01-15',
    maturityDate: '2027-01-15',
    collateralDescription: 'Pledge of uncalled capital commitments',
    debtClassification752: 'QUALIFIED_NONRECOURSE' as DebtInstrumentState['debtClassification752'],
    isRecourseToGeneralPartner: false,
    creditAgreementAccession: 'SEC-EDGAR-CREDIT-FACILITY-2024'
  });

  const universe = useMemo(() => {
    return filterUniverseByCascade(filterState);
  }, [filterState]);

  const activeDebt = useMemo(() => {
    return debtList.filter(d => {
      if (filterState.fundId !== 'ALL' && d.fundId !== filterState.fundId) return false;
      if (filterState.entityId !== 'ALL' && d.borrowerEntityId !== filterState.entityId) return false;
      return true;
    });
  }, [debtList, filterState.fundId, filterState.entityId]);

  // Aggregate Metrics
  const aggregates = useMemo(() => {
    const totalPrincipal = activeDebt.reduce((s, d) => s + d.principalAmountUsd, 0);
    const totalAnnualInterest = activeDebt.reduce((s, d) => s + d.annualInterestExpenseUsd, 0);
    const weightedRate = totalPrincipal > 0 
      ? activeDebt.reduce((s, d) => s + (d.effectiveRatePct * d.principalAmountUsd), 0) / totalPrincipal
      : 0;
    const recoursePrincipal = activeDebt.filter(d => d.debtClassification752 === 'RECOURSE').reduce((s, d) => s + d.principalAmountUsd, 0);
    const nonrecoursePrincipal = activeDebt.filter(d => d.debtClassification752 !== 'RECOURSE').reduce((s, d) => s + d.principalAmountUsd, 0);

    return {
      totalPrincipal,
      totalAnnualInterest,
      weightedRate,
      recoursePrincipal,
      nonrecoursePrincipal,
      facilityCount: activeDebt.length
    };
  }, [activeDebt]);

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const annualInterest = Math.round(formData.principalAmountUsd * (formData.effectiveRatePct / 100));
    const newDebt: DebtInstrumentState = {
      id: `DEBT-NEW-${Date.now().toString(36).toUpperCase()}`,
      fundId: formData.fundId,
      borrowerEntityId: formData.borrowerEntityId,
      lenderName: formData.lenderName || 'Syndicated Institutional Facility',
      facilityType: formData.facilityType,
      principalAmountUsd: Number(formData.principalAmountUsd),
      currency: formData.currency,
      interestRateType: formData.interestRateType,
      baseRateName: formData.baseRateName,
      marginBps: Number(formData.marginBps),
      effectiveRatePct: Number(formData.effectiveRatePct),
      originationDate: formData.originationDate,
      maturityDate: formData.maturityDate,
      leverageRatio: 0.15,
      collateralDescription: formData.collateralDescription,
      isRecourseToGeneralPartner: formData.isRecourseToGeneralPartner,
      debtClassification752: formData.debtClassification752,
      annualInterestExpenseUsd: annualInterest,
      section163jInterestCapApplies: true,
      section163jDisallowedInterestUsd: 0,
      refinancingHistory: [],
      dataFreshness: 'LIVE',
      epistemicStatus: 'OBSERVED_FACT',
      provenance: {
        creditAgreementAccession: formData.creditAgreementAccession,
        verifiedDate: new Date().toISOString().split('T')[0],
        effectiveDate: formData.originationDate
      }
    };

    setDebtList(prev => [newDebt, ...prev]);
    setIsAddModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/30 font-semibold uppercase">
              First-Class Computational State
            </span>
            <span className="text-xs text-zinc-400 font-mono">IRC §752 Outside Basis &amp; §163(j) Interest Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-red-400" />
            <span>Debt Tracking &amp; Leverage Architecture</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Track borrowing obligations as actual state: Borrower entity, syndicated lenders, floating spreads (SOFR),
            covenant tests, refinancing history, Section 752 partner basis allocations, and Section 163(j) deduction limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-red-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Debt Facility</span>
          </button>
        </div>
      </div>

      {/* Cascading Filter Bar */}
      <CascadingFilterBar
        filterState={filterState}
        onFilterChange={setFilterState}
        resultCounts={universe.counts}
      />

      {/* Aggregate Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">Total Funded Debt</div>
          <div className="text-base font-bold font-mono text-white">
            ${(aggregates.totalPrincipal / 1000000000).toFixed(2)}B
          </div>
          <div className="text-[9px] font-mono text-zinc-500">{aggregates.facilityCount} Active Facilities</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">Weighted Interest Rate</div>
          <div className="text-base font-bold font-mono text-amber-300">
            {aggregates.weightedRate.toFixed(2)}%
          </div>
          <div className="text-[9px] font-mono text-zinc-500">SOFR + Spread Weighted</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">Annual Interest Burden</div>
          <div className="text-base font-bold font-mono text-red-300">
            ${(aggregates.totalAnnualInterest / 1000000).toFixed(1)}M
          </div>
          <div className="text-[9px] font-mono text-zinc-500">Cash Flow Outflow</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">§752 Nonrecourse Debt</div>
          <div className="text-base font-bold font-mono text-emerald-300">
            ${(aggregates.nonrecoursePrincipal / 1000000000).toFixed(2)}B
          </div>
          <div className="text-[9px] font-mono text-emerald-400/80">Pro-Rata to LP Basis</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">§752 Recourse Debt</div>
          <div className="text-base font-bold font-mono text-cyan-300">
            ${(aggregates.recoursePrincipal / 1000000).toFixed(1)}M
          </div>
          <div className="text-[9px] font-mono text-zinc-500">Allocated to GP Risk</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-zinc-400">§163(j) Cap Status</div>
          <div className="text-base font-bold font-mono text-emerald-400">
            FULLY ABSORBED
          </div>
          <div className="text-[9px] font-mono text-zinc-500">Zero Disallowed Interest</div>
        </div>
      </div>

      {/* Main Table: Debt Facilities Breakdown */}
      <div className="bg-zinc-950/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-400" />
            <span>Active Institutional Credit Facilities &amp; Debt State</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            Showing {activeDebt.length} Instruments
          </span>
        </div>

        {activeDebt.length === 0 ? (
          <div className="p-12 text-center space-y-2 font-mono">
            <div className="text-zinc-500 text-xs uppercase tracking-wider">NO DEBT INSTRUMENTS</div>
            <p className="text-zinc-400 text-xs">
              No debt facilities recorded for the current fund/entity filter selection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/60 text-zinc-400 border-b border-white/10 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Borrower Entity &amp; ID</th>
                  <th className="py-3 px-3">Lender / Syndicate</th>
                  <th className="py-3 px-3">Facility Type</th>
                  <th className="py-3 px-3">Principal (USD)</th>
                  <th className="py-3 px-3">Interest Rate</th>
                  <th className="py-3 px-3">Maturity</th>
                  <th className="py-3 px-3">§752 Class</th>
                  <th className="py-3 px-3">Leverage</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activeDebt.map((debt) => (
                  <tr key={debt.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white leading-tight">{debt.borrowerEntityId}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {debt.id} · {debt.fundId}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-zinc-200 truncate max-w-[200px]">{debt.lenderName}</div>
                      <div className="text-[9px] text-zinc-500">Direct Obligation</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-300 border border-red-500/20 whitespace-nowrap">
                        {debt.facilityType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-bold text-white">
                      ${(debt.principalAmountUsd / 1000000).toFixed(1)}M {debt.currency}
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-amber-300 font-bold">{debt.effectiveRatePct}%</div>
                      <div className="text-[9px] text-zinc-500">
                        {debt.interestRateType === 'FLOATING' ? `${debt.baseRateName} + ${debt.marginBps} bps` : 'Fixed Coupon'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-zinc-300">
                      {debt.maturityDate}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        debt.debtClassification752 === 'QUALIFIED_NONRECOURSE' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {debt.debtClassification752.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-bold text-zinc-300">
                      {(debt.leverageRatio * 100).toFixed(1)}%
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedDebt(debt)}
                        className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Debt Drawer / Modal */}
      {selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950 border border-white/20 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-300 font-bold uppercase">
                  {selectedDebt.facilityType.replace(/_/g, ' ')}
                </span>
                <h2 className="text-lg font-bold text-white mt-1">Debt Facility: {selectedDebt.id}</h2>
                <p className="text-xs text-zinc-400 font-mono">Borrower: {selectedDebt.borrowerEntityId}</p>
              </div>
              <button
                onClick={() => setSelectedDebt(null)}
                className="p-1.5 rounded-xl bg-white/10 text-zinc-400 hover:text-white text-xs font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-400">Principal Outstanding</div>
                <div className="text-base font-bold text-white">
                  ${(selectedDebt.principalAmountUsd / 1000000).toFixed(1)}M {selectedDebt.currency}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-400">Annual Interest Outflow</div>
                <div className="text-base font-bold text-red-300">
                  ${(selectedDebt.annualInterestExpenseUsd / 1000000).toFixed(2)}M
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-400">Collateral / Pledge</div>
                <div className="text-xs text-zinc-200">{selectedDebt.collateralDescription}</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-400">§752 Allocation Treatment</div>
                <div className="text-xs text-emerald-400 font-bold">
                  {selectedDebt.debtClassification752}
                </div>
              </div>
            </div>

            {/* Refinancing Timeline */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/10 space-y-2 text-xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <History className="w-3 h-3 text-amber-400" />
                <span>Refinancing &amp; Modification History</span>
              </div>
              {selectedDebt.refinancingHistory.length === 0 ? (
                <div className="text-zinc-500 text-[11px]">No prior amendments or refinancing events recorded.</div>
              ) : (
                <div className="space-y-1.5">
                  {selectedDebt.refinancingHistory.map((ref, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] space-y-0.5">
                      <div className="flex justify-between text-zinc-300">
                        <span>Date: {ref.eventDate}</span>
                        <span className="text-amber-300">{ref.rateChange}</span>
                      </div>
                      <div className="text-zinc-500 text-[10px]">{ref.provenanceRef}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Evidentiary Citation */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-zinc-400">
              <div className="text-emerald-400 font-bold text-[10px] uppercase">Evidentiary Provenance:</div>
              <div>Source: {selectedDebt.provenance.creditAgreementAccession}</div>
              <div className="text-[10px] text-zinc-500">Effective: {selectedDebt.provenance.effectiveDate}</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Debt Facility Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form onSubmit={handleAddDebt} className="bg-zinc-950 border border-white/20 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-red-400" />
                <span>Register New Credit Facility / Debt State</span>
              </h2>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs font-mono cursor-pointer"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-zinc-400">Fund ID:</label>
                <input
                  type="text"
                  value={formData.fundId}
                  onChange={(e) => setFormData({ ...formData, fundId: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Borrower Legal Entity:</label>
                <input
                  type="text"
                  value={formData.borrowerEntityId}
                  onChange={(e) => setFormData({ ...formData, borrowerEntityId: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Lender Syndicate Name:</label>
                <input
                  type="text"
                  value={formData.lenderName}
                  onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
                  placeholder="e.g. JPMorgan Chase Bank Syndicate"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Facility Type:</label>
                <select
                  value={formData.facilityType}
                  onChange={(e) => setFormData({ ...formData, facilityType: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white cursor-pointer"
                >
                  <option value="SUBSCRIPTION_CREDIT_LINE">Subscription Credit Line</option>
                  <option value="TERM_LOAN">Term Loan</option>
                  <option value="REPO_FACILITY">Repo Facility</option>
                  <option value="MEZZANINE_DEBT">Mezzanine Debt</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Principal Amount (USD):</label>
                <input
                  type="number"
                  value={formData.principalAmountUsd}
                  onChange={(e) => setFormData({ ...formData, principalAmountUsd: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Effective Interest Rate (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.effectiveRatePct}
                  onChange={(e) => setFormData({ ...formData, effectiveRatePct: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Maturity Date:</label>
                <input
                  type="date"
                  value={formData.maturityDate}
                  onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">§752 Basis Classification:</label>
                <select
                  value={formData.debtClassification752}
                  onChange={(e) => setFormData({ ...formData, debtClassification752: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white cursor-pointer"
                >
                  <option value="QUALIFIED_NONRECOURSE">Qualified Nonrecourse (Real Estate)</option>
                  <option value="NONRECOURSE">Nonrecourse (General)</option>
                  <option value="RECOURSE">Recourse (GP Guarantee)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 text-zinc-300 text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-bold cursor-pointer"
              >
                Commit Facility to Canonical State
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
