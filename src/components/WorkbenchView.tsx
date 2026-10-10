/**
 * Interactive POC1 Workbench & State Machine Simulator
 * Testing U.S. Investment Taxation as a Temporal State-Transition System
 * S_{t+1} = delta(S_t, e_t, rho_t)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { FUND_CASE_STUDIES, CaseStudyData } from '../data/fund-cases';
import { 
  executeStateTransition, 
  executeHistoricalReplay, 
  compareIncrementalVsReplay,
  testEventCommutativity,
  cloneState
} from '../engine/transition-engine';
import { projectWorkpapers } from '../engine/workpaper-projections';
import { InvestmentTaxState, TaxEvent, BoundaryStatus, HumanDetermination, Section704cMethod } from '../types/tax-state';
import { TemporalTaxStateD3Graph } from './TemporalTaxStateD3Graph';
import { FundParameterControls, DynamicFundParameters } from './FundParameterControls';
import { SecSearchModal } from './SecSearchModal';
import { MathView } from './MathView';
import { FUND_TO_CASE_MAPPING, CASE_TO_FUND_MAPPING } from '../engine/canonical-state-bridge';
import { 
  Play, 
  RotateCcw, 
  FastForward, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  GitBranch, 
  FileSpreadsheet, 
  Layers, 
  Sliders, 
  UserCheck,
  Building,
  DollarSign,
  Search,
  SlidersHorizontal,
  FileSearch
} from 'lucide-react';

interface WorkbenchViewProps {
  onNavigateToLedger?: (term: string) => void;
  activeFundId?: string;
  onSelectFund?: (fundId: string) => void;
}

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({ 
  onNavigateToLedger,
  activeFundId,
  onSelectFund
}) => {
  // Case selection
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    (activeFundId && FUND_TO_CASE_MAPPING[activeFundId]) || 'case-bridgewater-pa2'
  );

  // Synchronise with activeFundId from global context
  useEffect(() => {
    if (activeFundId && FUND_TO_CASE_MAPPING[activeFundId]) {
      const targetCaseId = FUND_TO_CASE_MAPPING[activeFundId];
      if (targetCaseId !== selectedCaseId) {
        setSelectedCaseId(targetCaseId);
      }
    }
  }, [activeFundId]);
  const activeCase: CaseStudyData = useMemo(() => {
    return FUND_CASE_STUDIES.find(c => c.id === selectedCaseId) || FUND_CASE_STUDIES[0];
  }, [selectedCaseId]);

  // SEC Search modal state
  const [isSecSearchOpen, setIsSecSearchOpen] = useState<boolean>(false);

  // Dynamic parameters state
  const [fundParams, setFundParams] = useState<DynamicFundParameters>({
    fmvMultiplier: 1.0,
    section754Active: activeCase.initialState.C.section754ElectionActive,
    section704cMethod: activeCase.initialState.C.section704cDefaultMethod || 'TRADITIONAL',
    transferPriceModifier: 1.0,
    customDistributionAmount: 0
  });

  const [showParamControls, setShowParamControls] = useState<boolean>(false);

  // Synchronize parameter defaults when active fund case changes
  useEffect(() => {
    setFundParams({
      fmvMultiplier: 1.0,
      section754Active: activeCase.initialState.C.section754ElectionActive,
      section704cMethod: activeCase.initialState.C.section704cDefaultMethod || 'TRADITIONAL',
      transferPriceModifier: 1.0,
      customDistributionAmount: 0
    });
    setCurrentStepIndex(0);
    setHumanDeterminationResolved(false);
  }, [selectedCaseId, activeCase]);

  // Is currently modified
  const isParametersModified = useMemo(() => {
    return (
      fundParams.fmvMultiplier !== 1.0 ||
      fundParams.section754Active !== activeCase.initialState.C.section754ElectionActive ||
      fundParams.section704cMethod !== (activeCase.initialState.C.section704cDefaultMethod || 'TRADITIONAL') ||
      fundParams.transferPriceModifier !== 1.0
    );
  }, [fundParams, activeCase]);

  // Current simulation step (0 = S_0, 1 = S_1 after event 1, etc.)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  
  // Active state inspection tab
  const [stateTab, setStateTab] = useState<'economic' | 'tax-attributes' | 'structural' | 'provenance' | 'workpapers'>('tax-attributes');

  // Sub-experiment modes
  const [experimentMode, setCurrentExperimentMode] = useState<'standard' | 'replay' | 'perturbation' | 'commutativity'>('standard');

  // Human determination state
  const [humanDeterminationResolved, setHumanDeterminationResolved] = useState<boolean>(false);
  const [selectedDeterminationOption, setSelectedDeterminationOption] = useState<string>('OPT-TRADITIONAL');

  // Compute states timeline dynamically based on active parameters
  const statesTimeline: InvestmentTaxState[] = useMemo(() => {
    const baseInitial = cloneState(activeCase.initialState);

    // Apply FMV perturbation if modified
    if (fundParams.fmvMultiplier !== 1.0) {
      baseInitial.X.assets = baseInitial.X.assets.map(inv => {
        const newFairValue = Math.round(inv.fairValue * fundParams.fmvMultiplier);
        return {
          ...inv,
          fairValue: newFairValue,
          unrealizedGainLoss: newFairValue - inv.taxBasis
        };
      });
      baseInitial.X.totalMarketValue = 
        baseInitial.X.cash + 
        baseInitial.X.assets.reduce((sum, p) => sum + p.fairValue, 0);
      baseInitial.X.totalEconomicCapital = baseInitial.X.totalMarketValue;

      // Reconcile partner book 704(b) capital accounts proportionally
      const totalBook = baseInitial.X.totalEconomicCapital;
      baseInitial.A.partnerAccounts = baseInitial.A.partnerAccounts.map(p => ({
        ...p,
        bookCapital704b: Math.round(totalBook * p.ownershipPercentage)
      }));
    }

    // Apply §754 election toggle to initial state
    baseInitial.C.section754ElectionActive = fundParams.section754Active;
    baseInitial.C.section704cDefaultMethod = fundParams.section704cMethod;

    const states: InvestmentTaxState[] = [baseInitial];
    let s = cloneState(baseInitial);

    for (let i = 0; i < activeCase.events.length; i++) {
      const rawEvt = activeCase.events[i];
      const evt: TaxEvent = {
        ...rawEvt,
        economicFacts: { ...rawEvt.economicFacts },
        taxFacts: { ...rawEvt.taxFacts }
      };

      // Apply Secondary Transfer Pricing & Section 754 Toggle dynamically
      if (evt.type === 'PartnerTransfer') {
        if (fundParams.transferPriceModifier !== 1.0 && evt.economicFacts.purchasePrice) {
          evt.economicFacts.purchasePrice = Math.round(evt.economicFacts.purchasePrice * fundParams.transferPriceModifier);
        }
        if (fundParams.transferPriceModifier !== 1.0 && evt.economicFacts.amount) {
          evt.economicFacts.amount = Math.round(evt.economicFacts.amount * fundParams.transferPriceModifier);
        }
        evt.taxFacts.section754InEffect = fundParams.section754Active;
      }

      // Apply §704(c) method to any tax allocations
      if (evt.taxFacts.section704cMethod) {
        evt.taxFacts.section704cMethod = fundParams.section704cMethod;
      }

      const { nextState } = executeStateTransition(s, evt);
      s = nextState;
      states.push(s);
    }
    return states;
  }, [activeCase, fundParams]);

  // Reset step index when case changes
  const handleCaseChange = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentStepIndex(0);
    setHumanDeterminationResolved(false);
    if (onSelectFund && CASE_TO_FUND_MAPPING[caseId]) {
      onSelectFund(CASE_TO_FUND_MAPPING[caseId]);
    }
  };

  const currentState = statesTimeline[currentStepIndex] || statesTimeline[0];
  const currentEvent = currentStepIndex > 0 ? activeCase.events[currentStepIndex - 1] : null;

  // Workpaper projection for current state
  const currentWorkpapers = useMemo(() => {
    return projectWorkpapers(currentState);
  }, [currentState]);

  // Batch replay comparison
  const replayComparison = useMemo(() => {
    const replay = executeHistoricalReplay(statesTimeline[0], activeCase.events);
    const finalIncremental = statesTimeline[statesTimeline.length - 1];
    return compareIncrementalVsReplay(finalIncremental, replay.finalReplayState);
  }, [activeCase, statesTimeline]);

  // Commutativity test for cases with at least 2 events
  const commutativityTest = useMemo(() => {
    if (activeCase.events.length >= 2) {
      return testEventCommutativity(statesTimeline[0], activeCase.events[0], activeCase.events[1]);
    }
    return null;
  }, [activeCase, statesTimeline]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Top Banner & Case Study Selector */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl ios-glass-card">
        <div>
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-2">
            <span>Deterministic State Engine</span>
            <span>·</span>
            <span className="font-mono text-blue-400 font-semibold">S_&#123;t+1&#125; = δ(S_t, e_t, ρ_t)</span>
            <span>·</span>
            <span className="font-mono text-indigo-300">D = &#123;§704(b), §704(c), §743(b), §754&#125;</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {activeCase.name}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {activeCase.adviserName} · {activeCase.fundType} · Jurisdiction: <span className="text-blue-300 font-bold">{activeCase.jurisdiction}</span> · CIK: <span className="font-mono text-slate-200 font-semibold">{activeCase.cik}</span>
          </p>
        </div>

        {/* Action Controls: SEC Search & Case Selector Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSecSearchOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 ios-glass text-slate-200 hover:text-white rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="Search SEC EDGAR filings archive (Form ADV, Form D/A, 13F)"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span>Search SEC EDGAR</span>
          </button>

          <button
            onClick={() => setShowParamControls(!showParamControls)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              showParamControls || isParametersModified
                ? 'bg-blue-600/30 text-blue-200 border-blue-500/50 shadow-md shadow-blue-500/20'
                : 'ios-glass text-slate-300 hover:text-white border-white/10'
            }`}
            title="Toggle interactive fund parameter controls"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span>Parameters &amp; Perturbations</span>
            {isParametersModified && (
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block animate-ping"></span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <select
              value={selectedCaseId}
              onChange={(e) => handleCaseChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
            >
              <optgroup label="Hedge Funds">
                <option value="case-bridgewater-pa2">Bridgewater Pure Alpha II (Master-Feeder & Revaluations)</option>
                <option value="case-elliott-associates">Elliott Associates, L.P. (Secondary Transfer & §743(b))</option>
                <option value="case-citadel-wellington">Citadel Wellington LLC (High-Turnover & §475(f) Boundary)</option>
                <option value="case-pershing-square">Pershing Square, L.P. (Contributed Stock & Ceiling Rule)</option>
              </optgroup>
              <optgroup label="Private Equity">
                <option value="case-blackstone-brep">Blackstone BREP IX (Holdco SPVs, Discount Step-Down & §752)</option>
                <option value="case-carlyle-continuation">Carlyle Global Partners (Continuation Fund & §707 Disguised Sale)</option>
                <option value="case-kkr-na11">KKR North America XI (Bitemporal Latency & §743(d) Mandatory Loss)</option>
              </optgroup>
              <optgroup label="Fund-of-Funds">
                <option value="case-adams-street-secondary">Adams Street Secondary 7 (Cascading 743(b) - Rev. Rul. 87-115)</option>
                <option value="case-harbourvest-fof">HarbourVest Private Assets (4-Tier Cascade Propagation)</option>
                <option value="case-hamilton-lane">Hamilton Lane PAF (Amended K-1 Bitemporal Delays)</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Primary Invariant Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Invariant 1: Structural Partition */}
        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Partition Invariant:</span>
            <span className={`font-mono font-semibold ${currentState.invariantBreakdown.partitionInvariant ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentState.invariantBreakdown.partitionInvariant ? '✓ Preserved' : '✗ Violated'}
            </span>
          </div>
          <div className="text-base font-bold font-mono text-white tabular-nums">
            ∑ ω_ij = 1.000
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ownership partition closed</div>
        </div>

        {/* Invariant 2: Balance Sheet Identity */}
        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Balance Sheet:</span>
            <span className={`font-mono font-semibold ${currentState.invariantBreakdown.balanceSheetInvariant ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentState.invariantBreakdown.balanceSheetInvariant ? '✓ Balanced' : '✗ Unbalanced'}
            </span>
          </div>
          <div className="text-base font-bold font-mono text-white tabular-nums">
            ${(currentState.X.totalEconomicCapital / 1000000).toFixed(1)}M
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Assets = Liab + Equity</div>
        </div>

        {/* Invariant 3: Outside vs Inside Basis Parity */}
        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Basis Parity (Out - In):</span>
            <span className={`font-mono font-semibold ${currentState.invariantBreakdown.outsideInsideBasisDelta === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {currentState.invariantBreakdown.outsideInsideBasisDelta === 0 ? '✓ Matched' : 'Disparity'}
            </span>
          </div>
          <div className="text-base font-bold font-mono text-white tabular-nums">
            ${(currentState.invariantBreakdown.outsideInsideBasisDelta / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Reconciled via §743(b) layer</div>
        </div>

        {/* Invariant 4: Book/Tax Disparity */}
        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Book-Tax Disparity:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              Reconciled
            </span>
          </div>
          <div className="text-base font-bold font-mono text-white tabular-nums">
            ${(currentState.invariantBreakdown.bookTaxCapitalDelta / 1000000).toFixed(1)}M
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Absorbed in §704(c) layer</div>
        </div>
      </div>

      {/* Dynamic Fund Parameter Controls (Collapsible / Toggleable) */}
      {showParamControls && (
        <FundParameterControls
          parameters={fundParams}
          onChangeParameters={setFundParams}
          onReset={() => {
            setFundParams({
              fmvMultiplier: 1.0,
              section754Active: activeCase.initialState.C.section754ElectionActive,
              section704cMethod: activeCase.initialState.C.section704cDefaultMethod || 'TRADITIONAL',
              transferPriceModifier: 1.0,
              customDistributionAmount: 0
            });
          }}
          isModified={isParametersModified}
          activeFundName={activeCase.name}
        />
      )}

      {/* D3-Based Interactive Visualization: Temporal Tax State-Transitions & Partner Trajectories */}
      <TemporalTaxStateD3Graph
        states={statesTimeline}
        events={activeCase.events}
        activeStepIndex={currentStepIndex}
        onSelectStep={setCurrentStepIndex}
        fundName={activeCase.name}
        isModified={isParametersModified}
      />

      {/* Timeline Controls & Stepper */}
      <div className="p-5 rounded-xl bg-[#0d1322] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-slate-300">
              State Sequence: <span className="font-mono text-emerald-400 text-sm">S_{currentStepIndex}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="text-xs text-slate-400">
              Valid Date: <span className="font-mono text-slate-200">{currentState.timestamp.validDate}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="text-xs text-slate-400">
              Record Date: <span className="font-mono text-amber-400">{currentState.timestamp.recordDate}</span>
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStepIndex(0)}
              disabled={currentStepIndex === 0}
              className="p-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Reset to S_0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium"
            >
              Previous Step
            </button>
            <button
              onClick={() => setCurrentStepIndex(prev => Math.min(statesTimeline.length - 1, prev + 1))}
              disabled={currentStepIndex >= statesTimeline.length - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next Transition</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stepper Dots Timeline */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {statesTimeline.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStepIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer shrink-0 ${
                currentStepIndex === idx
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-semibold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="font-mono">t={idx}</span>
              <span className="text-[11px] text-slate-500">
                {idx === 0 ? 'Baseline (S_0)' : activeCase.events[idx - 1]?.type}
              </span>
            </button>
          ))}
        </div>

        {/* Current Event Context Banner */}
        {currentEvent && (
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-emerald-400">{currentEvent.id}</span>
                <span className="text-slate-500">·</span>
                <span className="font-semibold text-white">{currentEvent.type}</span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-slate-400">{currentEvent.relevantDomain}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                  currentEvent.boundaryStatus === 'Closed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  currentEvent.boundaryStatus === 'Review' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                  'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  Boundary: {currentEvent.boundaryStatus}
                </span>
              </div>
            </div>
            <p className="text-slate-300">{currentEvent.notes}</p>
            <div className="text-slate-500 text-[11px]">
              Source: {currentEvent.evidenceSource.documentTitle} ({currentEvent.evidenceSource.filingType}) · Confidence: {currentEvent.evidenceSource.evidenceConfidence}
            </div>
          </div>
        )}
      </div>

      {/* Computational Boundary & Human Determination Alert (if event is in Review) */}
      {currentEvent && currentEvent.boundaryStatus === 'Review' && (
        <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-800/70 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Computational Boundary Fault Zone Reached: Γ(S_t, e_t) = Review</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentEvent.boundaryReason || 'Missing private tax determination prevents closed deterministic execution.'}
          </p>
          
          {/* Human Determination Interactive Controls */}
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-3 text-xs">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Human Professional Determination Required:</span>
            </div>
            <p className="text-slate-400">
              Select the governing tax classification or valuation method to establish the validated fact and restore deterministic computation:
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input 
                  type="radio" 
                  name="determination" 
                  value="OPT-TRADITIONAL" 
                  checked={selectedDeterminationOption === 'OPT-TRADITIONAL'}
                  onChange={() => setSelectedDeterminationOption('OPT-TRADITIONAL')}
                />
                <span>Approve Treas. Reg. § 1.704-3(b) Traditional Method (Ceiling Rule limitation applies)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input 
                  type="radio" 
                  name="determination" 
                  value="OPT-REMEDIAL" 
                  checked={selectedDeterminationOption === 'OPT-REMEDIAL'}
                  onChange={() => setSelectedDeterminationOption('OPT-REMEDIAL')}
                />
                <span>Approve Treas. Reg. § 1.704-3(d) Remedial Allocation Method (Eliminates Ceiling Rule distortion)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input 
                  type="radio" 
                  name="determination" 
                  value="OPT-CLASS-ALLOCATION" 
                  checked={selectedDeterminationOption === 'OPT-CLASS-ALLOCATION'}
                  onChange={() => setSelectedDeterminationOption('OPT-CLASS-ALLOCATION')}
                />
                <span>Confirm Treas. Reg. § 1.755-1 Class Valuation (71.1% Capital Asset / 28.9% Ordinary Income Asset)</span>
              </label>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHumanDeterminationResolved(true)}
                className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold rounded text-xs transition-colors cursor-pointer"
              >
                {humanDeterminationResolved ? '✓ Determination Validated' : 'Validate Determination (State Injection)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Inspection Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-800 text-xs font-medium text-slate-400">
          {[
            { id: 'tax-attributes', label: 'Tax Attributes (A_t: §704(b), §704(c), §743(b))' },
            { id: 'economic', label: 'Economic Position (X_t: Lots & Cash)' },
            { id: 'structural', label: 'Structural Graph (G_t: Entities & Weights)' },
            { id: 'provenance', label: 'Provenance Records (P_t Lineage)' },
            { id: 'workpapers', label: 'Workpaper Projections (WP_t = Π(S_t))' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStateTab(tab.id as typeof stateTab)}
              className={`pb-3 px-4 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                stateTab === tab.id
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Tax Attributes A_t */}
        {stateTab === 'tax-attributes' && (
          <div className="space-y-6">
            {/* Partner Accounts Table */}
            <div className="rounded-lg border border-slate-800 bg-[#0d1322] p-5">
              <div className="text-xs font-semibold text-white mb-3 flex items-center justify-between">
                <span>Partner Capital Accounts & Tax Basis Shares (IRC § 704(b) vs IRC § 705)</span>
                <span className="font-mono text-slate-400 text-[11px]">Active Partners: {currentState.A.partnerAccounts.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                      <th className="p-2.5">Partner Name</th>
                      <th className="p-2.5">Tax Status</th>
                      <th className="p-2.5">Ownership %</th>
                      <th className="p-2.5 text-right">§704(b) Book Capital</th>
                      <th className="p-2.5 text-right">Inside Basis Share</th>
                      <th className="p-2.5 text-right">Outside Basis (§705)</th>
                      <th className="p-2.5 text-right">§743(b) Adjustment</th>
                      <th className="p-2.5 text-right">§704(c) Built-in Gain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {currentState.A.partnerAccounts.map((p) => (
                      <tr key={p.partnerId} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-sans font-medium text-white">{p.partnerName}</td>
                        <td className="p-2.5 text-slate-400 text-[11px]">{p.taxStatus}</td>
                        <td className="p-2.5 text-emerald-400">{(p.ownershipPercentage * 100).toFixed(2)}%</td>
                        <td className="p-2.5 text-right text-slate-200">${p.bookCapital704b.toLocaleString()}</td>
                        <td className="p-2.5 text-right text-slate-300">${p.insideTaxBasisShare.toLocaleString()}</td>
                        <td className="p-2.5 text-right text-emerald-300 font-semibold">${p.outsideTaxBasis.toLocaleString()}</td>
                        <td className="p-2.5 text-right text-amber-300">
                          {p.section743bAdjustment !== 0 ? `$${p.section743bAdjustment.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-2.5 text-right text-cyan-300">
                          {p.section704cBuiltInGain !== 0 ? `$${p.section704cBuiltInGain.toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 704(c) Layers */}
            <div className="rounded-lg border border-slate-800 bg-[#0d1322] p-5">
              <div className="text-xs font-semibold text-white mb-2">
                Section 704(c) Contributed Property & Reverse Revaluation Layers
              </div>
              {currentState.A.section704cLayers.length > 0 ? (
                <div className="space-y-3">
                  {currentState.A.section704cLayers.map((layer, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 rounded border border-slate-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <div className="text-slate-500 text-[11px]">Property Identifier:</div>
                        <div className="font-mono text-white mt-0.5">{layer.propertyId}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[11px]">Allocation Method:</div>
                        <div className="font-mono text-emerald-400 mt-0.5">{layer.allocationMethod} Method</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[11px]">Original Built-In Gain:</div>
                        <div className="font-mono text-slate-200 mt-0.5">${layer.builtInGainLoss.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[11px]">Remaining Disparity:</div>
                        <div className="font-mono text-amber-300 font-semibold mt-0.5">${layer.remainingBuiltInGainLoss.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-3">No active Section 704(c) built-in gain layers at current state step.</div>
              )}
            </div>

            {/* Section 743(b) Adjustments */}
            <div className="rounded-lg border border-slate-800 bg-[#0d1322] p-5">
              <div className="text-xs font-semibold text-white mb-2">
                Section 743(b) Transferee Basis Adjustments (Allocated under Treas. Reg. § 1.755-1)
              </div>
              {currentState.A.section743bAdjustments.length > 0 ? (
                <div className="space-y-3">
                  {currentState.A.section743bAdjustments.map((adj, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 rounded border border-slate-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <div className="text-slate-500 text-[11px]">Transferee Partner:</div>
                        <div className="font-mono text-white mt-0.5">{adj.transfereePartnerId}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[11px]">Total Net Adjustment:</div>
                        <div className="font-mono text-emerald-400 font-bold mt-0.5">${adj.totalAdjustment.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[11px]">Capital Asset Class (§755):</div>
                        <div className="font-mono text-slate-200 mt-0.5">${adj.allocatedCapitalAsset.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[11px]">Ordinary Income Class (§755):</div>
                        <div className="font-mono text-slate-200 mt-0.5">${adj.allocatedOrdinaryAsset.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-3">No active Section 743(b) basis adjustments recorded.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Economic Position X_t */}
        {stateTab === 'economic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-[#0d1322] border border-slate-800">
              <div>
                <div className="text-xs text-slate-400">Total Cash Balance</div>
                <div className="text-lg font-bold font-mono text-white mt-1 tabular-nums">${currentState.X.cash.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Total Market Value</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-1 tabular-nums">${currentState.X.totalMarketValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Total Economic Capital</div>
                <div className="text-lg font-bold font-mono text-slate-200 mt-1 tabular-nums">${currentState.X.totalEconomicCapital.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Total Liabilities</div>
                <div className="text-lg font-bold font-mono text-rose-400 mt-1 tabular-nums">${currentState.X.totalLiabilities.toLocaleString()}</div>
              </div>
            </div>

            {/* Asset Lots */}
            <div className="rounded-lg border border-slate-800 bg-[#0d1322] p-5">
              <div className="text-xs font-semibold text-white mb-3">Portfolio Investment Lots & Tax Basis Tracking</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 font-medium">
                      <th className="p-2.5">Asset Lot</th>
                      <th className="p-2.5">Asset Class (§755)</th>
                      <th className="p-2.5">Acquisition Date</th>
                      <th className="p-2.5 text-right">Inside Tax Basis</th>
                      <th className="p-2.5 text-right">§704(b) Book Basis</th>
                      <th className="p-2.5 text-right">Fair Market Value</th>
                      <th className="p-2.5 text-right">Unrealized Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {currentState.X.assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-sans font-medium text-white">{asset.name}</td>
                        <td className="p-2.5 text-slate-400 text-[11px]">{asset.assetClass}</td>
                        <td className="p-2.5 text-slate-400">{asset.acquisitionDate}</td>
                        <td className="p-2.5 text-right text-slate-300">${asset.taxBasis.toLocaleString()}</td>
                        <td className="p-2.5 text-right text-slate-200">${asset.bookBasis.toLocaleString()}</td>
                        <td className="p-2.5 text-right text-emerald-400 font-semibold">${asset.fairValue.toLocaleString()}</td>
                        <td className="p-2.5 text-right text-cyan-300">
                          {asset.unrealizedGainLoss >= 0 ? `+$${asset.unrealizedGainLoss.toLocaleString()}` : `-$${Math.abs(asset.unrealizedGainLoss).toLocaleString()}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Structural Graph G_t */}
        {stateTab === 'structural' && (
          <div className="rounded-lg border border-slate-800 bg-[#0d1322] p-5 space-y-4">
            <div className="text-xs font-semibold text-white">
              Structural Graph State: G_t = (V_t, L_t, τ, ω_t)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {activeCase.structureGraphDescription}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Entities List */}
              <div className="p-4 bg-slate-900 rounded border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300 mb-2">Entity Nodes (V_t):</div>
                {activeCase.entities.map(e => (
                  <div key={e.id} className="p-2 bg-slate-950 rounded border border-slate-800/80 text-xs flex justify-between">
                    <div>
                      <span className="text-white font-medium">{e.name}</span>
                      <div className="text-[11px] text-slate-500">{e.classification} · {e.jurisdiction}</div>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono">{e.role}</span>
                  </div>
                ))}
              </div>

              {/* Relationships */}
              <div className="p-4 bg-slate-900 rounded border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300 mb-2">Directed Links & Weights (L_t, ω_ij):</div>
                {activeCase.relationships.map((r, i) => (
                  <div key={i} className="p-2 bg-slate-950 rounded border border-slate-800/80 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-slate-300">{r.from}</span>
                      <ArrowRight className="inline w-3 h-3 mx-1 text-slate-500" />
                      <span className="text-white">{r.to}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-emerald-400 font-semibold">{r.weight}</div>
                      <div className="text-[10px] text-slate-500">{r.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Provenance Records P_t */}
        {stateTab === 'provenance' && (
          <div className="rounded-lg border border-slate-800 bg-[#0d1322] p-5 space-y-3">
            <div className="text-xs font-semibold text-white">
              Computational Provenance Lineage: π: Y → D × F × R × V × O
            </div>
            <div className="space-y-2.5">
              {currentState.P.map((prov) => (
                <div key={prov.id} className="p-3 bg-slate-900 rounded border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-400 font-bold">{prov.id}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{prov.recordTimestamp}</span>
                  </div>
                  <div className="text-white font-medium">{prov.extractedFact}</div>
                  <div className="text-slate-400 text-[11px] flex flex-wrap gap-2 pt-1">
                    <span>Source: <strong className="text-slate-300">{prov.sourceDocument}</strong></span>
                    <span>·</span>
                    <span>Rule: <strong className="text-slate-300">{prov.applicableRule}</strong></span>
                    <span>·</span>
                    <span>Target Variable: <code className="text-cyan-300">{prov.targetVariable}</code></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Workpaper Projections WP_t = Π(S_t) */}
        {stateTab === 'workpapers' && (
          <div className="space-y-6">
            {/* Form 1065 Schedule K-1 */}
            <div className="rounded-lg border border-slate-800 bg-[#0d1322] p-5">
              <div className="text-xs font-semibold text-white mb-2 flex items-center justify-between">
                <span>Workpaper Projection: Form 1065 Schedule K-1 (Partner Distributive Share)</span>
                <span className="text-[11px] font-mono text-slate-400">WP_t = Π_&#123;K1&#125;(S_{currentStepIndex})</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 font-medium">
                      <th className="p-2.5">Partner</th>
                      <th className="p-2.5">Share %</th>
                      <th className="p-2.5 text-right">Box 1 Ordinary</th>
                      <th className="p-2.5 text-right">Box 9a Capital Gain</th>
                      <th className="p-2.5 text-right">Box 20 Code U (§743(b))</th>
                      <th className="p-2.5 text-right">Box L Ending §704(b) Book</th>
                      <th className="p-2.5 text-right">Box L Ending Tax Capital</th>
                      <th className="p-2.5 text-right">Net Disparity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {currentWorkpapers.scheduleK1.map((k1) => (
                      <tr key={k1.partnerId} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-sans font-medium text-white">{k1.partnerName}</td>
                        <td className="p-2.5 text-slate-300">{k1.ownershipPct.toFixed(1)}%</td>
                        <td className="p-2.5 text-right text-slate-300">${k1.ordinaryBusinessIncome}</td>
                        <td className="p-2.5 text-right text-emerald-400 font-semibold">${k1.netLongTermCapitalGain}</td>
                        <td className="p-2.5 text-right text-amber-300">${k1.section743bAdjustmentBox20U.toLocaleString()}</td>
                        <td className="p-2.5 text-right text-slate-200">${k1.endingCapitalAccount704b.toLocaleString()}</td>
                        <td className="p-2.5 text-right text-slate-300">${k1.endingTaxBasisCapital.toLocaleString()}</td>
                        <td className="p-2.5 text-right text-cyan-300">${k1.netDisparity.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Research Tooling Tabs: State Sufficiency / Commutativity / Perturbation */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            POC1 Falsification & Empirical Stress Experiments
          </div>
          <div className="flex gap-2">
            {[
              { id: 'replay', label: 'Historical Replay Parity' },
              { id: 'perturbation', label: 'Temporal Perturbation (ΔS_k → ΔS_n)' },
              { id: 'commutativity', label: 'Event Ordering (Commutativity)' }
            ].map(exp => (
              <button
                key={exp.id}
                onClick={() => setCurrentExperimentMode(exp.id as typeof experimentMode)}
                className={`px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                  experimentMode === exp.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-semibold'
                    : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                }`}
              >
                {exp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-Experiment 1: Replay Parity */}
        {experimentMode === 'replay' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>State Sufficiency Hypothesis Test: Method A (Incremental) vs Method B (Batch Replay)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span>Evaluates:</span>
              <MathView math="S_n^{\text{incremental}} \equiv \delta^*(S_0, H_n)" className="ml-1" />
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500">Incremental Hash:</span>
                <div className="font-mono text-white font-bold mt-0.5">{replayComparison.incrementalStateHash}</div>
              </div>
              <div>
                <span className="text-slate-500">Replay Hash:</span>
                <div className="font-mono text-emerald-400 font-bold mt-0.5">{replayComparison.replayStateHash}</div>
              </div>
            </div>
            <div className="text-slate-400 text-xs">
              {replayComparison.isIdentical ? (
                <span className="text-emerald-400 font-semibold">
                  ✓ Replay Parity Validated: Zero mathematical divergence across all economic capital, book accounts, and unamortized tax layers.
                </span>
              ) : (
                <span className="text-rose-400 font-semibold">
                  ✗ Replay Divergence Detected ({replayComparison.discrepancies.length} discrepancy points).
                </span>
              )}
            </div>
          </div>
        )}

        {/* Sub-Experiment 2: Perturbation */}
        {experimentMode === 'perturbation' && (
          <div className="space-y-3 text-xs">
            <div className="font-semibold text-white">
              Historical Perturbation Scenario: {activeCase.perturbationScenario.insertedOrAmendedEvent}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-950 rounded border border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500">Propagation Breadth B(e):</span>
                <div className="font-mono text-emerald-400 text-sm mt-0.5">{activeCase.perturbationScenario.breadthAffected} variables</div>
              </div>
              <div>
                <span className="text-slate-500">Propagation Depth D(e):</span>
                <div className="font-mono text-cyan-400 text-sm mt-0.5">{activeCase.perturbationScenario.depthAffected} layers</div>
              </div>
              <div>
                <span className="text-slate-500">Boundary Interruption:</span>
                <div className="font-mono text-amber-400 text-sm mt-0.5">
                  {activeCase.perturbationScenario.computationalBoundaryHalt ? 'Halts at Boundary' : 'Continuous Flow'}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Amplification:</span>
                <div className="font-mono text-white text-sm mt-0.5">1.0x (Finite Diff)</div>
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium mb-1">Changed Downstream Variables:</div>
              <ul className="list-disc pl-5 text-slate-300 space-y-1">
                {activeCase.perturbationScenario.changedStateVariables.map((v, i) => (
                  <li key={i}><code className="text-emerald-300 font-mono text-[11px]">{v}</code></li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Sub-Experiment 3: Commutativity */}
        {experimentMode === 'commutativity' && (
          <div className="space-y-3 text-xs">
            {commutativityTest ? (
              <>
                <div className="font-semibold text-white">
                  Event Pair Commutativity Evaluation: <code className="text-slate-200 font-mono">{commutativityTest.eventA.type}</code> vs <code className="text-slate-200 font-mono">{commutativityTest.eventB.type}</code>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs">
                  <span className="text-slate-500">Result: </span>
                  <span className={`font-semibold ${commutativityTest.commutes ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {commutativityTest.commutes ? 'Events Commute (Order-Insensitive)' : 'Events DO NOT Commute (Strict Order-Sensitive)'}
                  </span>
                  <p className="text-slate-300 mt-1">{commutativityTest.reason}</p>
                </div>
                {commutativityTest.divergentVariables.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-slate-400 font-medium">Divergent State Variables if Order Inverted:</div>
                    {commutativityTest.divergentVariables.map((d, i) => (
                      <div key={i} className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] flex justify-between">
                        <span className="font-mono text-cyan-300">{d.variable}</span>
                        <span className="text-slate-400">{d.taxSignificance}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-slate-500 py-3">Fund case contains fewer than 2 sequential events to perform pairwise commutativity analysis.</div>
            )}
          </div>
        )}
      </div>

      {/* SEC EDGAR Search Modal */}
      <SecSearchModal
        isOpen={isSecSearchOpen}
        onClose={() => setIsSecSearchOpen(false)}
        onSelectCaseFund={(caseId) => handleCaseChange(caseId)}
        onNavigateToLedger={onNavigateToLedger}
      />
    </div>
  );
};
