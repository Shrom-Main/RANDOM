/**
 * Formal Type Definitions for POC1 U.S. Investment Tax Temporal State-Transition System
 * D = {§704(b), §704(c), §743(b), §754}
 */

export type DomainRegime = '§704(b)' | '§704(c)' | '§743(b)' | '§754' | 'OUTSIDE_INITIAL_DOMAIN';

export type EntityClassification = 
  | 'Delaware LP' 
  | 'Cayman Ltd' 
  | 'Master Fund LP' 
  | 'Feeder LP' 
  | 'Feeder Offshore Ltd' 
  | 'SPV LLC' 
  | 'Portfolio Co C-Corp' 
  | 'Portfolio Co LLC' 
  | 'Institutional LP' 
  | 'Corporate LP'
  | 'Individual LP'
  | 'Delaware Statutory Trust'
  | 'Tax-Exempt LP' 
  | 'Non-US LP' 
  | 'GP LLC';

export type TaxStatus = 'US_TAXABLE_INDIVIDUAL' | 'US_TAX_EXEMPT_501C' | 'FOREIGN_CORP_W8BEN' | 'FOREIGN_INDIVIDUAL' | 'DOMESTIC_CORP';

export type Section704cMethod = 'TRADITIONAL' | 'CURATIVE' | 'REMEDIAL';

export type BoundaryStatus = 'Closed' | 'Review' | 'Reject';

export type FactStatus = 'OBSERVED' | 'INFERRED' | 'UNKNOWN';

export type FailureClass = 
  | 'Representation' 
  | 'Event' 
  | 'Rule' 
  | 'Ordering' 
  | 'Data' 
  | 'Provenance' 
  | 'Version' 
  | 'Propagation' 
  | 'Calculation' 
  | 'Observability';

export interface BitemporalTimestamp {
  validDate: string;    // tv: when economically / legally effective
  recordDate: string;   // tr: when disclosed in public filing / learned by system
}

export interface EntityNode {
  id: string;
  name: string;
  classification: EntityClassification;
  jurisdiction: string;
  cik?: string;
  ein?: string;
}

export interface RelationshipEdge {
  fromId: string;
  toId: string;
  type: 'OWNS' | 'MANAGES' | 'FEEDS_INTO' | 'INVESTED_IN';
  weight: number; // ownership percentage omega_ij in [0, 1]
  status: FactStatus;
}

/** G_t: Structural State */
export interface StructuralState {
  entities: EntityNode[];
  relationships: RelationshipEdge[];
  isPartitionComplete: boolean; // sum omega_ij == 1
}

/** Asset Lot in Portfolio */
export interface AssetLot {
  id: string;
  name: string;
  assetClass: 'CAPITAL_ASSET' | 'ORDINARY_INCOME_ASSET'; // §755 distinction
  acquisitionDate: string;
  costBasis: number; // economic cost
  bookBasis: number; // 704(b) book value
  taxBasis: number;  // inside tax basis
  fairValue: number; // market value at t
  unrealizedGainLoss: number;
}

/** X_t: Economic Position */
export interface EconomicPosition {
  cash: number;
  assets: AssetLot[];
  totalLiabilities: number;
  totalEconomicCapital: number;
  totalMarketValue: number;
}

/** Section 704(c) Layer */
export interface Section704cLayer {
  propertyId: string;
  contributorPartnerId: string;
  contributionDate: string;
  taxBasisAtContribution: number;
  bookValueAtContribution: number;
  builtInGainLoss: number; // positive = gain, negative = loss
  allocationMethod: Section704cMethod;
  remainingBuiltInGainLoss: number;
  ceilingRuleDistortionActive: boolean;
}

/** Section 743(b) Adjustment Layer for a specific transferee partner */
export interface Section743bAdjustment {
  transfereePartnerId: string;
  effectiveDate: string;
  totalAdjustment: number;
  allocatedCapitalAsset: number;   // under §755(a)(1)
  allocatedOrdinaryAsset: number;  // under §755(a)(2)
  electionSourceId: string; // reference to §754 election
  status: 'ACTIVE' | 'UTILIZED' | 'PENDING_DETERMINATION';
}

/** Partner Tax Capital Account */
export interface PartnerTaxAccount {
  partnerId: string;
  partnerName: string;
  taxStatus: TaxStatus;
  ownershipPercentage: number;
  bookCapital704b: number;      // §704(b) capital account
  insideTaxBasisShare: number;   // partner's share of inside tax basis
  outsideTaxBasis: number;       // partner's outside basis in partnership interest
  section743bAdjustment: number; // net unamortized §743(b) adjustment
  section704cBuiltInGain: number;// unamortized 704(c) gain assigned to partner
}

/** A_t: Tax Attributes */
export interface TaxAttributeState {
  section754Elected: boolean;
  section754EffectiveYear?: number;
  substantialBuiltInLoss743d: boolean; // mandatory if > $250k built-in loss
  partnerAccounts: PartnerTaxAccount[];
  section704cLayers: Section704cLayer[];
  section743bAdjustments: Section743bAdjustment[];
}

/** I_t: Investor Context */
export interface InvestorContext {
  id: string;
  name: string;
  taxClassification: TaxStatus;
  withholdingRequired: boolean;
  foreignJurisdiction?: string;
  eciSubject: boolean;
}

/** C_t: Constraints and Elections */
export interface ConstraintsAndElections {
  section754ElectionActive: boolean;
  section704cDefaultMethod: Section704cMethod;
  hasDeficitRestorationObligation: boolean;
  hasQualifiedIncomeOffset: boolean;
  disallowedAllocations: string[];
}

/** P_t: Provenance Mapping */
export interface ProvenanceRecord {
  id: string;
  targetVariable: string;
  sourceDocument: string;
  extractedFact: string;
  applicableRule: string;
  ruleVersion: string;
  transitionOperation: string;
  recordTimestamp: string;
}

/** V_t: Rule & Version State */
export interface RuleVersionState {
  statutoryVersion: string; // e.g. "IRC 1986 as amended through 2024"
  regVersion704b: string;   // e.g. "Treas. Reg. § 1.704-1(b) (TD 8385)"
  regVersion704c: string;   // e.g. "Treas. Reg. § 1.704-3 (TD 8500)"
  regVersion743: string;    // e.g. "Treas. Reg. § 1.743-1 (TD 8847)"
  regVersion755: string;    // e.g. "Treas. Reg. § 1.755-1 (TD 8847)"
  tCJA2017Active: boolean;
}

/** Complete State Tuple: S_t = (G_t, X_t, A_t, I_t, C_t, P_t, V_t) */
export interface InvestmentTaxState {
  t: number;
  timestamp: BitemporalTimestamp;
  G: StructuralState;
  X: EconomicPosition;
  A: TaxAttributeState;
  I: InvestorContext[];
  C: ConstraintsAndElections;
  P: ProvenanceRecord[];
  V: RuleVersionState;
  invariantsSatisfied: boolean;
  invariantBreakdown: {
    partitionInvariant: boolean;    // sum(omega_ij) == 1
    balanceSheetInvariant: boolean;  // Assets == Liab + Equity
    outsideInsideBasisDelta: number;// sum(outside) - sum(inside) - sum(743b)
    bookTaxCapitalDelta: number;    // sum(704b book) - sum(tax basis) - sum(704c)
  };
}

export type EventType = 
  | 'Formation'
  | 'CapitalContribution'
  | 'AssetAcquisition'
  | 'InvestorAdmission'
  | 'AssetRevaluation'
  | 'AssetDisposition'
  | 'PartnerTransfer'
  | 'Distribution'
  | 'ContinuationVehicleTransfer'
  | 'HistoricalCorrection';

export interface TaxEvent {
  id: string;
  sequenceNumber: number;
  type: EventType;
  fundName: string;
  entityId: string;
  timestamp: BitemporalTimestamp;
  scope: string[]; // affected entities, partners, or assets
  economicFacts: {
    amount?: number;
    fairValue?: number;
    bookValue?: number;
    taxBasis?: number;
    unitsOrPercentage?: number;
    assetName?: string;
    assetClass?: 'CAPITAL_ASSET' | 'ORDINARY_INCOME_ASSET';
    transfereeId?: string;
    transferorId?: string;
    purchasePrice?: number;
  };
  taxFacts: {
    section754InEffect?: boolean;
    section704cMethod?: Section704cMethod;
    builtInGainLoss?: number;
    reportedTaxGainLoss?: number;
    reportedBookGainLoss?: number;
  };
  evidenceSource: {
    documentTitle: string;
    filingType: string; // Form ADV, Form D, Form D/A, 13F, Partnership Agreement
    filingDate: string;
    cik?: string;
    accessionNumber?: string;
    url?: string;
    evidenceConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
    status: FactStatus;
  };
  relevantDomain: DomainRegime;
  boundaryStatus: BoundaryStatus;
  boundaryReason?: string;
  humanDeterminationRequired?: boolean;
  humanDeterminationId?: string;
  notes: string;
}

export interface HumanDetermination {
  id: string;
  eventId: string;
  triggerCondition: string;
  question: string;
  options: {
    id: string;
    label: string;
    description: string;
    statutoryBasis: string;
    consequence: string;
  }[];
  selectedOptionId?: string;
  determinedBy?: string;
  determinationDate?: string;
  rationale?: string;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED';
}

export interface DependencyNode {
  id: string;
  label: string;
  type: 'EVIDENCE' | 'FACT' | 'RULE' | 'STATE_VARIABLE' | 'WORKPAPER_OUTPUT';
  value: string | number;
  domain: DomainRegime;
  hasChanged?: boolean;
}

export interface DependencyEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  reachabilityMap: Record<string, string[]>;
}

export interface PropagationMetrics {
  eventId: string;
  breadth: number; // |A(e)| number of changed state variables
  depth: number;   // max dist(e, x_j) longest dependency path
  reach: string[]; // list of reachable variables
  amplification: number; // |delta Y| / |delta S_0|
  affectedCalculations: string[];
  affectedReports: string[];
  unaffectedOutputs: string[];
  computationalBoundaryCrossed: boolean;
}

export interface ReplayComparison {
  isIdentical: boolean;
  incrementalStateHash: string;
  replayStateHash: string;
  maxDiscrepancyTolerance: number;
  discrepancies: {
    variablePath: string;
    incrementalValue: number | string;
    replayValue: number | string;
    delta: number;
    failureCategory: FailureClass;
    rootCause: string;
  }[];
}

export interface CommutativityTestResult {
  eventA: TaxEvent;
  eventB: TaxEvent;
  orderABFinalStateHash: string;
  orderBAFinalStateHash: string;
  commutes: boolean;
  divergentVariables: {
    variable: string;
    valAB: number;
    valBA: number;
    difference: number;
    taxSignificance: string;
  }[];
  reason: string;
}

export interface WorkpaperProjections {
  scheduleK1: {
    partnerId: string;
    partnerName: string;
    ownershipPct: number;
    ordinaryBusinessIncome: number;
    netLongTermCapitalGain: number;
    section743bAdjustmentBox20U: number;
    endingCapitalAccount704b: number;
    endingTaxBasisCapital: number;
    netDisparity: number;
  }[];
  section704cSchedule: {
    propertyId: string;
    contributor: string;
    originalDisparity: number;
    priorAmortization: number;
    currentPeriodAllocation: number;
    remainingBuiltInGain: number;
    ceilingRuleShortfall: number;
  }[];
  section743bSchedule: {
    transferee: string;
    totalStepUp: number;
    ordinaryIncomeStepUp: number;
    capitalGainStepUp: number;
    currentYearOffset: number;
    remainingAdjustment: number;
  }[];
}
