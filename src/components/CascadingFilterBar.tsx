/**
 * POC 1 — Cascading Entity Filter Bar
 * 
 * Implements the fundamental filtering dimension:
 * Manager → Fund → Entity → Vehicle → Investor → Asset Class → Asset → Epistemic Status
 * 
 * Changing any filter updates the actual queried dataset, not merely displayed cards.
 */

import React from 'react';
import { Filter, RotateCcw, Building2, Layers, Briefcase, Users, Coins, Eye } from 'lucide-react';
import { CascadingFilterState } from '../types/entity-hierarchy';
import { 
  CANONICAL_ORGANISATIONS, 
  CANONICAL_LEGAL_ENTITIES, 
  CANONICAL_VEHICLES, 
  CANONICAL_INVESTORS 
} from '../engine/entity-hierarchy-engine';
import { fundRegistryStore } from '../engine/fund-registry-store';

interface CascadingFilterBarProps {
  filterState: CascadingFilterState;
  onFilterChange: (newFilters: CascadingFilterState) => void;
  resultCounts?: {
    organisations: number;
    funds: number;
    entities: number;
    vehicles: number;
    investors: number;
    assets: number;
    debt: number;
  };
}

export const CascadingFilterBar: React.FC<CascadingFilterBarProps> = ({
  filterState,
  onFilterChange,
  resultCounts
}) => {
  const funds = fundRegistryStore.getAllFunds();

  const handleManagerChange = (managerId: string) => {
    onFilterChange({
      ...filterState,
      managerId,
      fundId: 'ALL',
      entityId: 'ALL',
      vehicleId: 'ALL',
      investorId: 'ALL',
      assetId: 'ALL'
    });
  };

  const handleFundChange = (fundId: string) => {
    onFilterChange({
      ...filterState,
      fundId,
      entityId: 'ALL',
      vehicleId: 'ALL',
      investorId: 'ALL',
      assetId: 'ALL'
    });
  };

  const handleReset = () => {
    onFilterChange({
      managerId: 'ALL',
      fundId: 'ALL',
      entityId: 'ALL',
      vehicleId: 'ALL',
      investorId: 'ALL',
      assetClass: 'ALL',
      assetId: 'ALL',
      timeHorizon: 'ALL',
      epistemicFilter: 'ALL'
    });
  };

  const isFiltered = 
    filterState.managerId !== 'ALL' ||
    filterState.fundId !== 'ALL' ||
    filterState.entityId !== 'ALL' ||
    filterState.vehicleId !== 'ALL' ||
    filterState.investorId !== 'ALL' ||
    filterState.assetClass !== 'ALL' ||
    filterState.epistemicFilter !== 'ALL';

  return (
    <div className="bg-zinc-950/90 border border-white/10 rounded-2xl p-3.5 space-y-3 shadow-xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Cascading Entity &amp; State Filter
          </span>
          <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
            Manager → Fund → Legal Entity → Vehicle → Investor → Asset
          </span>
        </div>

        <div className="flex items-center gap-3">
          {resultCounts && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300">
                {resultCounts.funds} Funds
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300">
                {resultCounts.entities} Entities
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300">
                {resultCounts.investors} LPs
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300">
                {resultCounts.assets} Assets
              </span>
            </div>
          )}

          {isFiltered && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Cascading Controls Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono">
        {/* 1. Manager / Sponsor */}
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-blue-400" />
            <span>1. Manager:</span>
          </label>
          <select
            value={filterState.managerId}
            onChange={(e) => handleManagerChange(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-blue-500 truncate cursor-pointer"
          >
            <option value="ALL">All Managers</option>
            {CANONICAL_ORGANISATIONS.map(org => (
              <option key={org.id} value={org.id}>
                {org.shortName}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Fund */}
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-emerald-400" />
            <span>2. Fund:</span>
          </label>
          <select
            value={filterState.fundId}
            onChange={(e) => handleFundChange(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-emerald-500 truncate cursor-pointer"
          >
            <option value="ALL">All Funds ({funds.length})</option>
            {funds.map(f => (
              <option key={f.id} value={f.id}>
                {f.code} · {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Legal Entity */}
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>3. Legal Entity:</span>
          </label>
          <select
            value={filterState.entityId}
            onChange={(e) => onFilterChange({ ...filterState, entityId: e.target.value })}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-purple-500 truncate cursor-pointer"
          >
            <option value="ALL">All Entities</option>
            {CANONICAL_LEGAL_ENTITIES.map(ent => (
              <option key={ent.id} value={ent.id}>
                {ent.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Vehicle */}
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-400" />
            <span>4. Vehicle:</span>
          </label>
          <select
            value={filterState.vehicleId}
            onChange={(e) => onFilterChange({ ...filterState, vehicleId: e.target.value })}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-amber-500 truncate cursor-pointer"
          >
            <option value="ALL">All Vehicles</option>
            {CANONICAL_VEHICLES.map(v => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Investor / LP */}
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-pink-400" />
            <span>5. Investor (LP):</span>
          </label>
          <select
            value={filterState.investorId}
            onChange={(e) => onFilterChange({ ...filterState, investorId: e.target.value })}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-pink-500 truncate cursor-pointer"
          >
            <option value="ALL">All Investors</option>
            {CANONICAL_INVESTORS.map(inv => (
              <option key={inv.id} value={inv.id}>
                {inv.name}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Epistemic Certainty */}
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>6. Epistemic Mode:</span>
          </label>
          <select
            value={filterState.epistemicFilter}
            onChange={(e) => onFilterChange({ ...filterState, epistemicFilter: e.target.value as any })}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-cyan-500 truncate cursor-pointer"
          >
            <option value="ALL">All Epistemic Data</option>
            <option value="OBSERVED_ONLY">Observed Facts Only</option>
            <option value="INCLUDING_INFERRED">Observed + Inferred</option>
          </select>
        </div>
      </div>
    </div>
  );
};
