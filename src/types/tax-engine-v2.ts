/**
 * POC 1 — Computational Investment Tax Engine: Comprehensive Domain Model (v2)
 *
 * Models:
 * 1. Entities & Effective-Dated Classifications (Master, Feeder, Blocker, SPV, CFC, PFIC, REIT, GP, LP)
 * 2. Financial Investments & Decomposed Tax Lots
 * 3. Immutable Bitemporal Event Sourcing (Valid Time vs System Record Time)
 * 4. Deterministic Tax Calculations:
 *    - §704(b) Book vs Tax Capital Allocations
 *    - §704(c) Built-In Gain Layers & Ceiling Rule Mechanics (Traditional, Curative, Remedial)
 *    - §754 Election, §743(b) Transferee Basis Step-Up, §755 Ordinary/Capital Allocation
 *    - Partner Death / §1014 Basis Step-Up Scenario
 *    - §734(b) Partnership-Level Distribution Basis Adjustments
 *    - §751 Hot Assets (Unrealized Receivables & Inventory)
 *    - §752 Recourse/Nonrecourse Debt & Deemed Distributions
 *    - §163(j) Entity-Aware Business Interest Limitation (ATI & EBIE)
 *    - International Tax (PFIC QEF, CFC Subpart F, ECI, UBTI, §1446(f) Withholding)
 * 5. Book-to-Tax Schedule M-1 / M-3 Bridge
 * 6. Audit Lineage & Provenance Chains
 * 7. 5 Formal Reconciliation Controls (CONTINUE / REVIEW / REJECT)
 * 8. 25-Step Guided Flagship Demonstration Milestones
 */

export type EntityRole = 
  | 'MASTER_FUND'
  | 'FEEDER_DOMESTIC'
  | 'FEEDER_OFFSHORE'
  | 'BLOCKER_CORP'
  | 'MGMT_COMPANY'
  | 'SPV_HOLDING'
  | 'PORTFOLIO_COMPANY'
  | 'OPERATING_PARTNERSHIP'
  | 'FOREIGN_CORP'
  | 'CFC_ENTITY'
  | 'PFIC_FUND'
  | 'REIT_TRUST'
  | 'INVESTOR_US_LP'
  | 'INVESTOR_FOREIGN_LP'
  | 'INVESTOR_TAX_EXEMPT_LP'
  | 'INVESTOR_GP';

export type TaxClassification =
  | 'PARTNERSHIP_DE'
  | 'PARTNERSHIP_LP'
  | 'DISREGARDED_ENTITY'
  | 'DOMESTIC_C_CORP'
  | 'FOREIGN_CORP_CHECK_THE_BOX'
  | 'REGULATED_INVESTMENT_CO'
  | 'REIT'
  | 'FOREIGN_PASS_THROUGH'
  | 'INDIVIDUAL_TAXABLE'
  | 'TAX_EXEMPT_501C3';

export interface BitemporalTime {
  validDate: string;    // When economically / legally effective
  systemDate: string;   // When system recorded the fact
}

export interface InvestmentTaxEntity {
  id: string;
  name: string;
  legalType: string;
  jurisdiction: string;
  role: EntityRole;
  taxClassification: TaxClassification;
  effectiveDate: string;
  parentEntityId?: string;
  taxIdOrEin?: string;
  ownershipPercentage: number;
  totalCommittedCapital: number;
  currentBookCapital: number;
  currentTaxCapital: number;
  outsideTaxBasis: number;
  section754ElectionActive: boolean;
  withholdingStatus: 'EXEMPT' | 'W8BEN_E_30PCT' | 'TREATY_REDUCED_15PCT' | 'ECI_37PCT';
  ubtiSubject: boolean;
  pficQefElected: boolean;
}

export type AssetClassType =
  | 'COMMON_STOCK'
  | 'PREFERRED_STOCK'
  | 'PARTNERSHIP_INTEREST'
  | 'LLC_MEMBERSHIP_UNIT'
  | 'CORPORATE_DEBT'
  | 'TREASURY_NOTE'
  | 'PFIC_OFFSHORE_SHARE'
  | 'REIT_SHARE'
  | 'EQUITY_SWAP'
  | 'CALL_OPTION';

export interface TaxLot {
  lotId: string;
  instrumentId: string;
  instrumentName: string;
  acquisitionDate: string;
  quantity: number;
  acquisitionPrice: number;
  totalCostBasis: number;
  currentFairValue: number;
  currentTaxBasis: number;
  currentBookBasis: number;
  unrealizedGainLoss: number;
  holdingPeriodDays: number;
  character: 'SHORT_TERM_CAPITAL' | 'LONG_TERM_CAPITAL' | 'SECTION_1231' | 'ORDINARY_SECTION_751';
  linkedEntityId: string;
  washSaleDisallowed: boolean;
  provenanceDocument: string;
}

export interface InvestmentAsset {
  id: string;
  name: string;
  tickerOrSymbol: string;
  issuerName: string;
  assetClass: AssetClassType;
  jurisdiction: string;
  totalQuantity: number;
  currentFairValue: number;
  totalTaxBasis: number;
  totalBookBasis: number;
  lots: TaxLot[];
  isSection751HotAsset: boolean;
  ordinaryIncomeRecapture: number;
  holdingEntityId: string;
}

export type TaxEventType =
  | 'FUND_FORMATION'
  | 'CAPITAL_CONTRIBUTION'
  | 'ASSET_ACQUISITION'
  | 'SECTION_704C_CONTRIBUTION'
  | 'DEBT_ISSUANCE'
  | 'INTEREST_EXPENSE_INCURRED'
  | 'PARTNER_TRANSFER'
  | 'PARTNER_DEATH_TRANSFER'
  | 'SECTION_754_ELECTION_FILED'
  | 'SECTION_743B_CALCULATION'
  | 'SECTION_755_ALLOCATION'
  | 'CASH_DISTRIBUTION'
  | 'PROPERTY_DISTRIBUTION'
  | 'SECTION_734B_ADJUSTMENT'
  | 'PFIC_QEF_INCLUSION'
  | 'WITHHOLDING_REMITTANCE'
  | 'HISTORICAL_REPLAY_CORRECTION';

export interface ImmutableTaxEvent {
  eventId: string;
  eventType: TaxEventType;
  sequenceNumber: number;
  timestamp: BitemporalTime;
  entityId: string;
  investorId?: string;
  instrumentId?: string;
  amount: number;
  currency: string;
  taxBasisBefore: number;
  taxBasisAfter: number;
  bookBasisBefore: number;
  bookBasisAfter: number;
  sourceDocument: string;
  sourceLocation: string;
  confidenceScore: number;
  isHumanVerified: boolean;
  ruleVersion: string;
  affectedVariables: string[];
  downstreamCalculationIds: string[];
  narrative: string;
}

// -------------------------------------------------------------
// DETERMINISTIC TAX ENGINE STATE STRUCTURES
// -------------------------------------------------------------

export interface Section704cCeilingModel {
  layerId: string;
  propertyId: string;
  contributingPartnerId: string;
  contributedDate: string;
  bookValueAtContribution: number;
  taxBasisAtContribution: number;
  builtInGainLoss: number;
  allocationMethod: 'TRADITIONAL' | 'CURATIVE' | 'REMEDIAL';
  annualBookDepreciation: number;
  actualTaxDepreciationAvailable: number;
  nonContributingBookAllocation: number;
  nonContributingTaxAllocation: number;
  contributingPartnerTaxAllocation: number;
  ceilingRuleDistortionAmount: number; // Disparity when actual tax < non-contributing book
  curativeAllocationAmount: number;
  remedialNotionalGain: number;
  remedialNotionalDeduction: number;
  remainingDisparity: number;
}

export interface Section743bStepUpModel {
  transferEventId: string;
  transfereePartnerId: string;
  transferorPartnerId: string;
  effectiveDate: string;
  transferReason: 'PURCHASE_SALE' | 'DEATH_IRC_1014' | 'GIFT';
  outsidePurchasePriceOrFmv: number;
  transfereeShareOfInsideBasis: number;
  grossSection743bAdjustment: number; // Outside - Inside Share
  isSection754InEffect: boolean;
  section755Allocation: {
    capitalAssetPortion: number;   // Under §755(a)(1)
    ordinaryAssetPortion: number;  // Under §755(a)(2) §751
  };
  annualPartnerSpecificDepreciation: number;
  taxShieldOnAssetSale: number;
  auditChainDescription: string[];
}

export interface Section163jModel {
  entityId: string;
  taxYear: number;
  businessInterestExpense: number;
  businessInterestIncome: number;
  adjustedTaxableIncomeAti: number;
  atiLimit30Percent: number; // 30% of ATI
  allowableInterestDeduction: number;
  excessBusinessInterestExpenseEbie: number; // Disallowed carryforward
  allocatedToPartners: { partnerId: string; ebieShare: number }[];
  tieredPassThroughCapacity: number;
}

export interface BookToTaxBridgeItem {
  id: string;
  category: 'DEPRECIATION' | 'SECTION_704C' | 'SECTION_743B' | 'SECTION_163J' | 'PFIC_QEF' | 'MUNI_INTEREST' | 'WITHHOLDING';
  label: string;
  bookAmount: number;
  taxAmount: number;
  adjustmentAmount: number;
  isPermanent: boolean;
  governingCode: string;
  underlyingDocument: string;
}

export interface ReconciliationStatus {
  k1TotalMatchesTaxableIncome: boolean;
  investorAllocationsSumTo100: boolean;
  taxCapitalRollforwardBalances: boolean;
  bookToTaxBridgeReconciled: boolean;
  taxLotsDisposalsReconciled: boolean;
  overallControlStatus: 'CONTINUE' | 'REVIEW' | 'REJECT';
  activeExceptions: { id: string; severity: 'CRITICAL' | 'WARNING' | 'INFO'; message: string; ruleId: string }[];
}

// -------------------------------------------------------------
// 25-STEP GUIDED DEMO SCRIPT MILESTONE
// -------------------------------------------------------------
export interface DemonstrationStep {
  stepNumber: number;
  title: string;
  category: 'FORMATION' | 'ALLOCATION' | 'TRANSFER_DEATH' | 'BASIS_754' | 'DISTRIBUTION' | 'DEBT_163J' | 'INTERNATIONAL' | 'AUDIT_SCENARIO';
  description: string;
  governingStatute: string;
  treasuryRegulation: string;
  affectedEntities: string[];
  calculationSummary: string;
  formulaKatex: string;
  auditTrailChain: string[];
  reconciliationStatus: 'CONTINUE' | 'REVIEW' | 'REJECT';
}
