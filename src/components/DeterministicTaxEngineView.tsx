/**
 * POC 1 — Deterministic Tax Engine Interactive Suite
 *
 * Implements interactive, testable calculation modules:
 * 1. § 704(c) Layer Engine with Ceiling Rule Demonstration (Traditional, Curative, Remedial)
 * 2. § 754 -> § 743(b) -> § 755 Transferee Basis Step-Up Engine
 * 3. § 751 Hot Assets & Character Preservation Engine
 * 4. § 163(j) Entity-Aware Business Interest Limitation Engine
 */

import React, { useState } from 'react';
import {
  Calculator,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { INITIAL_FUND_REGISTRY } from '../data/fund-registry-data';
import { MathView } from './MathView';
import {
  computeSection704cLayer,
  computeSection743bStepUp,
  computeSection751HotAssets,
  computeSection163jLimitation
} from '../engine/deterministic-tax-engine';

interface DeterministicTaxEngineViewProps {
  activeFundId?: string;
  onSelectFund?: (fundId: string) => void;
}

export const DeterministicTaxEngineView: React.FC<DeterministicTaxEngineViewProps> = ({
  activeFundId = INITIAL_FUND_REGISTRY[0].id,
  onSelectFund
}) => {
  const [activeEngine, setActiveEngine] = useState<'704C' | '743B' | '751' | '163J'>('704C');

  const activeFund = React.useMemo(() => {
    return INITIAL_FUND_REGISTRY.find(f => f.id === activeFundId) || INITIAL_FUND_REGISTRY[0];
  }, [activeFundId]);

  // State for § 704(c) Calculator
  const [bookValueContrib, setBookValueContrib] = useState<number>(30000000);
  const [taxBasisContrib, setTaxBasisContrib] = useState<number>(12000000);
  const [annualBookDeprec, setAnnualBookDeprec] = useState<number>(3000000);
  const [actualTaxDeprecAvailable, setActualTaxDeprecAvailable] = useState<number>(1200000);
  const [method704c, setMethod704c] = useState<'TRADITIONAL' | 'CURATIVE' | 'REMEDIAL'>(
    activeFund.section_704c_method || 'TRADITIONAL'
  );

  // State for § 743(b) Calculator
  const [transfereeOutsideBasis, setTransfereeOutsideBasis] = useState<number>(10000000);
  const [transfereeInsideShare, setTransfereeInsideShare] = useState<number>(4000000);
  const [is754Active, setIs754Active] = useState<boolean>(activeFund.section_754_elected);
  const [capitalAssetRatio, setCapitalAssetRatio] = useState<number>(0.80);

  // Sync with active fund when activeFundId changes
  React.useEffect(() => {
    setMethod704c(activeFund.section_704c_method);
    setIs754Active(activeFund.section_754_elected);

    if (activeFund.assets && activeFund.assets.length > 0) {
      const primaryAsset = activeFund.assets[0];
      setBookValueContrib(primaryAsset.book_value);
      setTaxBasisContrib(primaryAsset.tax_basis);
      setAnnualBookDeprec(Math.round(primaryAsset.book_value * 0.1));
      setActualTaxDeprecAvailable(Math.round(primaryAsset.tax_basis * 0.1));
    }
  }, [activeFund]);

  // State for § 751 Calculator
  const [salePrice, setSalePrice] = useState<number>(15000000);
  const [transferredBasis, setTransferredBasis] = useState<number>(8000000);
  const [recFmv, setRecFmv] = useState<number>(3500000);
  const [recBasis, setRecBasis] = useState<number>(500000);
  const [invFmv, setInvFmv] = useState<number>(2500000);
  const [invBasis, setInvBasis] = useState<number>(1000000);

  // State for § 163(j) Calculator
  const [interestExpense, setInterestExpense] = useState<number>(4500000);
  const [interestIncome, setInterestIncome] = useState<number>(500000);
  const [ati, setAti] = useState<number>(8000000);

  // Computed results
  const res704c = computeSection704cLayer({
    layerId: 'LAYER-DEMO-01',
    propertyId: 'ASSET-PROP-01',
    contributingPartnerId: 'PARTNER-A',
    contributedDate: '2021-04-10',
    bookValueAtContribution: bookValueContrib,
    taxBasisAtContribution: taxBasisContrib,
    allocationMethod: method704c,
    annualBookDepreciation: annualBookDeprec,
    actualTaxDepreciationAvailable: actualTaxDeprecAvailable,
    nonContributingBookSharePct: 0.50
  });

  const res743b = computeSection743bStepUp({
    transferEventId: 'EVT-TRANSFER-01',
    transfereePartnerId: 'PARTNER-SUCCESSOR',
    transferorPartnerId: 'PARTNER-TRANSFEROR',
    effectiveDate: '2023-06-15',
    transferReason: 'PURCHASE_SALE',
    outsideBasisPriceOrFmv: transfereeOutsideBasis,
    transfereeShareOfInsideBasis: transfereeInsideShare,
    isSection754InEffect: is754Active,
    capitalAssetFmvDisparityPct: capitalAssetRatio,
    usefulLifeYears: 15
  });

  const res751 = computeSection751HotAssets({
    salePriceOfPartnershipInterest: salePrice,
    totalTransferredOutsideBasis: transferredBasis,
    partnerShareOfUnrealizedReceivablesFmv: recFmv,
    partnerShareOfUnrealizedReceivablesTaxBasis: recBasis,
    partnerShareOfInventoryFmv: invFmv,
    partnerShareOfInventoryTaxBasis: invBasis
  });

  const res163j = computeSection163jLimitation({
    entityId: 'ENT-OP-PARTNERSHIP-01',
    taxYear: 2024,
    businessInterestExpense: interestExpense,
    businessInterestIncome: interestIncome,
    adjustedTaxableIncomeAti: ati,
    partnerAllocations: [
      { partnerId: 'US_LP', sharePct: 0.50 },
      { partnerId: 'FEEDER_LP', sharePct: 0.35 },
      { partnerId: 'GP', sharePct: 0.15 }
    ]
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="ios-glass-card rounded-2xl p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-sm">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Deterministic Investment Tax Calculators
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  Pure Statutory Math
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Exact mathematical implementations of IRC § 704(c), § 743(b), § 751 hot assets, and § 163(j) limitations.
              </p>
              <div className="flex items-center gap-2 mt-2 font-mono text-[11px]">
                <span className="text-zinc-500">Canonical Fund:</span>
                <select
                  value={activeFund.id}
                  onChange={(e) => onSelectFund && onSelectFund(e.target.value)}
                  className="bg-zinc-900 border border-emerald-500/40 text-emerald-300 rounded px-2 py-0.5 focus:outline-none cursor-pointer"
                >
                  {INITIAL_FUND_REGISTRY.map(f => (
                    <option key={f.id} value={f.id} className="bg-zinc-950 text-white">
                      {f.code} · {f.name}
                    </option>
                  ))}
                </select>
                <span className="text-zinc-400">§704(c): <strong className="text-white">{activeFund.section_704c_method}</strong></span>
                <span className="text-zinc-400">§754: <strong className={activeFund.section_754_elected ? "text-emerald-400" : "text-zinc-500"}>{activeFund.section_754_elected ? 'Active' : 'No'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Engine Switcher */}
        <div className="flex items-center ios-segmented-control text-xs p-1">
          <button
            onClick={() => setActiveEngine('704C')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeEngine === '704C' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            § 704(c) Ceiling Rule
          </button>
          <button
            onClick={() => setActiveEngine('743B')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeEngine === '743B' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            § 743(b) / § 755 Step-Up
          </button>
          <button
            onClick={() => setActiveEngine('751')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeEngine === '751' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            § 751 Hot Assets
          </button>
          <button
            onClick={() => setActiveEngine('163J')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeEngine === '163J' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            § 163(j) Interest Cap
          </button>
        </div>
      </div>

      {/* 1. SECTION 704(c) CEILING RULE CALCULATOR */}
      {activeEngine === '704C' && (
        <div className="ios-glass-card rounded-2xl p-6 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-blue-400">IRC § 704(c) &amp; Treas. Reg. § 1.704-3</span>
              <h2 className="text-lg font-bold text-white mt-1">Section 704(c) Built-In Gain &amp; Ceiling Rule Distortion Model</h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                Proves the ceiling rule: When available tax depreciation is less than the non-contributing partner’s book allocation, the traditional method creates an artificial tax distortion.
              </p>
            </div>

            {/* Method Toggle */}
            <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-white/10 text-xs">
              {(['TRADITIONAL', 'CURATIVE', 'REMEDIAL'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMethod704c(m)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    method704c === m ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Input Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Property Book Value at Contribution:</span>
                <span className="font-mono text-emerald-400 font-bold">${(bookValueContrib / 1000000).toFixed(1)}M</span>
              </div>
              <input
                type="range"
                min="10000000"
                max="50000000"
                step="1000000"
                value={bookValueContrib}
                onChange={(e) => setBookValueContrib(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Historical Tax Basis at Contribution:</span>
                <span className="font-mono text-cyan-400 font-bold">${(taxBasisContrib / 1000000).toFixed(1)}M</span>
              </div>
              <input
                type="range"
                min="2000000"
                max="30000000"
                step="500000"
                value={taxBasisContrib}
                onChange={(e) => setTaxBasisContrib(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Annual Book Depreciation:</span>
                <span className="font-mono text-purple-400 font-bold">${(annualBookDeprec / 1000000).toFixed(2)}M</span>
              </div>
              <input
                type="range"
                min="1000000"
                max="6000000"
                step="250000"
                value={annualBookDeprec}
                onChange={(e) => setAnnualBookDeprec(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Actual Tax Depreciation Available:</span>
                <span className="font-mono text-amber-400 font-bold">${(actualTaxDeprecAvailable / 1000000).toFixed(2)}M</span>
              </div>
              <input
                type="range"
                min="200000"
                max="4000000"
                step="100000"
                value={actualTaxDeprecAvailable}
                onChange={(e) => setActualTaxDeprecAvailable(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Allocation Breakdown Table */}
          <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Method Results: {method704c} Allocation Mechanics
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block">Built-In Gain Layer</span>
                <span className="text-base font-bold font-mono text-white">
                  ${(res704c.builtInGainLoss / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block">Non-Contrib Book Deprec</span>
                <span className="text-base font-bold font-mono text-blue-300">
                  ${(res704c.nonContributingBookAllocation / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block">Non-Contrib Tax Deprec</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  ${(res704c.nonContributingTaxAllocation / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block">Ceiling Distortion</span>
                <span className={`text-base font-bold font-mono ${res704c.ceilingRuleDistortionAmount > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                  ${(res704c.ceilingRuleDistortionAmount / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>

            {/* Ceiling Rule Alert Banner */}
            {res704c.ceilingRuleDistortionAmount > 0 && method704c === 'TRADITIONAL' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Ceiling Rule Active:</strong> Actual tax depreciation (${(res704c.actualTaxDepreciationAvailable / 1000000).toFixed(2)}M) is insufficient to match non-contributing partner book depreciation (${(res704c.nonContributingBookAllocation / 1000000).toFixed(2)}M). The traditional method distorts partner tax capital accounts. Switch to <strong>Curative</strong> or <strong>Remedial</strong> to eliminate disparity.
                </div>
              </div>
            )}

            {method704c === 'REMEDIAL' && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Remedial Method Applied:</strong> Created notional tax deduction of ${(res704c.remedialNotionalDeduction / 1000000).toFixed(2)}M for non-contributing partner and offsetting taxable gain of ${(res704c.remedialNotionalGain / 1000000).toFixed(2)}M for contributing partner under Treas. Reg. § 1.704-3(d). Zero ceiling distortion remains.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SECTION 743(b) / SECTION 755 STEP-UP CALCULATOR */}
      {activeEngine === '743B' && (
        <div className="ios-glass-card rounded-2xl p-6 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-blue-400">IRC § 743(b), § 754 &amp; § 755</span>
              <h2 className="text-lg font-bold text-white mt-1">Section 743(b) Transferee Special Basis Adjustment</h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                Calculates the transferee-specific basis adjustment following a sale or partner death (§1014), and allocates across ordinary and capital asset classes under § 755.
              </p>
            </div>

            <button
              onClick={() => setIs754Active(!is754Active)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                is754Active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40'
              }`}
            >
              §754 Election: {is754Active ? 'ELECTED' : 'NOT IN EFFECT'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Transferee Outside Basis:</span>
                <span className="font-mono text-emerald-400 font-bold">${(transfereeOutsideBasis / 1000000).toFixed(2)}M</span>
              </div>
              <input
                type="range"
                min="4000000"
                max="25000000"
                step="500000"
                value={transfereeOutsideBasis}
                onChange={(e) => setTransfereeOutsideBasis(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Share of Inside Tax Basis:</span>
                <span className="font-mono text-cyan-400 font-bold">${(transfereeInsideShare / 1000000).toFixed(2)}M</span>
              </div>
              <input
                type="range"
                min="1000000"
                max="15000000"
                step="500000"
                value={transfereeInsideShare}
                onChange={(e) => setTransfereeInsideShare(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Capital Asset Ratio (§755):</span>
                <span className="font-mono text-purple-400 font-bold">{(capitalAssetRatio * 100).toFixed(0)}% Cap / {((1 - capitalAssetRatio) * 100).toFixed(0)}% Ord</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.95"
                step="0.05"
                value={capitalAssetRatio}
                onChange={(e) => setCapitalAssetRatio(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Adjustment &amp; Allocation Outputs</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block">Gross §743(b) Adjustment</span>
                <span className="text-base font-bold font-mono text-white">
                  ${(res743b.grossSection743bAdjustment / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block">§755 Capital Class</span>
                <span className="text-base font-bold font-mono text-purple-400">
                  ${(res743b.section755Allocation.capitalAssetPortion / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block">§755 Ordinary Class (§751)</span>
                <span className="text-base font-bold font-mono text-amber-400">
                  ${(res743b.section755Allocation.ordinaryAssetPortion / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block">Extra Deprec Deduction</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  ${res743b.annualPartnerSpecificDepreciation.toLocaleString()}/yr
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECTION 751 HOT ASSETS CALCULATOR */}
      {activeEngine === '751' && (
        <div className="ios-glass-card rounded-2xl p-6 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-blue-400">IRC § 751(a) Hot Assets</span>
              <h2 className="text-lg font-bold text-white mt-1">Section 751 Ordinary Income vs Capital Gain Separation</h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                Prevents conversion of ordinary income to capital gain upon partnership interest sale by carving out partner share of unrealized receivables &amp; inventory.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Total Partnership Interest Sale Price:</span>
                <span className="font-mono text-emerald-400 font-bold">${(salePrice / 1000000).toFixed(2)}M</span>
              </div>
              <input
                type="range"
                min="5000000"
                max="30000000"
                step="1000000"
                value={salePrice}
                onChange={(e) => setSalePrice(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Total Transferred Outside Tax Basis:</span>
                <span className="font-mono text-cyan-400 font-bold">${(transferredBasis / 1000000).toFixed(2)}M</span>
              </div>
              <input
                type="range"
                min="2000000"
                max="15000000"
                step="500000"
                value={transferredBasis}
                onChange={(e) => setTransferredBasis(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Character Breakdown (IRC § 751 vs § 741)</h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block">Total Economic Gain</span>
                <span className="text-base font-bold font-mono text-white">
                  ${(res751.totalGainLoss / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <span className="text-[10px] text-amber-300 block">§ 751(a) Ordinary Income</span>
                <span className="text-base font-bold font-mono text-amber-400">
                  ${(res751.ordinaryIncomeSection751 / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <span className="text-[10px] text-blue-300 block">Residual § 741 Capital Gain</span>
                <span className="text-base font-bold font-mono text-blue-400">
                  ${(res751.capitalGainLossResidual / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SECTION 163(j) INTEREST LIMITATION CALCULATOR */}
      {activeEngine === '163J' && (
        <div className="ios-glass-card rounded-2xl p-6 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-blue-400">IRC § 163(j) &amp; Treas. Reg. § 1.163(j)-6</span>
              <h2 className="text-lg font-bold text-white mt-1">Section 163(j) Business Interest Limitation &amp; EBIE</h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                Computes partnership-level business interest limitation (30% of ATI cap) and isolates disallowed Excess Business Interest Expense (EBIE) allocated to partners.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Business Interest Expense:</span>
                <span className="font-mono text-red-400 font-bold">${(interestExpense / 1000000).toFixed(2)}M</span>
              </div>
              <input
                type="range"
                min="1000000"
                max="10000000"
                step="250000"
                value={interestExpense}
                onChange={(e) => setInterestExpense(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Adjusted Taxable Income (ATI):</span>
                <span className="font-mono text-emerald-400 font-bold">${(ati / 1000000).toFixed(2)}M</span>
              </div>
              <input
                type="range"
                min="2000000"
                max="20000000"
                step="500000"
                value={ati}
                onChange={(e) => setAti(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Business Interest Income:</span>
                <span className="font-mono text-cyan-400 font-bold">${(interestIncome / 1000000).toFixed(2)}M</span>
              </div>
              <input
                type="range"
                min="0"
                max="3000000"
                step="100000"
                value={interestIncome}
                onChange={(e) => setInterestIncome(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Limitation &amp; EBIE Carryforward</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block">30% of ATI Cap</span>
                <span className="text-base font-bold font-mono text-white">
                  ${(res163j.atiLimit30Percent / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <span className="text-[10px] text-emerald-300 block">Allowable Interest Deduction</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  ${(res163j.allowableInterestDeduction / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <span className="text-[10px] text-red-300 block">Disallowed EBIE (K-1 Code AE)</span>
                <span className="text-base font-bold font-mono text-red-400">
                  ${(res163j.excessBusinessInterestExpenseEbie / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block">Tiered Pass-Through Capacity</span>
                <span className="text-base font-bold font-mono text-cyan-400">
                  ${(res163j.tieredPassThroughCapacity / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
