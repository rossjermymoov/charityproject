'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Eye, Unlink, XCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { TransactionMatchDialog } from './transaction-match-dialog';

interface Transaction {
  id: string;
  date: string;
  description: string;
  reference?: string;
  amount: number;
  type: string;
  status: string;
  matchedDonationId?: string;
  matchedPaymentId?: string;
  matchConfidence?: string;
}

interface TransactionListProps {
  sessionId: string;
  status?: string;
  onTransactionUpdate: () => void;
  refreshTrigger: number;
}

export function TransactionList({
  sessionId,
  status,
  onTransactionUpdate,
  refreshTrigger,
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          sessionId,
          limit: '100',
        });
        if (status) {
          params.append('status', status);
        }

        const response = await fetch(`/api/reconciliation/transactions?${params}`);
        const data = await response.json();
        setTransactions(data.transactions);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [sessionId, status, refreshTrigger]);

  const handleMatch = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsMatchDialogOpen(true);
  };

  const handleUnmatch = async (transactionId: string) => {
    setActionInProgress(transactionId);
    try {
      const response = await fetch('/api/reconciliation/unmatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });

      if (response.ok) {
        onTransactionUpdate();
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === transactionId
              ? { ...t, status: 'UNMATCHED', matchedDonationId: undefined, matchedPaymentId: undefined }
              : t
          )
        );
      }
    } catch (error) {
      console.error('Failed to unmatch:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleExclude = async (transactionId: string) => {
    setActionInProgress(transactionId);
    try {
      const response = await fetch('/api/reconciliation/exclude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });

      if (response.ok) {
        onTransactionUpdate();
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === transactionId
              ? { ...t, status: 'EXCLUDED' }
              : t
          )
        );
      }
    } catch (error) {
      console.error('Failed to exclude:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 text-gray-400 mx-auto animate-spin" />
          <p className="text-gray-500 mt-3">Loading transactions...</p>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Eye className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No transactions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Description
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Reference
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatDate(new Date(transaction.date))}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="font-medium">{transaction.description}</div>
                  {transaction.matchedDonationId && (
                    <div className="text-xs text-gray-500 mt-1">
                      Linked to donation
                    </div>
                  )}
                  {transaction.matchedPaymentId && (
                    <div className="text-xs text-gray-500 mt-1">
                      Linked to payment
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {transaction.reference || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                  <span className={transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'CREDIT' ? '+' : '-'}£{transaction.amount.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <StatusBadge status={transaction.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {transaction.status === 'UNMATCHED' && (
                      <button
                        onClick={() => handleMatch(transaction)}
                        className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                      >
                        Find Match
                      </button>
                    )}

                    <ActionMenu
                      transaction={transaction}
                      onUnmatch={handleUnmatch}
                      onExclude={handleExclude}
                      isLoading={actionInProgress === transaction.id}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionMatchDialog
        isOpen={isMatchDialogOpen}
        onOpenChange={setIsMatchDialogOpen}
        transaction={selectedTransaction}
        onMatchSuccess={() => {
          onTransactionUpdate();
          setIsMatchDialogOpen(false);
        }}
      />
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    MATCHED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Matched' },
    UNMATCHED: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Unmatched' },
    EXCLUDED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Excluded' },
  };

  const config_item = config[status] || config.UNMATCHED;

  return (
    <Badge className={`${config_item.bg} ${config_item.text}`}>
      {config_item.label}
    </Badge>
  );
}

interface ActionMenuProps {
  transaction: Transaction;
  onUnmatch: (id: string) => void;
  onExclude: (id: string) => void;
  isLoading: boolean;
}

function ActionMenu({ transaction, onUnmatch, onExclude, isLoading }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {transaction.status === 'MATCHED' && (
            <button
              onClick={() => {
                onUnmatch(transaction.id);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Unlink className="h-4 w-4" />
              Unmatch
            </button>
          )}

          {transaction.status !== 'EXCLUDED' && (
            <button
              onClick={() => {
                onExclude(transaction.id);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 border-t border-gray-100"
            >
              <XCircle className="h-4 w-4" />
              Exclude
            </button>
          )}
        </div>
      )}
    </div>
  );
}
