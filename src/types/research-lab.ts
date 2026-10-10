/**
 * POC 1 — Computational Investment Tax Research Laboratory
 * Master Type Definitions:
 * - Multi-Fund Registry & Research Universe
 * - Multi-Asset Base & Extensions (18 Asset Classes)
 * - Market Data Abstraction (Observation != Tax Fact)
 * - Unified Event Store & Point-in-Time State Reconstruction
 * - State Sufficiency & Error Graph Engine
 * - Mathematical Approximation & Model Discovery Engine
 * - Correlation & Divergence Engine
 * - Tax Authority Library & Rule Graph
 * - Research Notebook & Observation Store
 * - Specialised Research Agent Team & TinyFish Ingestion
 */

export type FundType = 
  | 'Hedge Fund'
  | 'Private Equity'
  | 'Venture Capital'
  | 'Credit Fund'
  | 'Real Estate Fund'
  | 'Infrastructure Fund'
  | 'Fund-of-Funds'
  | 'Multi-strategy Fund'
  | 'Public Markets Fund'
  | 'Family Office'
  | 'Custom';

export type AssetClass =
  | 'EQUITY'
  | 'FIXED_INCOME'
  | 'RATES'
  | 'CREDIT'
  | 'FX'
  | 'COMMODITY'
  | 'FUTURES'
  | 'OPTIONS'
  | 'SWAP'
  | 'ETF'
  | 'REIT'
  | 'PRIVATE_EQUITY'
  | 'VENTURE_CAPITAL'
  | 'INFRASTRUCTURE'
  | 'REAL_ESTATE'
  | 'PARTNERSHIP_INTEREST'
  | 'FOREIGN_SECURITY'
  | 'DIGITAL_ASSET';

export type TaxCharacter =
  | 'LONG_TERM_CAPITAL_GAIN'
  | 'SHORT_TERM_CAPITAL_GAIN'
  | 'SECTION_1256_60_40'
  | 'QUALIFIED_DIVIDEND'
  | 'ORDINARY_INCOME'
  | 'PORTFOLIO_INTEREST_EXEMPT'
  | 'TAX_EXEMPT_MUNICIPAL'
  | 'RETURN_OF_CAPITAL'
  | 'SECTION_988_FX'
  | 'UBTI_INCOME'
  | 'PFIC_EXCESS_DISTRIBUTION'
  | 'SECTION_1202_QSBS';

// ==========================================
// 1. MULTI-ASSET BASE & EXTENSIONS SCHEMA
// ==========================================
export interface BaseAsset {
  asset_id: string;
  asset_type: AssetClass;
  name: string;
  issuer: string;
  currency: string;
  jurisdiction: string;
  market: string;
  sector: string;
  acquisition_date: string;
  quantity: number;
  price: number;
  market_value: number;
  book_value: number;
  tax_basis: number;
  fair_value: number;
  tax_character: TaxCharacter;
  holding_period_days: number;
  fund_id: string;
  entity_id: string;
  unrealised_gain_loss: number;
  realised_gain_loss_ytd: number;
  withholding_rate: number;
}

export interface EquityAssetExtension {
  ticker: string;
  exchange: string;
  shares: number;
  dividend_yield: number;
  fpi_ownership_pct?: number;
  section_1202_eligible?: boolean;
}

export interface BondAssetExtension {
  coupon_rate: number;
  maturity_date: string;
  yield_to_maturity: number;
  duration_years: number;
  oid_accrued: number;
  market_discount: number;
  is_portfolio_interest_exempt: boolean;
}

export interface DerivativeAssetExtension {
  underlying_symbol: string;
  strike_price?: number;
  expiration_date: string;
  notional_value: number;
  direction: 'LONG' | 'SHORT';
  is_section_1256: boolean;
  delta?: number;
}

export interface PartnershipAssetExtension {
  partnership_name: string;
  ownership_percentage: number;
  capital_account_704b: number;
  inside_tax_basis: number;
  outside_tax_basis: number;
  section_754_active: boolean;
  section_704c_unallocated_gain: number;
  section_743b_adjustment: number;
  has_hot_assets_751: boolean;
}

export interface ReitAssetExtension {
  reit_status: 'DOMESTIC_EQUITY_REIT' | 'MORTGAGE_REIT' | 'FOREIGN_REIT';
  section_199a_qualified_pct: number;
  capital_gain_distribution_pct: number;
  return_of_capital_pct: number;
}

export interface PficAssetExtension {
  pfic_status: 'ACTIVE_PFIC' | 'NON_PFIC';
  election: 'QEF' | 'MARK_TO_MARKET' | 'SECTION_1291_DEFAULT';
  election_year: number;
  excess_distribution_exposure: number;
}

export type MultiAssetRecord = BaseAsset & {
  equity?: EquityAssetExtension;
  bond?: BondAssetExtension;
  derivative?: DerivativeAssetExtension;
  partnership?: PartnershipAssetExtension;
  reit?: ReitAssetExtension;
  pfic?: PficAssetExtension;
};

// ==========================================
// 2. FUND REGISTRY & RESEARCH UNIVERSE
// ==========================================
export interface FundEntityStructure {
  id: string;
  name: string;
  classification: string;
  jurisdiction: string;
  role: 'MASTER_FUND' | 'FEEDER_ONSHORE' | 'FEEDER_OFFSHORE' | 'BLOCKER_CORP' | 'SPV' | 'OPERATING_CO' | 'INVESTOR';
  ein_or_cik?: string;
}

export interface FundModel {
  id: string;
  name: string;
  code: string;
  type: FundType;
  adviser_name: string;
  jurisdiction: string;
  formation_date: string;
  aum_usd: number;
  strategy_description: string;
  cik?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'SYNTHETIC' | 'BENCHMARK';
  tags: string[];
  
  // High-level tax elections
  section_754_elected: boolean;
  section_704c_method: 'TRADITIONAL' | 'CURATIVE' | 'REMEDIAL';
  section_163j_limitation_active: boolean;
  is_synthetic: boolean;
  
  // Tax state summaries
  tax_metrics: {
    taxable_income_ytd: number;
    book_income_ytd: number;
    tax_leakage_rate: number; // percentage
    withholding_paid: number;
    realised_gains_lt: number;
    realised_gains_st: number;
    unrealised_gains: number;
    turnover_rate: number; // percentage
    volatility_annualized: number;
    annual_return: number;
    eci_exposure: number;
    ubti_exposure: number;
    pfic_exposure: number;
    basis_gap_ratio: number;
    state_sufficiency_score: number; // in [0, 1]
    operational_exceptions_count: number;
  };

  entities: FundEntityStructure[];
  assets: MultiAssetRecord[];
}

export interface ResearchUniverse {
  id: string;
  name: string;
  description: string;
  fund_ids: string[];
  period_start: string;
  period_end: string;
  asset_classes_covered: AssetClass[];
  tax_regimes_covered: string[];
  created_at: string;
  updated_at: string;
}

// ==========================================
// 3. LIVE MARKET DATA ADAPTER ABSTRACTION
// ==========================================
export type MarketDataProviderType = 
  | 'ALPACA_US'
  | 'EULERPOOL_EUR'
  | 'GITHUB_NSE_INDIA'
  | 'SEC_EDGAR_FACTS'
  | 'CSV_IMPORT'
  | 'USER_DATASET'
  | 'TINYFISH_BROWSER_RESEARCH';

export interface MarketObservation {
  observation_id: string;
  provider: MarketDataProviderType;
  instrument_symbol: string;
  timestamp: string;
  retrieval_time: string;
  frequency: 'TICK' | '1MIN' | '1HOUR' | '1DAY' | 'FILING_EVENT';
  currency: string;
  price: number;
  bid?: number;
  ask?: number;
  volume?: number;
  vwap?: number;
  adjustment_methodology: 'SPLIT_AND_DIVIDEND_ADJUSTED' | 'RAW_UNADJUSTED';
  is_live: boolean;
  source_reference: string;
  
  // Crucial POC1 separation:
  is_tax_fact: boolean;
  tax_rule_authorizing_conversion?: string;
  tax_conversion_notes?: string;
}

// ==========================================
// 4. UNIFIED EVENT STORE
// ==========================================
export type EventType =
  | 'TRADE_BUY'
  | 'TRADE_SELL'
  | 'MARKET_PRICE_TICK'
  | 'DIVIDEND_RECEIVED'
  | 'INTEREST_ACCRUED'
  | 'CAPITAL_CONTRIBUTION'
  | 'CAPITAL_DISTRIBUTION'
  | 'SECONDARY_INTEREST_TRANSFER'
  | 'SECTION_743B_STEP_UP'
  | 'SECTION_704B_REVALUATION'
  | 'SECTION_704C_ALLOCATION'
  | 'TAX_ELECTION_MADE'
  | 'CORPORATE_MERGER'
  | 'DEBT_ISSUANCE'
  | 'FX_REVALUATION'
  | 'K1_ISSUED';

export interface UnifiedTaxEvent {
  event_id: string;
  fund_id: string;
  event_type: EventType;
  effective_date: string; // tv (valid time)
  recorded_date: string;  // tr (record time)
  instrument_id?: string;
  instrument_name?: string;
  entity_id?: string;
  economic_amount: number;
  tax_amount?: number;
  currency: string;
  originating_source: string;
  source_accession?: string;
  provenance_hash: string;
  
  // State transition variables affected
  state_variables_affected: string[];
  governing_tax_rules: string[];
  
  // Bitemporal resolution
  is_retroactive_adjustment: boolean;
  reconciliation_status: 'MATCHED' | 'UNRESOLVED_BREAK' | 'IN_REVIEW';
}

// ==========================================
// 5. POINT-IN-TIME STATE RECONSTRUCTION
// ==========================================
export interface ReconstructedPointInTimeState {
  timestamp: string;
  fund_id: string;
  fund_name: string;
  events_applied_count: number;
  total_market_value: number;
  total_tax_basis: number;
  book_tax_basis_gap: number;
  active_entities_count: number;
  active_assets: MultiAssetRecord[];
  
  // Sufficiency metrics
  state_sufficiency_error: number; // S(t) = 1 - (validated / total)
  validated_variables: string[];
  missing_required_variables: {
    variable_name: string;
    required_for_calculation: string;
    statutory_citation: string;
    impact_level: 'CRITICAL_HALT' | 'ESTIMATED_INFERRED' | 'DOCUMENT_OMITTED';
  }[];
  affected_calculations: string[];
  affected_tax_rules: string[];
  source_filing_anchors: string[];
}

// ==========================================
// 6. STATE SUFFICIENCY & ERROR GRAPH
// ==========================================
export interface StateSufficiencyTimelinePoint {
  step: number;
  date: string;
  sufficiency_error: number; // S(t) in [0, 1]
  sufficiency_score: number; // 1 - error
  total_required: number;
  validated_count: number;
  missing_count: number;
  market_volatility: number;
  tax_leakage: number;
  is_selected?: boolean;
  missing_variables: string[];
  affected_calculations: string[];
  affected_funds: string[];
  affected_assets: string[];
  affected_tax_rules: string[];
  source_documents: string[];
}

// ==========================================
// 7. MATHEMATICAL APPROXIMATION & MODEL DISCOVERY
// ==========================================
export type CandidateModelFamily =
  | 'LINEAR'
  | 'POLYNOMIAL_DEGREE_2'
  | 'POLYNOMIAL_DEGREE_3'
  | 'EXPONENTIAL'
  | 'LOGARITHMIC'
  | 'POWER_LAW'
  | 'LOGISTIC'
  | 'PIECEWISE_LINEAR'
  | 'USER_DEFINED';

export interface ModelFittingResult {
  model_id: string;
  family: CandidateModelFamily;
  formula_latex: string;
  parameters: Record<string, number>;
  parameter_labels: Record<string, string>;
  r_squared: number;
  rmse: number;
  mae: number;
  sample_size: number;
  fit_window_start: string;
  fit_window_end: string;
  residuals: { x: number; y_observed: number; y_predicted: number; residual: number }[];
  confidence_interval_95: { lower_bound: number; upper_bound: number };
  assumptions: string[];
  extrapolation_warning: string;
  is_best_fit: boolean;
}

export interface StructuralFormulaObject {
  formula_id: string;
  name: string;
  latex: string;
  category: 'TAX_RULE_EQUATION' | 'EMPIRICAL_OBSERVATIONAL_MODEL';
  variables: { name: string; symbol: string; unit: string; description: string }[];
  result_dimension: string;
  source_citation?: string;
  rule_id?: string;
  version: string;
  created_by: 'STATUTORY_AUTHORITY' | 'QUANT_RESEARCH_ENGINE' | 'AI_PROPOSAL' | 'USER_DEFINED';
  is_validated_by_human: boolean;
}

// ==========================================
// 8. CORRELATION & DIVERGENCE ENGINE
// ==========================================
export interface CorrelationMetricPair {
  id: string;
  variable_x_label: string;
  variable_y_label: string;
  pearson_r: number;
  spearman_rho: number;
  p_value: number;
  sample_size: number;
  time_period: string;
  scatter_points: { x: number; y: number; label: string; fund_code: string; date: string }[];
  is_statistically_significant: boolean;
  distinction_notes: string; // Explicit distinction: Correlation != Causation
}

export interface DivergenceObservation {
  id: string;
  title: string;
  series_a_label: string;
  series_b_label: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  max_divergence_magnitude: number;
  contributing_events: string[];
  tax_rules_involved: string[];
  market_events: string[];
  potential_explanations: string[];
  confidence_level: 'HIGH_EVIDENCED' | 'MEDIUM_HYPOTHETICAL' | 'UNRESOLVED_RESIDUAL';
  associated_hypothesis_id?: string;
}

export interface ResearchHypothesis {
  id: string;
  code: string; // e.g. H-001
  title: string;
  observed_phenomenon: string;
  candidate_explanations: { id: string; text: string; probability_weight: number; status: 'ACTIVE' | 'FALSIFIED' | 'CONFIRMED' }[];
  evidence_citations: string[];
  status: 'OBSERVED' | 'HYPOTHESIZED' | 'TESTED_CROSS_FUND' | 'SUPPORTED' | 'REJECTED';
  test_funds_evaluated: string[];
  test_assets_evaluated: string[];
  r_squared_across_funds?: number;
  out_of_sample_rmse?: number;
  created_at: string;
}

// ==========================================
// 9. TAX AUTHORITY LIBRARY & COVERAGE MAP
// ==========================================
export type TaxCoverageLevel = 'IMPLEMENTED' | 'PARTIAL' | 'RESEARCHED' | 'UNMODELED' | 'UNKNOWN';

export interface TaxAuthorityItem {
  id: string;
  hierarchy_level: 'INTERNAL_REVENUE_CODE' | 'TREASURY_REGULATION' | 'REVENUE_RULING' | 'REVENUE_PROCEDURE' | 'IRS_NOTICE' | 'FORM_INSTRUCTION' | 'IRS_PUBLICATION';
  citation: string;
  title: string;
  section_or_pub_no: string;
  revision_date: string;
  official_url: string;
  sha256_hash?: string;
  coverage_status: TaxCoverageLevel;
  statutory_text_excerpt: string;
  extracted_rules_count: number;
  implemented_rules_count: number;
  test_cases_count: number;
  affected_calculations: string[];
}

export interface TaxRuleGraphNode {
  id: string;
  type: 'AUTHORITY' | 'REGULATION' | 'IRS_GUIDANCE' | 'FORM' | 'RULE' | 'EQUATION' | 'TEST' | 'CALCULATION';
  label: string;
  sublabel: string;
  status: TaxCoverageLevel;
}

export interface TaxRuleGraphEdge {
  from: string;
  to: string;
  relationship: 'AUTHORIZES' | 'IMPLEMENTS' | 'GOVERNS' | 'CALCULATES' | 'TESTS';
}

// ==========================================
// 10. RESEARCH NOTEBOOK & REPRODUCIBLE SNAPSHOTS
// ==========================================
export interface ResearchNotebookEntry {
  id: string;
  title: string;
  created_at: string;
  author: string;
  universe_id: string;
  fund_ids: string[];
  time_range: { start: string; end: string };
  hypothesis_code?: string;
  fitted_model_id?: string;
  latex_equations: string[];
  observations_markdown: string;
  reproducibility_manifest: {
    data_version: string;
    transformation: string;
    filters: Record<string, string>;
    analysis_engine_version: string;
  };
}

// ==========================================
// 11. RESEARCH AGENT TEAM & TINYFISH SPECIFICATION
// ==========================================
export type ResearchAgentRole =
  | 'Tax Research Agent'
  | 'Document Agent'
  | 'Rule Modelling Agent'
  | 'Quant Research Agent'
  | 'Market Data Agent'
  | 'Audit Agent'
  | 'Validation Agent'
  | 'TinyFish Browser Agent';

export interface AgentHandoffRecord {
  task_id: string;
  agent: ResearchAgentRole;
  objective: string;
  timestamp: string;
  inputs: Record<string, any>;
  sources: string[];
  observations: string[];
  claims: string[];
  proposed_rules: string[];
  calculations: string[];
  confidence: number; // in [0, 1]
  unresolved_questions: string[];
  next_action: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED_HUMAN_REVIEW';
}
