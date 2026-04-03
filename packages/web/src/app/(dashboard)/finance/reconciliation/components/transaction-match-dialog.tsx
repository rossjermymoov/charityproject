'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
}

interface MatchCandidate {
  id: string;
  type: 'DONATION' | 'PAYMENT';
  amount: number;
  date: Date;
  description?: string;
  contact?: { id: string; firstName: string; lastName: string };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface TransactionMatchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onMatchSuccess: () => void;
}

export function TransactionMatchDialog({
  isOpen,
  onOpenChange,
  transaction,
  onMatchSuccess,
}: TransactionMatchDialogProps) {
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidate | null>(null);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      fetchCandidates();
    }
  }, [isOpen, transaction]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      if (!transaction) return;
      const response = await fetch('/api/reconciliation/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'temp',
          transactionIds: [transaction.id],
        }),
      });

      const data = await response.json();
      if (data.matches && transaction.id in data.matches) {
        setCandidates(data.matches[transaction.id]);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (candidate: MatchCandidate) => {
    if (!transaction) return;

    setMatching(true);
    try {
      const response = await fetch('/api/reconciliation/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.id,
          donationId: candidate.type === 'DONATION' ? candidate.id : undefined,
          paymentId: candidate.type === 'PAYMENT' ? candidate.id : undefined,
          confidence: candidate.confidence,
        }),
      });

      if (response.ok) {
        onMatchSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to match:', error);
    } finally {
      setMatching(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Find Match for Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(new Date(transaction.date))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-semibold text-gray-900">
                    {transaction.type === 'CREDIT' ? '+' : '-'}£
                    {transaction.amount.toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-semibold text-gray-900">{transaction.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Candidates */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Suggested Matches
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-500 mt-3">Finding matches...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-gray-500 mt-2">No matching donations or payments found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {candidates.map((candidate) => (
                  <div
                    key={`${candidate.type}-${candidate.id}`}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedCandidate?.id === candidate.id &&
                      selectedCandidate?.type === candidate.type
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-gray-900">
                            {candidate.contact?.firstName} {candidate.contact?.lastName}
                          </p>
                          <Badge className={`text-xs ${
                            candidate.confidence === 'HIGH'
                              ? 'bg-green-100 text-green-700'
                              : candidate.confidence === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {candidate.confidence} Confidence
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600">
                          {candidate.type === 'DONATION' ? 'Donation' : 'Payment'}
                          {' - '}
                          {formatDate(new Date(candidate.date))}
                        </p>

                        {candidate.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {candidate.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          £{candidate.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {selectedCandidate?.id === candidate.id &&
                      selectedCandidate?.type === candidate.type && (
                        <div className="mt-3 pt-3 border-t border-indigo-200 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMatch(candidate);
                            }}
                            disabled={matching}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {matching ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Matching...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Confirm Match
                              </>
                            )}
                          </button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
