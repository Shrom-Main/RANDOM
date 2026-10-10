/**
 * POC 1 — Master Organisation Charts & Entity Relationship Graph
 * 
 * Interactive Relationship Hierarchy:
 * Manager / Sponsor → Fund → Legal Entity → Vehicle → Investor / Asset
 * 
 * Capabilities:
 * - Dynamic SVG hierarchy tree with expand/collapse
 * - Entity Inspector Drawer (Jurisdiction, CIK, EIN, LEI, Pass-Through status)
 * - Edge relationship inspection (Ownership %, Voting Control %, Pass-Through status, Effective dates)
 * - Dependency tracing highlighting upstream managers and downstream tax/economic propagation paths
 * - Provenance documentation tracing
 */

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  GitFork, 
  Layers, 
  Users, 
  Coins, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown, 
  Info, 
  Search, 
  Maximize2,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { 
  CANONICAL_ORGANISATIONS, 
  CANONICAL_LEGAL_ENTITIES, 
  CANONICAL_VEHICLES, 
  CANONICAL_INVESTORS,
  filterUniverseByCascade 
} from '../engine/entity-hierarchy-engine';
import { CascadingFilterState, LegalEntityNode, OrganisationNode, VehicleNode } from '../types/entity-hierarchy';
import { fundRegistryStore } from '../engine/fund-registry-store';
import { CascadingFilterBar } from './CascadingFilterBar';

interface OrganisationChartsViewProps {
  activeFundId: string;
  onSelectFund: (fundId: string) => void;
}

export const OrganisationChartsView: React.FC<OrganisationChartsViewProps> = ({
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

  const [selectedEntity, setSelectedEntity] = useState<LegalEntityNode | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<OrganisationNode | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'ORG-BRIDGEWATER': true,
    'ORG-BLACKSTONE': true,
    'ORG-CITADEL': true,
    'fund-bridgewater-pa2': true,
    'fund-blackstone-brep': true
  });

  const universe = useMemo(() => {
    return filterUniverseByCascade(filterState);
  }, [filterState]);

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">
              Canonical Structural State G_t
            </span>
            <span className="text-xs text-zinc-400 font-mono">Explicit Entity vs Fund Hierarchy</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <GitFork className="w-6 h-6 text-indigo-400" />
            <span>Interactive Organisation &amp; Ownership Charts</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Model the hierarchy explicitly: Organisation / Manager → Fund → Legal Entity → Vehicle → Investor / Asset.
            An entity may participate in multiple funds without duplicating identity. Click any node to inspect stable IDs, tax classifications, and dependencies.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{universe.entities.length} Stable Legal Entities</span>
          </div>
        </div>
      </div>

      {/* Cascading Filter Bar */}
      <CascadingFilterBar
        filterState={filterState}
        onFilterChange={setFilterState}
        resultCounts={universe.counts}
      />

      {/* Interactive Visual Hierarchy Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive Tree Graph */}
        <div className="lg:col-span-2 bg-zinc-950/90 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Multi-Tier Entity Graph G_t(V, E)</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              Click nodes to expand/collapse or inspect details
            </span>
          </div>

          {/* Hierarchy Root: Managers */}
          <div className="space-y-4 font-mono text-xs">
            {universe.organisations.map(org => {
              const isOrgExpanded = expandedNodes[org.id] ?? true;
              const orgFunds = universe.funds.filter(f => 
                org.fundIds.includes(f.id) || (f.adviser_name && f.adviser_name.includes(org.shortName))
              );

              return (
                <div key={org.id} className="border border-white/10 rounded-2xl bg-zinc-900/40 p-3 space-y-3">
                  {/* Manager Header Node */}
                  <div 
                    onClick={() => { setSelectedOrg(org); setSelectedEntity(null); setSelectedVehicle(null); }}
                    className="flex items-center justify-between gap-3 p-2 rounded-xl bg-blue-950/30 border border-blue-500/30 hover:border-blue-400 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleExpand(org.id); }}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      >
                        {isOrgExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-bold text-white text-sm">{org.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          ID: {org.id} · CIK: {org.cik || 'N/A'} · HQ: {org.headquarters}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-blue-300">
                        ${(org.totalOrgAumUsd / 1000000000).toFixed(1)}B AUM
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        {org.sponsorType}
                      </span>
                    </div>
                  </div>

                  {/* Level 2: Funds under this Manager */}
                  {isOrgExpanded && (
                    <div className="pl-6 border-l-2 border-blue-500/20 space-y-3">
                      {orgFunds.map(fund => {
                        const isFundExpanded = expandedNodes[fund.id] ?? true;
                        const fundEntities = universe.entities.filter(e => e.participatingFundIds.includes(fund.id));
                        const fundVehicles = universe.vehicles.filter(v => v.fundId === fund.id);

                        return (
                          <div key={fund.id} className="space-y-2">
                            {/* Fund Node */}
                            <div 
                              onClick={() => {
                                onSelectFund(fund.id);
                                toggleExpand(fund.id);
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                                fund.id === activeFundId 
                                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-500/10' 
                                  : 'bg-zinc-900/80 border-white/10 hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                                <div>
                                  <div className="font-bold text-white flex items-center gap-2">
                                    <span>{fund.code} · {fund.name}</span>
                                    {fund.id === activeFundId && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        ACTIVE FUND
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-zinc-400">
                                    Strategy: {fund.type} · Jurisdiction: {fund.jurisdiction}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs font-bold text-white">${(fund.aum_usd / 1000000000).toFixed(1)}B</div>
                                <div className="text-[9px] text-zinc-500">§754 Elected: {fund.section_754_elected ? 'YES' : 'NO'}</div>
                              </div>
                            </div>

                            {/* Level 3: Legal Entities & Vehicles */}
                            {isFundExpanded && (
                              <div className="pl-6 border-l-2 border-emerald-500/20 space-y-2">
                                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                                  Participating Legal Entities &amp; Vehicles:
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {fundEntities.map(ent => (
                                    <div
                                      key={ent.id}
                                      onClick={() => { setSelectedEntity(ent); setSelectedOrg(null); setSelectedVehicle(null); }}
                                      className={`p-2.5 rounded-xl border text-[11px] transition-all cursor-pointer ${
                                        selectedEntity?.id === ent.id
                                          ? 'bg-purple-950/40 border-purple-500/60 shadow-md shadow-purple-500/10'
                                          : 'bg-black/40 border-white/10 hover:border-purple-400/40'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="font-bold text-white flex items-center gap-1.5">
                                          <Layers className="w-3 h-3 text-purple-400" />
                                          <span className="truncate">{ent.name}</span>
                                        </div>
                                        <span className={`text-[8px] px-1 rounded ${ent.isPassThrough ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                          {ent.isPassThrough ? 'PASS-THROUGH' : 'OPAQUE CORP'}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-zinc-400 mt-1 flex items-center justify-between">
                                        <span>{ent.legalClassification}</span>
                                        <span className="text-zinc-500">{ent.jurisdiction}</span>
                                      </div>
                                    </div>
                                  ))}

                                  {fundVehicles.map(veh => (
                                    <div
                                      key={veh.id}
                                      onClick={() => { setSelectedVehicle(veh); setSelectedOrg(null); setSelectedEntity(null); }}
                                      className={`p-2.5 rounded-xl border text-[11px] transition-all cursor-pointer ${
                                        selectedVehicle?.id === veh.id
                                          ? 'bg-amber-950/40 border-amber-500/60 shadow-md shadow-amber-500/10'
                                          : 'bg-black/40 border-white/10 hover:border-amber-400/40'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="font-bold text-white flex items-center gap-1.5">
                                          <Coins className="w-3 h-3 text-amber-400" />
                                          <span className="truncate">{veh.name}</span>
                                        </div>
                                        <span className="text-[8px] px-1 rounded bg-amber-500/20 text-amber-300">
                                          {veh.vehicleType}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-zinc-400 mt-1 flex items-center justify-between">
                                        <span>NAV: ${(veh.navUsd / 1000000).toFixed(0)}M</span>
                                        <span className="text-zinc-500">{veh.currency}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Entity & Relationship Inspector Drawer */}
        <div className="bg-zinc-950/90 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>Entity Inspector &amp; Provenance</span>
          </div>

          {selectedEntity ? (
            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                  {selectedEntity.legalClassification}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{selectedEntity.name}</h3>
                <p className="text-[11px] text-zinc-400">ID: {selectedEntity.id}</p>
              </div>

              <div className="space-y-2 p-3 rounded-2xl bg-zinc-900/60 border border-white/5">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Jurisdiction:</span>
                  <span className="text-white font-semibold">{selectedEntity.jurisdiction}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Tax Residency:</span>
                  <span className="text-white font-semibold">{selectedEntity.taxResidency}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Pass-Through Status:</span>
                  <span className={selectedEntity.isPassThrough ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {selectedEntity.isPassThrough ? 'Partnership / Disregarded' : 'Regarded Corporation'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Master-Feeder Role:</span>
                  <span className="text-white">{selectedEntity.isMasterFeeder ? 'YES' : 'NO'}</span>
                </div>
                {selectedEntity.ein && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-400">EIN:</span>
                    <span className="text-cyan-300">{selectedEntity.ein}</span>
                  </div>
                )}
                {selectedEntity.cik && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-400">SEC CIK:</span>
                    <span className="text-cyan-300">{selectedEntity.cik}</span>
                  </div>
                )}
              </div>

              {/* Participating Funds */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Participating Funds:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEntity.participatingFundIds.map(fid => (
                    <span key={fid} className="px-2 py-1 rounded-lg bg-white/10 text-white text-[10px]">
                      {fid}
                    </span>
                  ))}
                </div>
              </div>

              {/* Provenance Box */}
              <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1 text-[11px]">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Legal Provenance</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">{selectedEntity.provenance.sourceDocument}</p>
                <div className="text-[10px] text-zinc-500 pt-1">
                  Verified: {selectedEntity.provenance.verifiedDate} by {selectedEntity.provenance.verifiedBy}
                </div>
              </div>
            </div>
          ) : selectedOrg ? (
            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase">
                  {selectedOrg.sponsorType}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{selectedOrg.name}</h3>
                <p className="text-[11px] text-zinc-400">ID: {selectedOrg.id}</p>
              </div>

              <div className="space-y-2 p-3 rounded-2xl bg-zinc-900/60 border border-white/5">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Headquarters:</span>
                  <span className="text-white font-semibold">{selectedOrg.headquarters}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Total Org AUM:</span>
                  <span className="text-emerald-400 font-bold">${(selectedOrg.totalOrgAumUsd / 1000000000).toFixed(1)}B</span>
                </div>
                {selectedOrg.cik && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-400">SEC EDGAR CIK:</span>
                    <span className="text-cyan-300">{selectedOrg.cik}</span>
                  </div>
                )}
                {selectedOrg.lei && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-400">GLEIF LEI:</span>
                    <span className="text-cyan-300">{selectedOrg.lei}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Regulators in Jurisdiction:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedOrg.regulatoryJurisdictions.map(reg => (
                    <span key={reg} className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-300 text-[10px]">
                      {reg}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedVehicle ? (
            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                  {selectedVehicle.vehicleType}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{selectedVehicle.name}</h3>
                <p className="text-[11px] text-zinc-400">ID: {selectedVehicle.id}</p>
              </div>

              <div className="space-y-2 p-3 rounded-2xl bg-zinc-900/60 border border-white/5">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Fund:</span>
                  <span className="text-white font-semibold">{selectedVehicle.fundId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Vehicle NAV:</span>
                  <span className="text-emerald-400 font-bold">${(selectedVehicle.navUsd / 1000000).toFixed(1)}M {selectedVehicle.currency}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Section 754:</span>
                  <span className="text-white">{selectedVehicle.section754Elected ? 'ACTIVE' : 'NONE'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center space-y-2">
              <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="text-zinc-400 font-mono text-xs">Select any node on the left to inspect</div>
              <p className="text-zinc-600 text-[11px]">
                Inspect stable entity attributes, jurisdictions, tax classification, and cross-fund relationships.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
