/**
 * Type Definitions for Self-Observation, Browser Audit & Continuous System Diagnostics
 * Implements Sections 1–14 of User Specification:
 * - External-Observer Principle (20-step TinyFish browser audit loop)
 * - Deep Audit Agent Observation Records
 * - Metamorphic / Differential Testing
 * - Self-Consistency & Contradiction Detection
 * - Machine-Readable Graph Audit & "Why is this point here?" Lineage
 * - State Sufficiency S(t) and Error E(t)
 * - Formula Equivalence & Mathematical Audit
 * - Tax Authority Audit & Rule Promotion Pipeline
 * - Immutable Observation Ledger
 * - Self-Improvement Loop with Human Validation
 * - Research-Grade Self-Criticism & Falsification
 */

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type FailureClassification =
  | 'UI'
  | 'DATA'
  | 'STATE'
  | 'CALCULATION'
  | 'FORMULA'
  | 'TAX_RULE'
  | 'MARKET_DATA'
  | 'GRAPH'
  | 'INTERACTION'
  | 'PERFORMANCE'
  | 'PROVENANCE'
  | 'LINEAGE'
  | 'ACCESSIBILITY'
  | 'SCIENTIFIC_VALIDITY';

export type ObservationStatus =
  | 'OBSERVED'
  | 'REPRODUCED'
  | 'EXPLAINED'
  | 'HYPOTHESIS'
  | 'VALIDATED'
  | 'DISPROVED'
  | 'UNRESOLVED';

export interface AuditObservation {
  observation_id: string;
  timestamp: string;
  observer: 'TINYFISH_BROWSER_AGENT' | 'SYSTEM_STATE_WATCHDOG' | 'METAMORPHIC_RUNNER' | 'HUMAN_RESEARCHER';
  environment: 'BROWSER_RUNTIME' | 'SERVER_HEADLESS' | 'SANDBOX_CONTAINER';
  route: string;
  ui_element: string;
  action_performed: string;
  expected_behaviour: string;
  observed_behaviour: string;
  application_state_before: Record<string, any>;
  application_state_after: Record<string, any>;
  data_involved: string[];
  calculation_involved: string;
  source_involved: string;
  error_encountered?: string;
  severity: SeverityLevel;
  failure_type: FailureClassification;
  reproducibility: 'ALWAYS' | 'INTERMITTENT' | 'EDGE_CASE' | 'ONE_OFF';
  evidence: {
    dom_snapshot?: string;
    console_logs?: string[];
    network_calls?: string[];
    state_delta?: Record<string, any>;
    screenshot_url?: string;
    computed_vs_displayed?: {
      displayed_value: any;
      underlying_computed_value: any;
      discrepancy_magnitude: number;
    };
  };
  confidence: number; // [0, 1]
  status: ObservationStatus;
}

// -------------------------------------------------------------
// 1. TinyFish 20-Step Browser Audit Types
// -------------------------------------------------------------
export interface BrowserAuditStepResult {
  step_number: number;
  title: string;
  target_route_or_action: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'WARNING';
  latency_ms: number;
  expected: string;
  observed: string;
  evidence_summary: string;
  state_leakage_detected: boolean;
  dom_elements_inspected: number;
}

export interface BrowserAuditRunReport {
  run_id: string;
  started_at: string;
  completed_at: string;
  total_duration_ms: number;
  overall_status: 'HEALTHY' | 'WARNINGS' | 'DEGRADED' | 'FAILED';
  health_score: number; // 0 - 100
  steps: BrowserAuditStepResult[];
  pages_tested_count: number;
  interactions_tested_count: number;
  passed_count: number;
  failed_count: number;
  warning_count: number;
  unexplained_behaviors_count: number;
  critical_findings: number;
  high_findings: number;
  observations_logged: number;
}

// -------------------------------------------------------------
// 2. Metamorphic / Differential Testing Types
// -------------------------------------------------------------
export interface MetamorphicTestScenario {
  test_id: string;
  name: string;
  description: string;
  input_variable: string;
  value_from: any;
  value_to: any;
  expected_delta_state: string;
  expected_delta_calculation: string;
  expected_delta_graph: string;
  expected_delta_output: string;
  invariant_to_preserve: string;
  actual_delta: {
    state_changed_as_expected: boolean;
    calculation_divergence: number;
    graph_updated_correctly: boolean;
    unintended_side_effects: string[];
    is_explained_by_dependency_dag: boolean;
  };
  passed: boolean;
}

// -------------------------------------------------------------
// 3. Self-Consistency / Contradiction Types
// -------------------------------------------------------------
export interface SelfConsistencyCheck {
  check_id: string;
  domain: 'NAV_PARITY' | 'GRAPH_VS_TABLE' | 'DASHBOARD_VS_FUNDS' | 'FUND_COMPARISON_INDEPENDENCE' | 'FORMULA_DISPLAY_VS_EXEC' | 'TAX_RULE_VERSION' | 'SOURCE_CITATION';
  description: string;
  primary_displayed_value: string | number;
  underlying_reference_value: string | number;
  delta_difference: number;
  tolerance_threshold: number;
  is_consistent: boolean;
  explanation: string;
  source_provenance: string;
}

// -------------------------------------------------------------
// 4. Machine-Readable Graph Audit ("Why is this point here?")
// -------------------------------------------------------------
export interface MachineReadableGraphDefinition {
  graph_id: string;
  graph_title: string;
  dataset_id: string;
  fund_scope: string; // e.g. "ALL" or specific fund ID
  asset_scope: string; // e.g. "ALL_18_CLASSES" or specific asset
  time_window: { start: string; end: string };
  filters: Record<string, string>;
  x_variable: string;
  y_variable: string;
  transformations: string[];
  aggregation: string;
  formula: string;
  units: string;
  data_version: string;
  model_version: string;
  source_lineage: {
    source_name: string;
    source_uri: string;
    ingestion_timestamp: string;
    verification_hash: string;
  }[];
  sample_points_lineage?: PointProvenanceTrace[];
}

export interface PointProvenanceTrace {
  point_id: string;
  x_value: string | number;
  y_value: string | number;
  timestamp: string;
  entity_or_fund: string;
  underlying_raw_observation: {
    raw_amount: number;
    currency: string;
    source_filing: string;
    recorded_at: string;
  };
  applied_transformation_pipeline: string[];
  executable_formula_used: string;
  tax_rule_governing: string;
  calculation_trace_steps: string[];
}

// -------------------------------------------------------------
// 5. State Sufficiency Self-Audit S(t) and E(t)
// -------------------------------------------------------------
export interface StateSufficiencyVariableAudit {
  variable_name: string;
  expected_source: string;
  actual_source: string;
  validation_status: 'VALIDATED' | 'MISSING' | 'STALE' | 'ESTIMATED' | 'SYNTHETIC';
  downstream_calculations_affected: string[];
  criticality: 'BLOCKING' | 'SIGNIFICANT' | 'LOW';
}

export interface StateSufficiencyPointInTime {
  date: string;
  total_required_variables: number;
  validated_required_variables: number;
  sufficiency_score: number; // S(t) = Validated / Total in [0, 1]
  sufficiency_error: number; // E(t) = 1 - S(t) in [0, 1]
  missing_or_invalid_variables: StateSufficiencyVariableAudit[];
  is_metric_calculation_valid: boolean;
}

// -------------------------------------------------------------
// 6. Formula Audit Types (LaTeX vs Executable Code)
// -------------------------------------------------------------
export interface FormulaAuditItem {
  formula_id: string;
  name: string;
  human_readable_latex: string;
  machine_executable_js: string;
  variables_declared: { name: string; type: string; unit: string; bound_in_state: boolean }[];
  is_latex_syntax_valid: boolean;
  are_variables_defined: boolean;
  is_dimensionally_consistent: boolean;
  has_circular_dependencies: boolean;
  references_unavailable_state: boolean;
  has_sign_or_term_error: boolean;
  statutory_authority_cited: string;
  is_equivalent: boolean;
  verification_verdict: 'SOUND_AND_VERIFIED' | 'HYPOTHESIS_PENDING_PROOF' | 'EQUIVALENCE_MISMATCH' | 'SYNTAX_ERROR';
  notes: string;
}

// -------------------------------------------------------------
// 7. Tax Authority Audit & Rule Change Pipeline
// -------------------------------------------------------------
export interface TaxAuthorityAuditItem {
  source_id: string;
  source_url: string;
  document_identity: string;
  publication_number: string;
  title: string;
  publication_date: string;
  revision_date: string;
  document_sha256_hash: string;
  retrieval_timestamp: string;
  source_hierarchy: 'STATUTE' | 'REGULATION' | 'IRS_GUIDANCE' | 'INSTRUCTION' | 'SECONDARY';
  superseded_status: 'CURRENT_LAW' | 'SUPERSEDED' | 'PROPOSED_REGULATION' | 'SUNSET';
  change_detected: boolean;
  change_type?: 'NEW_PUBLICATION' | 'UPDATED_REVISION' | 'SUPERSEDED_GUIDANCE' | 'CHANGED_HASH' | 'NONE';
  affected_computational_rules: string[];
}

export interface CandidateRuleChange {
  change_id: string;
  authority_source_id: string;
  triggered_by: string;
  impact_analysis: string;
  candidate_rule_diff: string;
  regression_tests: { test_name: string; inputs: any; expected: any; result: 'PASSED' | 'FAILED' }[];
  human_validation_status: 'PENDING_HUMAN_APPROVAL' | 'APPROVED' | 'REJECTED';
  activated_in_engine: boolean;
}

// -------------------------------------------------------------
// 8. Self-Improvement Loop & Proposed Patch
// -------------------------------------------------------------
export interface ProposedPatchItem {
  patch_id: string;
  linked_observation_id: string;
  failure_type: FailureClassification;
  diagnosis: string;
  proposed_fix_description: string;
  code_or_config_diff: string;
  regression_test_suite_passed: boolean;
  requires_human_approval: boolean;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  applied_at?: string;
}

// -------------------------------------------------------------
// 9. Research-Grade Self-Criticism / Falsification Engine
// -------------------------------------------------------------
export interface FalsificationTest {
  test_id: string;
  category: 'NUMERICAL_INSTABILITY' | 'ROUND_OFF_BOUNDS' | 'CIRCULAR_ALLOCATION' | 'NEGATIVE_CAPITAL_BOUND' | 'LEGAL_AMBIGUITY' | 'STATE_DIVERGENCE' | 'RACE_CONDITION';
  hypothesis_to_falsify: string;
  extreme_test_vector: Record<string, any>;
  theoretical_invariant: string;
  observed_behavior: string;
  falsification_result: 'PRESERVED_SOUNDNESS' | 'FALSIFIED_ANOMALY_FOUND' | 'INCONCLUSIVE';
  severity_if_falsified: SeverityLevel;
  remedy_recommendation: string;
}
