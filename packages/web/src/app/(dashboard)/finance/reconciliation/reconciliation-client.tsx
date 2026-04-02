'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  FileUp,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  MoreVertical,
} from 'lucide-react';
import { ImportSection } from './components/import-section';
import { TransactionList } from './components/transaction-list';
import { DashboardStats } from './components/dashboard-stats';
import { AutoMatchDialog } from './components/auto-match-dialog';

type Tab = 'all' | 'unmatched' | 'matched' | 'excluded';

interface ReconciliationStats {
  totalTransactions: number;
  matchedCount: number;
  unmatchedCount: number;
  excludedCount: number;
  matchRate: number;
}

export function ReconciliationClient({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('unmatched');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [isAutoMatchDialogOpen, setIsAutoMatchDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleImportSuccess = (data: any) => {
    setSessionId(data.sessionId);
    setStats({
      totalTransactions: data.importedCount,
      matchedCount: data.matchedCount,
      unmatchedCount: data.unmatchedCount,
      excludedCount: 0,
      matchRate: data.importedCount > 0 ? Math.round((data.matchedCount / data.importedCount) * 100) : 0,
    });
    setActiveTab('unmatched');
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTransactionUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAutoMatchComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Reconciliation</h1>
          <p className="text-gray-500 mt-1">
            Import bank statements and match transactions to donations and payments
          </p>
        </div>
      </div>

      {/* Dashboard Stats */}
      {stats && sessionId && (
        <DashboardStats
          stats={stats}
          sessionId={sessionId}
          onStatsUpdate={setStats}
        />
      )}

      {/* Import Section */}
      <ImportSection onImportSuccess={handleImportSuccess} />

      {/* Main Content */}
      {sessionId && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <TabButton
                  label="All"
                  value="all"
                  active={activeTab === 'all'}
                  onClick={() => setActiveTab('all')}
                />
                <TabButton
                  label="Unmatched"
                  value="unmatched"
                  active={activeTab === 'unmatched'}
                  onClick={() => setActiveTab('unmatched')}
                />
                <TabButton
                  label="Matched"
                  value="matched"
                  active={activeTab === 'matched'}
                  onClick={() => setActiveTab('matched')}
                />
                <TabButton
                  label="Excluded"
                  value="excluded"
                  active={activeTab === 'excluded'}
                  onClick={() => setActiveTab('excluded')}
                />
              </div>
            </div>

            <button
              onClick={() => setIsAutoMatchDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Auto-Match All
            </button>
          </div>

          {/* Transactions List */}
          <TransactionList
            sessionId={sessionId}
            status={activeTab === 'all' ? undefined : activeTab}
            onTransactionUpdate={handleTransactionUpdate}
            refreshTrigger={refreshTrigger}
          />
        </div>
      )}

      {/* Auto-Match Dialog */}
      {sessionId && (
        <AutoMatchDialog
          isOpen={isAutoMatchDialogOpen}
          onOpenChange={setIsAutoMatchDialogOpen}
          sessionId={sessionId}
          onComplete={handleAutoMatchComplete}
        />
      )}

      {/* Empty State */}
      {!sessionId && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FileUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No active reconciliation session
            </h3>
            <p className="text-gray-500">
              Import a bank statement above to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TabButton({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );
}
