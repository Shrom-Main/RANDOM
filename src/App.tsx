/**
 * Main Application Entry Point
 * POC1 Global Extension: Global Temporal Investment Graph, Tax State Engine & Auditable Analytics
 * iOS / iPadOS Glassmorphism Theme with Apple Color Accents
 */

import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import { ConnectingTheSilosView } from './components/ConnectingTheSilosView';
import { DeterministicTaxEngineView } from './components/DeterministicTaxEngineView';
import { TaxLotsAndBridgeView } from './components/TaxLotsAndBridgeView';
import { TinyFishResearchView } from './components/TinyFishResearchView';
import { AuthorityRegistryView } from './components/AuthorityRegistryView';
import { ReconciliationDashboardView } from './components/ReconciliationDashboardView';
import { AuditLineageView } from './components/AuditLineageView';
import { GlobalGraphView } from './components/GlobalGraphView';
import { RealWorldGeoMapView } from './components/RealWorldGeoMapView';
import { WorkbenchView } from './components/WorkbenchView';
import { FormulaAuditorView } from './components/FormulaAuditorView';
import { RecursiveAuditView } from './components/RecursiveAuditView';
import { ScaleStressTestView } from './components/ScaleStressTestView';
import { CounterfactualStudioView } from './components/CounterfactualStudioView';
import { AiAuditableChatView } from './components/AiAuditableChatView';
import { EvidenceLedgerView } from './components/EvidenceLedgerView';
import { ResearchPaperView } from './components/ResearchPaperView';
import { ResearchLabDashboardView } from './components/ResearchLabDashboardView';
import { ResearchObservatoryView } from './components/ResearchObservatoryView';
import { MultiAssetWaveView } from './components/MultiAssetWaveView';
import { StateSufficiencyGraphView } from './components/StateSufficiencyGraphView';
import { ModelDiscoveryLabView } from './components/ModelDiscoveryLabView';
import { FundRegistryView } from './components/FundRegistryView';
import { InvestorRelationsView } from './components/InvestorRelationsView';
import { OrganisationChartsView } from './components/OrganisationChartsView';
import { DebtTrackingView } from './components/DebtTrackingView';
import { MarketMovementView } from './components/MarketMovementView';
import { TaxAuthorityExplorerView } from './components/TaxAuthorityExplorerView';
import { ResearchNotebookView } from './components/ResearchNotebookView';
import { SystemHealthAndSelfAuditView } from './components/SystemHealthAndSelfAuditView';
import { AutomatedTestSuiteModal } from './components/AutomatedTestSuiteModal';
import { SecSearchModal } from './components/SecSearchModal';
import { INITIAL_FUND_REGISTRY } from './data/fund-registry-data';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('research-observatory');
  const [activeFundId, setActiveFundId] = useState<string>(INITIAL_FUND_REGISTRY[0].id);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [isSecSearchOpen, setIsSecSearchOpen] = useState<boolean>(false);

  const handleExportReport = () => {
    const exportContent = `# POC1 Extension — Global Temporal Investment Graph, Tax State Engine and Auditable Analytics\n\nFormal research deliverable compiled from SEC EDGAR, GLEIF Level-2, Treasury Regulations, and cross-border corporate registries.\nResearch Question: How large and interconnected can the computational state become before the architecture becomes insufficient or dependent on human determination?\n\nEmpirical standard of conclusion: CONDITIONALLY SUPPORTED across Levels 0–3; Boundary Fault Zone at Level 4; Breakdown at Level 5–6.\n`;
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'POC1_Global_Extension_Research_Report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {/* iOS Glass Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunTestSuite={() => setIsTestModalOpen(true)}
        onExportPaper={handleExportReport}
        onOpenSecSearch={() => setIsSecSearchOpen(true)}
        activeFundId={activeFundId}
        onSelectFund={setActiveFundId}
      />

      {/* Main Content View Container */}
      <main className="flex-1 pb-16">
        {/* Core Flagship & Continuous Diagnostics Views */}
        {activeTab === 'research-observatory' && (
          <ResearchObservatoryView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
            onNavigateToTab={(t) => setActiveTab(t)}
          />
        )}
        {activeTab === 'system-health' && (
          <SystemHealthAndSelfAuditView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
          />
        )}
        {activeTab === 'research-dashboard' && (
          <ResearchLabDashboardView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
            onNavigateToTab={(t) => setActiveTab(t)}
          />
        )}
        {activeTab === 'multi-asset-wave' && (
          <MultiAssetWaveView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
          />
        )}
        {activeTab === 'state-sufficiency' && (
          <StateSufficiencyGraphView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
          />
        )}
        {activeTab === 'model-discovery' && (
          <ModelDiscoveryLabView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
          />
        )}
        {activeTab === 'fund-registry' && (
          <FundRegistryView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
            onNavigateToTab={(t) => setActiveTab(t)}
          />
        )}
        {activeTab === 'investor-relations' && (
          <InvestorRelationsView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
          />
        )}
        {activeTab === 'org-charts' && (
          <OrganisationChartsView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
          />
        )}
        {activeTab === 'debt-tracking' && (
          <DebtTrackingView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
          />
        )}
        {activeTab === 'market-movement' && (
          <MarketMovementView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
          />
        )}
        {activeTab === 'tax-authority' && <TaxAuthorityExplorerView />}
        {activeTab === 'research-notebook' && <ResearchNotebookView />}

        {/* Existing Flagship Views */}
        {activeTab === 'overview' && <ExecutiveDashboardView onNavigateToTab={(t) => setActiveTab(t)} />}
        {activeTab === 'silos-demo' && <ConnectingTheSilosView />}
        {activeTab === 'tax-engine' && (
          <DeterministicTaxEngineView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
          />
        )}
        {activeTab === 'tax-lots' && (
          <TaxLotsAndBridgeView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
          />
        )}
        {activeTab === 'tinyfish-research' && <TinyFishResearchView />}
        {activeTab === 'authority-registry' && <AuthorityRegistryView />}
        {activeTab === 'reconciliations' && <ReconciliationDashboardView />}
        {activeTab === 'audit-lineage' && <AuditLineageView />}
        {activeTab === 'real-world-map' && <RealWorldGeoMapView />}
        {activeTab === 'research-paper' && <ResearchPaperView onNavigateToTab={(t) => setActiveTab(t)} />}
        {activeTab === 'global-graph' && <GlobalGraphView onNavigateToMap={() => setActiveTab('real-world-map')} />}
        {activeTab === 'workbench' && (
          <WorkbenchView
            onNavigateToLedger={() => setActiveTab('evidence-ledger')}
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
          />
        )}
        {activeTab === 'formula-auditor' && (
          <FormulaAuditorView
            activeFundId={activeFundId}
            onSelectFund={setActiveFundId}
          />
        )}
        {activeTab === 'recursive-audit' && <RecursiveAuditView />}
        {activeTab === 'scale-stress' && <ScaleStressTestView />}
        {activeTab === 'counterfactual' && <CounterfactualStudioView />}
        {activeTab === 'ai-chat' && <AiAuditableChatView />}
        {activeTab === 'evidence-ledger' && <EvidenceLedgerView />}
      </main>

      {/* Automated Invariant Test Suite Modal */}
      <AutomatedTestSuiteModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      {/* Global SEC EDGAR & Registry Search Modal */}
      <SecSearchModal
        isOpen={isSecSearchOpen}
        onClose={() => setIsSecSearchOpen(false)}
        onSelectCaseFund={() => {
          setActiveTab('workbench');
          setIsSecSearchOpen(false);
        }}
        onNavigateToLedger={() => {
          setActiveTab('evidence-ledger');
          setIsSecSearchOpen(false);
        }}
      />

      {/* iOS Frosted Glass Footer */}
      <footer className="ios-glass border-t border-white/10 py-6 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">POC1 Global Extension Laboratory</span>
            <span>·</span>
            <span>Global Temporal Investment Graph &amp; Auditable Tax State Engine</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Axiom: EconomicInterest ≠ LegalOwnership ≠ Control ≠ TaxOwnership
          </div>
        </div>
      </footer>
    </div>
  );
}
