/**
 * POC 1 — Master Entity Hierarchy & State Ontology
 * 
 * Strict Separation of Entity State from Fund State:
 * Organisation / Manager
 *   → Fund
 *   → Legal Entity
 *   → Vehicle
 *   → Investor
 *   → Asset
 *   → Position
 *   → Event
 *   → Tax State
 *   → Economic State
 * 
 * Includes:
 * - Stable IDs & Cross-Fund Entity Relationships
 * - Cascading Filter Dimensions
 * - First-Class Debt Tracking Model
 * - Multi-Exchange Market Movement & Freshness Layer
 * - Mechanical Computation vs Human Determination Breakdown
 */

import { AssetClass, TaxCharacter } from './research-lab';
import { EntityClassification, TaxStatus, Section704cMethod } from './tax-state';

export type FreshnessStatus = 'LIVE' | 'FRESH' | 'STALE' | 'UNAVAILABLE';
export type EpistemicStatus = 'OBSERVED_FACT' | 'CALCULATED_VALUE' | 'MODELLED_VALUE' | 'STALE_VALUE' | 'UNAVAILABLE';
export type FactCertainty = 'KNOWN' | 'INFERRED' | 'UNAVAILABLE';

// -------------------------------------------------------------
// 1. ORGANISATION / ASSET MANAGER LEVEL
// -------------------------------------------------------------
export interface OrganisationNode {
  id: string; // e.g. "ORG-BRIDGEWATER", "ORG-BLACKSTONE", "ORG-CITADEL"
  name: string;
  shortName: string;
  headquarters: string;
  jurisdiction: string;
  sponsorType: 'ASSET_MANAGER' | 'GP_SPONSOR' | 'INSTITUTIONAL_ALLOCATOR' | 'FAMILY_OFFICE';
  cik?: string;
  lei?: string;
  primaryContact?: string;
  regulatoryJurisdictions: string[];
  totalOrgAumUsd: number;
  fundIds: string[];
  entityIds: string[];
}

// -------------------------------------------------------------
// 2. LEGAL ENTITY LEVEL (Independent from Funds)
// -------------------------------------------------------------
export interface LegalEntityNode {
  id: string; // e.g. "ENT-BW-MASTER-01", "ENT-BX-BREP9-HOLDCO"
  organisationId: string;
  name: string;
  legalClassification: EntityClassification;
  jurisdiction: string;
  incorporationDate: string;
  taxResidency: string;
  ein?: string;
  cik?: string;
  lei?: string;
  isPassThrough: boolean; // Partnership / Disregarded for US tax
  participatingFundIds: string[]; // Many-to-many: entity can participate in multiple funds!
  isMasterFeeder: boolean;
  parentEntityId?: string;
  provenance: {
    sourceDocument: string;
    verifiedDate: string;
    verifiedBy: string;
  };
}

// -------------------------------------------------------------
// 3. VEHICLE LEVEL (SPVs, Blocker Corps, Co-Invest Vehicles)
// -------------------------------------------------------------
export interface VehicleNode {
  id: string; // e.g. "VEH-BW-SPV-FX", "VEH-BX-DELAWARE-BLOCKER"
  legalEntityId: string;
  fundId: string;
  name: string;
  vehicleType: 'ONSHORE_FEEDER' | 'OFFSHORE_FEEDER' | 'MASTER_FUND' | 'SPV' | 'BLOCKER_CORP' | 'CO_INVEST' | 'PARALLEL_VEHICLE';
  currency: string;
  navUsd: number;
  taxClassification: TaxStatus;
  checkTheBoxElectionMade: boolean;
  section754Elected: boolean;
  participatingInvestorIds: string[];
  holdingAssetIds: string[];
}

// -------------------------------------------------------------
// 4. INVESTOR LEVEL (Investor Relations State)
// -------------------------------------------------------------
export interface InvestorNode {
  id: string; // e.g. "INV-CALPERS-01", "INV-ADIA-02", "INV-PRINCIPAL-03"
  name: string;
  classification: 
    | 'US_TAX_EXEMPT_501C3' 
    | 'FOREIGN_SOVEREIGN_WEALTH' 
    | 'DOMESTIC_INDIVIDUAL_LP' 
    | 'FOREIGN_NONRESIDENT_ALIEN' 
    | 'DOMESTIC_C_CORP' 
    | 'GRANTOR_TRUST' 
    | 'GP_INSIDER';
  jurisdiction: string;
  taxResidency: string;
  w8OrW9OnFile: boolean;
  withholdingTaxRate: number; // e.g. 0.0 or 0.30 or treaty rate
  commitmentsByFund: Record<string, {
    totalCommitmentUsd: number;
    calledCapitalUsd: number;
    distributionsUsd: number;
    unfundedCommitmentUsd: number;
    ownershipInterestPct: number;
    votingControlPct: number;
    bookCapital704b: number;
    taxBasisCapital705: number;
    section704cBuiltInGain: number;
    section743bStepUp: number;
    eciExposureUsd: number;
    ubtiExposureUsd: number;
    pficExposureUsd: number;
    reportingK1Status: 'ISSUED' | 'DRAFT' | 'PENDING_AUDIT';
    epistemicCertainty: FactCertainty;
  }>;
  participatingFundIds: string[];
  provenance: {
    subscriptionAgreementRef: string;
    taxFormRef: string;
    verifiedTimestamp: string;
  };
}

// -------------------------------------------------------------
// 5. DEBT TRACKING LEVEL (First-Class Computational State)
// -------------------------------------------------------------
export interface DebtInstrumentState {
  id: string; // e.g. "DEBT-BX-SUBSCRIPTION-LINE", "DEBT-CIT-REPO-FACILITY"
  fundId: string;
  borrowerEntityId: string;
  lenderName: string;
  facilityType: 'SUBSCRIPTION_CREDIT_LINE' | 'TERM_LOAN' | 'MEZZANINE_DEBT' | 'REPO_FACILITY' | 'PROMISSORY_NOTE';
  principalAmountUsd: number;
  currency: string;
  interestRateType: 'FIXED' | 'FLOATING';
  baseRateName?: 'SOFR' | 'EURIBOR' | 'ESTR' | 'RBI_REPO';
  marginBps: number;
  effectiveRatePct: number;
  originationDate: string;
  maturityDate: string;
  leverageRatio: number; // Debt / Total Assets
  collateralDescription: string;
  isRecourseToGeneralPartner: boolean; // §752 recourse vs nonrecourse vs qualified nonrecourse
  debtClassification752: 'RECOURSE' | 'NONRECOURSE' | 'QUALIFIED_NONRECOURSE';
  annualInterestExpenseUsd: number;
  section163jInterestCapApplies: boolean;
  section163jDisallowedInterestUsd: number;
  refinancingHistory: {
    eventDate: string;
    priorPrincipal: number;
    newPrincipal: number;
    rateChange: string;
    provenanceRef: string;
  }[];
  dataFreshness: FreshnessStatus;
  epistemicStatus: EpistemicStatus;
  provenance: {
    creditAgreementAccession: string;
    verifiedDate: string;
    effectiveDate: string;
  };
}

// -------------------------------------------------------------
// 6. MARKET MOVEMENT & VALUATION OBSERVATION LAYER
// -------------------------------------------------------------
export interface MarketObservationPoint {
  id: string;
  assetId: string;
  symbol: string;
  exchange: 'NYSE' | 'NASDAQ' | 'CME' | 'EURONEXT' | 'XETRA' | 'NSE' | 'OTC' | 'PRIVATE_APPRAISAL';
  timestamp: string;
  price: number;
  currency: string;
  dailyChangePct: number;
  fxRateToUsd: number;
  benchmarkYieldPct?: number;
  creditSpreadBps?: number;
  navPerShare?: number;
  epistemicStatus: EpistemicStatus; // OBSERVED vs CALCULATED vs MODELLED vs STALE vs UNAVAILABLE
  sourceProvider: 'ALPACA_US' | 'SEC_EDGAR_10Q' | 'EULERPOOL_EUR' | 'GITHUB_NSE_INDIA' | 'VALUATION_AGENT';
  stalenessHours: number;
  confidenceScore: number; // 0 to 1
  impactOnTaxState: {
    section1256MarkToMarketGainLoss: number;
    unrealizedBookTaxDisparityChange: number;
    withholdingExposureUpdate: number;
  };
}

// -------------------------------------------------------------
// 7. CASCADING FILTER SELECTION STATE
// -------------------------------------------------------------
export interface CascadingFilterState {
  managerId: string; // 'ALL' or specific ORG-id
  fundId: string;    // 'ALL' or specific fund-id
  entityId: string;  // 'ALL' or specific ENT-id
  vehicleId: string; // 'ALL' or specific VEH-id
  investorId: string;// 'ALL' or specific INV-id
  assetClass: string;// 'ALL' or specific AssetClass
  assetId: string;   // 'ALL' or specific AST-id
  timeHorizon: 'ALL' | '1Y' | '3Y' | '5Y' | 'SINCE_INCEPTION';
  epistemicFilter: 'ALL' | 'OBSERVED_ONLY' | 'INCLUDING_INFERRED';
}

// -------------------------------------------------------------
// 8. MECHANICAL DETERMINABILITY VS HUMAN DETERMINATION
// -------------------------------------------------------------
export interface MechanicalDeterminabilityAudit {
  fundId: string;
  totalAttributesCount: number;
  mechanicallyDeterminableCount: number;
  humanDeterminationRequiredCount: number;
  mechanicalCompletenessRatio: number; // e.g. 0.88 (88% mechanically determinable)
  status: 'CLOSED_MECHANICAL' | 'REVIEW_HUMAN_REQUIRED' | 'REJECT_UNSOLVABLE';
  
  deterministicProjections: {
    statute: '§704(b)' | '§704(c)' | '§743(b)' | '§754' | '§752' | '§163(j)';
    description: string;
    formula: string;
    result: string;
    isInvariantPreserved: boolean;
  }[];

  humanDeterminationsRequired: {
    id: string;
    issueTitle: string;
    statutoryAmbiguityReason: string;
    sourceDocument: string;
    suggestedJudicialPrecedent: string;
    optionsForHumanResolution: string[];
    selectedResolution?: string;
  }[];
}
