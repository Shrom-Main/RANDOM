/**
 * Global Temporal Investment Graph Type Definitions
 * In accordance with POC1 Extension Specification (Sections 1 - 85)
 * G_t = (V_t, E_t, \Theta_t, \tau_t, \omega_t)
 */

export type GlobalNodeType = 
  | 'FUND'
  | 'INVESTOR'
  | 'INVESTMENT_ADVISER'
  | 'GENERAL_PARTNER'
  | 'PORTFOLIO_COMPANY'
  | 'SECURITY'
  | 'ASSET'
  | 'SUBSIDIARY'
  | 'SPV'
  | 'MASTER_FUND'
  | 'FEEDER_FUND'
  | 'FUND_OF_FUNDS'
  | 'EXCHANGE'
  | 'JURISDICTION'
  | 'ADMINISTRATOR';

export type GlobalEdgeType =
  | 'LegalOwnership'       // A Owns B
  | 'EconomicInterest'    // A has economic exposure in B
  | 'Controls'            // A voting/control over B
  | 'Consolidates'        // A consolidates B for financial reporting
  | 'Manages'             // Adviser manages Fund
  | 'GP'                  // General Partner relationship
  | 'LP'                  // Limited Partner investment
  | 'InvestsIn_Master'    // Feeder invests in Master fund
  | 'InvestsIn_FoF'       // Fund of Funds invests in Underlying Fund
  | 'Holds_Security'      // Entity holds security
  | 'Issued_Security'     // Issuer issued security
  | 'Investment_Portfolio'// Fund investment in portfolio company
  | 'Subsidiary'          // Parent subsidiary child
  | 'AdvisedBy'           // Fund advised by adviser
  | 'AdministeredBy';     // Custody / administration relationship

export interface GlobalIdentifier {
  lei?: string;           // Legal Entity Identifier (GLEIF)
  cik?: string;           // SEC Central Index Key
  ticker?: string;        // Stock exchange symbol
  isin?: string;          // International Securities Identification Number
  figi?: string;          // Financial Instrument Global Identifier
  cusip?: string;         // CUSIP where usable
  localRegistrationId?: string; // e.g. Companies House CRN, ACRA UEN
}

export interface JurisdictionProfile {
  code: string;           // ISO 3166-1 alpha-2 or alpha-3 (e.g., US, GB, KY, LU, SG, DE, JP, IN)
  name: string;
  isTaxHavenOrFavorable: boolean;
  withholdingTaxRateDividends: number; // e.g. 0.30 for US non-treaty, 0.15 treaty
  withholdingTaxRateInterest: number;
  corporateTaxRate: number;
  treatiesWith: string[]; // List of jurisdiction codes with bilateral tax treaties
}

export interface BitemporalSpan {
  validStart: string;     // tv_start: when economically/legally effective
  validEnd?: string;      // tv_end: when transaction or status ceased
  recordStart: string;    // tr_start: when publicly observable (e.g. EDGAR filing date)
  recordEnd?: string;     // tr_end: when amended or superseded
}

export interface GlobalNode {
  id: string;
  name: string;
  type: GlobalNodeType;
  identifiers: GlobalIdentifier;
  legalDomicile: string;  // country code
  taxResidence: string;   // Legal Domicile != Tax Residence
  formationYear: number;
  aumOrMarketCap?: number;// in USD
  isPubliclyObservable: boolean;
  observabilityStatus: 'FULLY_OBSERVABLE' | 'PARTIALLY_OBSERVABLE' | 'NON_OBSERVABLE';
  description?: string;
}

export interface GlobalEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: GlobalEdgeType;
  weight: number;         // percentage in [0, 1] or nominal allocation
  isDerived: boolean;     // DERIVED vs OBSERVED (Sec. 11)
  isMultiplicative: boolean; // supports multiplication only when economic interpretation holds
  metadata: {
    governingAgreement?: string;
    shareClass?: string;
    votingPercentage?: number;
    economicPercentage?: number;
    carryingValue?: number;
    currency?: string;
  };
  temporalSpan: BitemporalSpan;
  sourceEvidence: {
    sourceName: string;   // SEC EDGAR, GLEIF Level-2, Companies House, etc.
    documentType: string; // 10-K, Form ADV, Form D, 13F, Schedule 13D
    accessionNumber?: string;
    filingDate: string;
    confidence: number;   // 0.0 to 1.0 match confidence
  };
}

export interface GlobalGraphState {
  year: number;
  date: string;
  nodes: GlobalNode[];
  edges: GlobalEdge[];
  metrics: {
    nodeCount: number;
    edgeCount: number;
    averageDegree: number;
    maxDegree: number;
    graphDepth: number;
    connectedComponents: number;
    branchingFactor: number;
  };
}

export interface IndirectExposurePath {
  sourceId: string;
  targetId: string;
  hops: number;
  pathNodes: GlobalNode[];
  pathEdges: GlobalEdge[];
  directOwnership: number;
  pathBasedExposure: number; // multiplied where valid
  economicExposure: number;
  controlExposure: number;
  isMultiplicationValid: boolean;
  withholdingPoints: { fromJurisdiction: string; toJurisdiction: string; rate: number }[];
  taxDependencyFlags: string[];
}
