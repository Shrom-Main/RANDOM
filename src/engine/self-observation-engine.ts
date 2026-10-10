/**
 * Client-Side Self-Observation & Continuous Diagnostics Engine
 * Provides reactive hooks, machine-readable graph lookups, formula checks,
 * and live observation dispatchers for the UI.
 */

import {
  AuditObservation,
  BrowserAuditRunReport,
  MetamorphicTestScenario,
  SelfConsistencyCheck,
  MachineReadableGraphDefinition,
  StateSufficiencyPointInTime,
  FormulaAuditItem,
  TaxAuthorityAuditItem,
  CandidateRuleChange,
  FalsificationTest
} from '../types/self-audit';

export async function fetchSystemAuditStatus(): Promise<{
  configured: boolean;
  observer_mode: string;
  environment: string;
  watchdog_active: boolean;
  last_audit_timestamp: string;
}> {
  try {
    const res = await fetch('/api/tinyfish/audit/status');
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Failed to fetch audit status:', e);
  }
  return {
    configured: false,
    observer_mode: 'SYSTEM_STATE_WATCHDOG',
    environment: 'browser',
    watchdog_active: true,
    last_audit_timestamp: new Date().toISOString()
  };
}

export async function triggerTinyFishBrowserAudit(targetUrl?: string): Promise<BrowserAuditRunReport> {
  const res = await fetch('/api/tinyfish/audit/run-browser-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl: targetUrl || window.location.origin })
  });
  if (!res.ok) {
    throw new Error(`Browser audit failed with status ${res.status}`);
  }
  return await res.json();
}

export async function fetchMetamorphicTests(): Promise<MetamorphicTestScenario[]> {
  try {
    const res = await fetch('/api/tinyfish/audit/metamorphic-test', { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Failed to fetch metamorphic tests:', e);
  }
  return [];
}

export async function fetchSelfConsistencyChecks(): Promise<SelfConsistencyCheck[]> {
  try {
    const res = await fetch('/api/tinyfish/audit/self-consistency', { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Failed to fetch self-consistency checks:', e);
  }
  return [];
}

export async function fetchGraphDefinitions(): Promise<MachineReadableGraphDefinition[]> {
  try {
    const res = await fetch('/api/tinyfish/audit/graph-definitions');
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Failed to fetch graph definitions:', e);
  }
  return [];
}

export async function fetchStateSufficiencyPoints(): Promise<StateSufficiencyPointInTime[]> {
  try {
    const res = await fetch('/api/tinyfish/audit/state-sufficiency');
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Failed to fetch state sufficiency points:', e);
  }
  return [];
}

export async function fetchFormulaAudit(): Promise<FormulaAuditItem[]> {
  try {
    const res = await fetch('/api/tinyfish/audit/formula-audit');
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Failed to fetch formula audit:', e);
  }
  return [];
}

export async function fetchTaxAuthorityAudit(): Promise<{
  sources: TaxAuthorityAuditItem[];
  candidateChanges: CandidateRuleChange[];
}> {
  try {
    const res = await fetch('/api/tinyfish/audit/tax-authority-inspect', { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Failed to inspect tax authorities:', e);
  }
  return { sources: [], candidateChanges: [] };
}

export async function fetchFalsificationTests(): Promise<FalsificationTest[]> {
  try {
    const res = await fetch('/api/tinyfish/audit/falsification', { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Failed to fetch falsification tests:', e);
  }
  return [];
}

export async function fetchObservationLedger(): Promise<AuditObservation[]> {
  try {
    const res = await fetch('/api/tinyfish/audit/ledger');
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Failed to fetch observation ledger:', e);
  }
  return [];
}

export async function appendLedgerObservation(obs: Omit<AuditObservation, 'observation_id' | 'timestamp'>): Promise<AuditObservation | null> {
  try {
    const res = await fetch('/api/tinyfish/audit/ledger/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obs)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Failed to append observation:', e);
  }
  return null;
}

export async function approveRuleChangeInEngine(changeId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/tinyfish/audit/approve-rule-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeId })
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
  } catch (e) {
    console.error('Failed to approve rule change:', e);
  }
  return false;
}
