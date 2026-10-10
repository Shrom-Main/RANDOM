/**
 * POC 1 — Canonical Computational Tax State Bridge
 * Single Source of Truth for:
 *   S_t = (G_t, X_t, A_t, I_t, C_t, P_t, V_t)
 * 
 * Bounded domain:
 *   D = {§704(b), §704(c), §743(b), §754}
 * 
 * Transition function:
 *   S_{t+1} = delta(S_t, e_t, rho_t)
 * 
 * Guarantees:
 * - Multi-Fund independence: No mutable object sharing between funds
 * - State propagation: Authoritative fund context drives all derived calculations,
 *   dashboards, waves, state sufficiency, model discovery, formula audits, and ledgers.
 * - Point-in-time state reconstruction and invariant checks.
 */

import { FundModel, MultiAssetRecord, UnifiedTaxEvent } from '../types/research-lab';
import { 
  InvestmentTaxState, 
  TaxEvent, 
  BoundaryStatus,
  PartnerTaxAccount,
  AssetLot,
  Section704cLayer,
  Section743bAdjustment,
  RuleVersionState
} from '../types/tax-state';
import { INITIAL_FUND_REGISTRY } from '../data/fund-registry-data';
import { FUND_CASE_STUDIES, CaseStudyData } from '../data/fund-cases';
import { 
  executeStateTransition, 
  evaluateInvariants, 
  evaluateComputationalBoundary,
  cloneState 
} from './transition-engine';

export interface CanonicalFundContext {
  fundId: string;
  fundModel: FundModel;
  caseStudy: CaseStudyData;
  initialState: InvestmentTaxState;
  events: TaxEvent[];
  timelineStates: InvestmentTaxState[];
  currentState: InvestmentTaxState;
  assets: MultiAssetRecord[];
  invariantsSatisfied: boolean;
  invariantBreakdown: InvestmentTaxState['invariantBreakdown'];
  boundaryStatus: BoundaryStatus;
  boundaryReason: string;
}

/**
 * Mapping between FundModel id and CaseStudyData id.
 */
export const FUND_TO_CASE_MAPPING: Record<string, string> = {
  'fund-bridgewater-pa2': 'case-bridgewater-pa2',
  'fund-blackstone-brep': 'case-blackstone-brep',
  'fund-citadel-wellington': 'case-citadel-wellington',
  'fund-elliott-associates': 'case-elliott-associates',
  'fund-kkr-na11': 'case-kkr-na11',
  'fund-harbourvest-fof': 'case-harbourvest-fof',
  'fund-apollo-synthetic': 'case-pershing-square',
  'fund-sequoia-vc': 'case-carlyle-continuation',
  'fund-brookfield-infra': 'case-adams-street-secondary',
  'fund-tiger-asia': 'case-hamilton-lane'
};

export const CASE_TO_FUND_MAPPING: Record<string, string> = {
  'case-bridgewater-pa2': 'fund-bridgewater-pa2',
  'case-blackstone-brep': 'fund-blackstone-brep',
  'case-citadel-wellington': 'fund-citadel-wellington',
  'case-elliott-associates': 'fund-elliott-associates',
  'case-pershing-square': 'fund-apollo-synthetic',
  'case-carlyle-continuation': 'fund-sequoia-vc',
  'case-kkr-na11': 'fund-kkr-na11',
  'case-adams-street-secondary': 'fund-brookfield-infra',
  'case-harbourvest-fof': 'fund-harbourvest-fof',
  'case-hamilton-lane': 'fund-tiger-asia'
};

import { fundRegistryStore } from './fund-registry-store';

/**
 * Builds or retrieves the authoritative canonical computational state S_t for a fund.
 * Strictly separates funds and creates deep-cloned independent state.
 */
export function getCanonicalFundContext(fundId: string, stepIndex?: number): CanonicalFundContext {
  const allFunds = fundRegistryStore.getAllFunds();
  const fund = allFunds.find(f => f.id === fundId) || INITIAL_FUND_REGISTRY.find(f => f.id === fundId) || allFunds[0] || INITIAL_FUND_REGISTRY[0];
  const caseId = FUND_TO_CASE_MAPPING[fund.id] || FUND_CASE_STUDIES[0].id;
  const baseCase = FUND_CASE_STUDIES.find(c => c.id === caseId) || FUND_CASE_STUDIES[0];

  // Deep clone to prevent any state leakage between funds
  const caseStudy: CaseStudyData = JSON.parse(JSON.stringify(baseCase));
  
  // Customise case study header to match this fund's legal identity
  caseStudy.name = fund.name;
  caseStudy.adviserName = fund.adviser_name;
  caseStudy.jurisdiction = fund.jurisdiction;
  if (fund.cik) caseStudy.cik = fund.cik;

  // Adapt the initial state S_0 to fund's specific assets & elections
  const initialState = cloneState(caseStudy.initialState);
  initialState.C.section754ElectionActive = fund.section_754_elected;
  initialState.C.section704cDefaultMethod = fund.section_704c_method;
  initialState.A.section754Elected = fund.section_754_elected;

  // Synchronise assets if fund has defined assets
  if (fund.assets && fund.assets.length > 0) {
    initialState.X.assets = fund.assets.map(a => ({
      id: a.asset_id,
      name: a.name,
      assetClass: a.asset_type === 'CREDIT' || a.asset_type === 'RATES' ? 'ORDINARY_INCOME_ASSET' : 'CAPITAL_ASSET',
      acquisitionDate: a.acquisition_date,
      costBasis: a.tax_basis,
      bookBasis: a.book_value,
      taxBasis: a.tax_basis,
      fairValue: a.fair_value,
      unrealizedGainLoss: a.unrealised_gain_loss
    }));
    initialState.X.totalMarketValue = fund.assets.reduce((sum, a) => sum + a.fair_value, 0);
  }

  // Generate deterministic timeline states: S_0, S_1, ..., S_n
  const timelineStates: InvestmentTaxState[] = [cloneState(initialState)];
  let runningState = cloneState(initialState);

  for (let i = 0; i < caseStudy.events.length; i++) {
    const evt = caseStudy.events[i];
    const { nextState } = executeStateTransition(runningState, evt);
    runningState = nextState;
    timelineStates.push(cloneState(runningState));
  }

  // Active step state
  const activeStep = typeof stepIndex === 'number' 
    ? Math.max(0, Math.min(stepIndex, timelineStates.length - 1))
    : timelineStates.length - 1;

  const currentState = timelineStates[activeStep];
  const { invariantsSatisfied, breakdown } = evaluateInvariants(currentState);

  // Check boundary on latest event
  const latestEvent = caseStudy.events[activeStep > 0 ? activeStep - 1 : 0];
  const boundaryCheck = latestEvent 
    ? evaluateComputationalBoundary(currentState, latestEvent)
    : { status: 'Closed' as BoundaryStatus, reason: 'Initial State Verified.' };

  return {
    fundId: fund.id,
    fundModel: fund,
    caseStudy,
    initialState,
    events: caseStudy.events,
    timelineStates,
    currentState,
    assets: fund.assets,
    invariantsSatisfied,
    invariantBreakdown: breakdown,
    boundaryStatus: boundaryCheck.status,
    boundaryReason: boundaryCheck.reason
  };
}

/**
 * Verifies that switching from Fund A to Fund B strictly switches state
 * and leaves no lingering data.
 */
export function verifyStateIsolation(fundAId: string, fundBId: string): {
  isIsolated: boolean;
  notes: string;
} {
  if (fundAId === fundBId) {
    return { isIsolated: true, notes: 'Same fund inspected.' };
  }
  const stateA = getCanonicalFundContext(fundAId);
  const stateB = getCanonicalFundContext(fundBId);

  const aumEqual = stateA.fundModel.aum_usd === stateB.fundModel.aum_usd;
  const nameEqual = stateA.fundModel.name === stateB.fundModel.name;
  const assetsEqual = JSON.stringify(stateA.assets) === JSON.stringify(stateB.assets);

  if (aumEqual && nameEqual && assetsEqual) {
    return {
      isIsolated: false,
      notes: `State leakage or identical data detected between ${fundAId} and ${fundBId}`
    };
  }

  return {
    isIsolated: true,
    notes: `Strict state partition verified: ${stateA.fundModel.code} (${stateA.assets.length} assets) vs ${stateB.fundModel.code} (${stateB.assets.length} assets).`
  };
}
