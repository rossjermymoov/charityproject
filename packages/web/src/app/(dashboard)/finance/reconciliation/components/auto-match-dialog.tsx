'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface AutoMatchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onComplete: () => void;
}

export function AutoMatchDialog({
  isOpen,
  onOpenChange,
  sessionId,
  onComplete,
}: AutoMatchDialogProps) {
  const [step, setStep] = useState<'confirm' | 'running' | 'complete'>('confirm');
  const [matchResults, setMatchResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleStartAutoMatch = async () => {
    setIsRunning(true);
    setStep('running');

    try {
      const response = await fetch('/api/reconciliation/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();
      setMatchResults(data);
      setStep('complete');

      // Auto-close after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Auto-match failed:', error);
      setStep('complete');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>Auto-Match Transactions</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-600">
                    This will automatically match unmatched transactions to donations
                    and payments using intelligent matching algorithms based on:
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Exact amount within 3 days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Reference number matching</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Amount range within 5%</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartAutoMatch}
                  disabled={isRunning}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                >
                  Start
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'running' && (
          <>
            <DialogHeader>
              <DialogTitle>Running Auto-Match</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-center py-8">
              <Loader2 className="h-12 w-12 text-indigo-600 mx-auto animate-spin" />
              <div>
                <p className="font-semibold text-gray-900">Matching transactions...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
              </div>
            </div>
          </>
        )}

        {step === 'complete' && (
          <>
            <DialogHeader>
              <DialogTitle>Auto-Match Complete</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  {matchResults ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {matchResults.transactionsWithMatches} transactions matched
                          </p>
                          <p className="text-sm text-gray-500">
                            Out of {matchResults.totalTransactions} processed
                          </p>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded p-3 mt-4">
                        <p className="text-sm text-green-700 font-medium">
                          Review and confirm matches in the transaction list
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-gray-600">
                        Something went wrong. Please try again.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <button
                onClick={() => {
                  onOpenChange(false);
                  onComplete();
                }}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
