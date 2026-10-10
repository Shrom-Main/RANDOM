/**
 * POC 1 — Tax Lots & Book-to-Tax Schedule M-1 / M-3 Bridge
 *
 * Implements Section 19 & 20 of POC 1 Specification:
 * 1. Tax Lot Decomposition (holding periods, basis adjustments, wash sales, character)
 * 2. Book-to-Tax Reconciliation Bridge with clickable adjustment derivations
 */

import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { SYNTHETIC_ASSETS } from '../engine/synthetic-fund-data';
import { computeBookToTaxBridge } from '../engine/deterministic-tax-engine';
import { INITIAL_FUND_REGISTRY } from '../data/fund-registry-data';

interface TaxLotsAndBridgeViewProps {
  activeFundId?: string;
  onSelectFund?: (fundId: string) => void;
}

export const TaxLotsAndBridgeView: React.FC<TaxLotsAndBridgeViewProps> = ({
  activeFundId,
  onSelectFund
}) => {
  const currentFund = INITIAL_FUND_REGISTRY.find(f => f.id === activeFundId) || INITIAL_FUND_REGISTRY[0];
  const [selectedAssetId, setSelectedAssetId] = useState<string>(SYNTHETIC_ASSETS[0].id);
  const [selectedBridgeItemId, setSelectedBridgeItemId] = useState<string | null>('BRIDGE-03');

  // Interactive Book-to-Tax Bridge Inputs
  const [bookIncome, setBookIncome] = useState<number>(14500000);
  const [deprecBook, setDeprecBook] = useState<number>(3000000);
  const [deprecTax, setDeprecTax] = useState<number>(4200000);
  const [sec704cAdj, setSec704cAdj] = useState<number>(1800000);
  const [sec743bDeprec, setSec743bDeprec] = useState<number>(320000);
  const [sec163jEbie, setSec163jEbie] = useState<number>(1200000);
  const [pficQef, setPficQef] = useState<number>(450000);
  const [muniExclusion, setMuniExclusion] = useState<number>(250000);

  const bridgeResult = computeBookToTaxBridge({
    bookNetIncome: bookIncome,
    depreciationBook: deprecBook,
    depreciationTax: deprecTax,
    section704cAdjustment: sec704cAdj,
    section743bDepreciation: sec743bDeprec,
    section163jDisallowedEbie: sec163jEbie,
    pficQefUnrealizedInclusion: pficQef,
    municipalBondInterest: muniExclusion
  });

  const selectedAsset = SYNTHETIC_ASSETS.find(a => a.id === selectedAssetId) || SYNTHETIC_ASSETS[0];
  const selectedBridgeItem = bridgeResult.bridgeItems.find(b => b.id === selectedBridgeItemId) || bridgeResult.bridgeItems[2];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="ios-glass-card rounded-2xl p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Tax Lot Decomposition &amp; Book-to-Tax Bridge
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Section 19 &amp; 20 Spec
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Every investment decomposed into tax lots; every book-to-tax adjustment traceable to primary authority and workpapers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onSelectFund && (
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-zinc-300">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Fund:</span>
              <select
                value={currentFund.id}
                onChange={(e) => onSelectFund(e.target.value)}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs"
              >
                {INITIAL_FUND_REGISTRY.map(f => (
                  <option key={f.id} value={f.id} className="bg-zinc-900 text-white">
                    {f.code} — {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Schedule M-3:</span>
            <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              RECONCILED ($16.18M)
            </span>
          </div>
        </div>
      </div>

      {/* PART 1: TAX LOT DECOMPOSITION */}
      <div className="ios-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Investment Asset &amp; Tax Lot Decomposition
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select an asset to view holding lots, tax basis, §751 hot asset tags, and lot-level character.
            </p>
          </div>

          {/* Asset Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {SYNTHETIC_ASSETS.map(asset => (
              <button
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id)}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                  selectedAssetId === asset.id
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {asset.tickerOrSymbol}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Asset Header */}
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{selectedAsset.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                {selectedAsset.assetClass}
              </span>
              {selectedAsset.isSection751HotAsset && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  §751 HOT ASSET
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Holding Entity: <span className="font-mono text-zinc-300">{selectedAsset.holdingEntityId}</span> · Issuer: {selectedAsset.issuerName}
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 block">Total Fair Value</span>
              <span className="font-bold text-white">${(selectedAsset.currentFairValue / 1000000).toFixed(2)}M</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Total Tax Basis</span>
              <span className="font-bold text-cyan-400">${(selectedAsset.totalTaxBasis / 1000000).toFixed(2)}M</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Book Basis</span>
              <span className="font-bold text-purple-400">${(selectedAsset.totalBookBasis / 1000000).toFixed(2)}M</span>
            </div>
          </div>
        </div>

        {/* Tax Lots Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 font-mono text-[10px]">
                <th className="py-2 px-2">Lot ID</th>
                <th className="py-2 px-2">Acquisition Date</th>
                <th className="py-2 px-2 text-right">Cost Basis</th>
                <th className="py-2 px-2 text-right">Tax Basis</th>
                <th className="py-2 px-2 text-right">Current FMV</th>
                <th className="py-2 px-2 text-right">Unrealized Gain</th>
                <th className="py-2 px-2">Character</th>
                <th className="py-2 px-2">Provenance Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {selectedAsset.lots.map(lot => (
                <tr key={lot.lotId} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-2 font-mono text-zinc-300 font-bold">{lot.lotId}</td>
                  <td className="py-2 px-2 font-mono text-zinc-400">{lot.acquisitionDate} ({lot.holdingPeriodDays}d)</td>
                  <td className="py-2 px-2 font-mono text-right text-zinc-300">${lot.totalCostBasis.toLocaleString()}</td>
                  <td className="py-2 px-2 font-mono text-right text-cyan-400 font-bold">${lot.currentTaxBasis.toLocaleString()}</td>
                  <td className="py-2 px-2 font-mono text-right text-white font-bold">${lot.currentFairValue.toLocaleString()}</td>
                  <td className="py-2 px-2 font-mono text-right text-emerald-400 font-bold">+${lot.unrealizedGainLoss.toLocaleString()}</td>
                  <td className="py-2 px-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {lot.character}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-zinc-400 text-[11px] truncate max-w-xs">{lot.provenanceDocument}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PART 2: BOOK-TO-TAX SCHEDULE M-1 / M-3 BRIDGE */}
      <div className="ios-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Interactive Book-to-Tax Schedule M-1 / M-3 Reconciliation Bridge
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Click any bridge item to drill into its underlying statutory authority, tax timing, and workpaper document.
            </p>
          </div>
        </div>

        {/* Bridge Summary Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-black/50 rounded-xl border border-white/10 text-xs">
            <span className="text-zinc-400 text-[10px] uppercase font-mono block">GAAP Book Net Income</span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              ${bridgeResult.bookNetIncome.toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Financial Accounting Profit</span>
          </div>

          <div className="p-3 bg-black/50 rounded-xl border border-white/10 text-xs">
            <span className="text-zinc-400 text-[10px] uppercase font-mono block">Total Net Tax Adjustments</span>
            <div className={`text-lg font-bold font-mono mt-1 ${bridgeResult.totalAdjustments >= 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {bridgeResult.totalAdjustments >= 0 ? '+' : ''}${bridgeResult.totalAdjustments.toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Schedule M-3 Line 11 Total</span>
          </div>

          <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-500/30 text-xs">
            <span className="text-emerald-300 text-[10px] uppercase font-mono block">Reconciled Taxable Income</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              ${bridgeResult.taxableIncome.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400/70 font-mono">Form 1065 Line 22 / Schedule K Line 1</span>
          </div>
        </div>

        {/* Bridge Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 font-mono text-[10px]">
                <th className="py-2 px-2">Item ID</th>
                <th className="py-2 px-2">Adjustment Line</th>
                <th className="py-2 px-2">Type</th>
                <th className="py-2 px-2 text-right">Book Amount</th>
                <th className="py-2 px-2 text-right">Tax Amount</th>
                <th className="py-2 px-2 text-right">Net Adjustment</th>
                <th className="py-2 px-2">Statute / Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {bridgeResult.bridgeItems.map(item => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedBridgeItemId(item.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedBridgeItemId === item.id ? 'bg-cyan-950/30 border-l-2 border-cyan-400' : 'hover:bg-white/5'
                  }`}
                >
                  <td className="py-2 px-2 font-mono text-zinc-400">{item.id}</td>
                  <td className="py-2 px-2 font-medium text-white">{item.label}</td>
                  <td className="py-2 px-2">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      item.isPermanent ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {item.isPermanent ? 'PERMANENT' : 'TEMPORARY'}
                    </span>
                  </td>
                  <td className="py-2 px-2 font-mono text-right text-zinc-300">${item.bookAmount.toLocaleString()}</td>
                  <td className="py-2 px-2 font-mono text-right text-zinc-300">${item.taxAmount.toLocaleString()}</td>
                  <td className={`py-2 px-2 font-mono text-right font-bold ${
                    item.adjustmentAmount >= 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {item.adjustmentAmount >= 0 ? '+' : ''}${item.adjustmentAmount.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 font-mono text-[11px] text-zinc-400">{item.governingCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Line Item Drilldown Inspector */}
        {selectedBridgeItem && (
          <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{selectedBridgeItem.label}</span>
              <span className="font-mono text-cyan-300 text-xs">
                Adjustment: ${selectedBridgeItem.adjustmentAmount.toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px]">
              <div>
                <span className="text-zinc-500 block font-mono">Governing Authority:</span>
                <span className="text-zinc-200 font-mono">{selectedBridgeItem.governingCode}</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-mono">Source Workpaper:</span>
                <span className="text-zinc-200">{selectedBridgeItem.underlyingDocument}</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-mono">Tax Character &amp; Timing:</span>
                <span className="text-zinc-200">{selectedBridgeItem.isPermanent ? 'Permanent Difference' : 'Timing Disparity (Reversing)'}</span>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
