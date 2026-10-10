/**
 * Persistent Research Observations & Rehydration Engine
 * Records empirical experiments, live market snapshots, graph metrics,
 * and state transitions according to POC1 & POC1 Extension specifications.
 * Persists to disk under ./research_data/ to ensure zero loss if app crashes.
 */

import fs from 'fs';
import path from 'path';

const RESEARCH_DIR = path.resolve(process.cwd(), 'research_data');

// Ensure directory exists
if (!fs.existsSync(RESEARCH_DIR)) {
  fs.mkdirSync(RESEARCH_DIR, { recursive: true });
}

export interface ResearchObservation {
  id: string;
  timestamp: string;
  name: string;
  marketDataSnapshot: {
    usAlpaca: { symbol: string; price: number; timestamp: string; live: boolean };
    eurEulerPool: { symbol: string; price: number; exchange: string; live: boolean };
    indiaNse: { symbol: string; priceInr: number; fpiPct: number };
    secEdgar: { cik: string; entity: string; latestFiling: string };
  };
  hypothesisResults: {
    h1StateSufficiency: {
      status: 'VERIFIED' | 'DIVERGED';
      methodAIncrementalState: number;
      methodBReplayState: number;
      epsilonError: number;
      tolerance: number;
    };
    h2InvariantParity: {
      status: 'PRESERVED' | 'VIOLATED';
      balanceSheetDifferenceUsd: number;
      ownershipPartitionSum: number; // should be exactly 1.0
      capitalAccountParity: boolean;
    };
    h3PropagationMetrics: {
      affectedVariablesCount: number;
      longestDependencyPath: number;
      amplificationRatio: number;
      jacobianNorm: number;
    };
    h4ComputationalBoundary: {
      boundaryStatus: 'CLOSED' | 'REVIEW' | 'REJECT';
      closedFraction: number; // e.g. 0.88
      humanDeterminationsRequired: string[];
      escalationReason?: string;
    };
    h5ScalePerformance: {
      scaleLevel: string;
      entitiesCount: number;
      ingestTimeMs: number;
      transitionTimeMs: number;
      replayTimeMs: number;
      memoryMb: number;
    };
  };
  timeSeriesGraph: Array<{
    step: number;
    timestamp: string;
    alpacaPrice: number;
    eulerPrice: number;
    nsePriceInr: number;
    stateSufficiencyDelta: number;
    propagationBreadth: number;
    memoryMb: number;
  }>;
  notes: string;
}

export function saveResearchRun(run: ResearchObservation): string {
  const filePath = path.join(RESEARCH_DIR, `${run.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(run, null, 2), 'utf-8');
  return filePath;
}

export function getAllResearchRuns(): ResearchObservation[] {
  try {
    const files = fs.readdirSync(RESEARCH_DIR).filter(f => f.endsWith('.json'));
    const runs: ResearchObservation[] = [];
    for (const f of files) {
      try {
        const content = fs.readFileSync(path.join(RESEARCH_DIR, f), 'utf-8');
        runs.push(JSON.parse(content));
      } catch (e) {
        console.error(`Failed to parse research run file ${f}:`, e);
      }
    }
    return runs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    console.error('Failed to read research runs directory:', e);
    return [];
  }
}

export function getResearchRunById(id: string): ResearchObservation | null {
  try {
    const filePath = path.join(RESEARCH_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error(`Failed to load research run ${id}:`, e);
  }
  return null;
}
