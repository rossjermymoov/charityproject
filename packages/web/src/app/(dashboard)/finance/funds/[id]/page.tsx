"use client";

import { formatDate, formatShortDate } from '@/lib/utils';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  TrendingDown,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Fund {
  id: string;
  name: string;
  type: string;
  description: string | null;
  isActive: boolean;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface FundTransaction {
  id: string;
  fundId: string;
  type: string;
  amount: number;
  description: string | null;
  reference: string | null;
  donationId: string | null;
  date: string;
  createdById: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

const transactionTypeIcons: Record<string, React.ReactNode> = {
  DEPOSIT: <TrendingUp className="w-4 h-4 text-green-600" />,
  WITHDRAWAL: <TrendingDown className="w-4 h-4 text-red-600" />,
  ADJUSTMENT: <AlertCircle className="w-4 h-4 text-yellow-600" />,
  TRANSFER_IN: <TrendingUp className="w-4 h-4 text-green-600" />,
  TRANSFER_OUT: <TrendingDown className="w-4 h-4 text-red-600" />,
};

export default function FundDetailPage() {
  const params = useParams();
  const fundId = params.id as string;

  const [fund, setFund] = useState<Fund | null>(null);
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "DEPOSIT",
    amount: "",
    description: "",
    reference: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchFundData();
  }, [fundId]);

  const fetchFundData = async () => {
    try {
      setIsLoading(true);
      const [fundResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/funds/${fundId}`),
        fetch(`/api/funds/${fundId}/transactions`),
      ]);

      if (fundResponse.ok) {
        setFund(await fundResponse.json());
      }
      if (transactionsResponse.ok) {
        setTransactions(await transactionsResponse.json());
      }
    } catch (error) {
      console.error("Error fetching fund data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/funds/${fundId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          amount: parseFloat(formData.amount),
          description: formData.description || null,
          reference: formData.reference || null,
          date: formData.date,
        }),
      });

      if (response.ok) {
        setIsTransactionOpen(false);
        setFormData({
          type: "DEPOSIT",
          amount: "",
          description: "",
          reference: "",
          date: new Date().toISOString().split("T")[0],
        });
        fetchFundData();
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading fund details...</div>;
  }

  if (!fund) {
    return <div className="p-6">Fund not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/finance/funds">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{fund.name}</h1>
            <Badge>{fund.type}</Badge>
            {!fund.isActive && <Badge variant="outline">Inactive</Badge>}
          </div>
          {fund.description && (
            <p className="text-gray-600 mt-2">{fund.description}</p>
          )}
        </div>
        <Button onClick={() => setIsTransactionOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <span className="text-4xl font-bold text-blue-900">
              {fund.balance.toFixed(2)}
            </span>
            <span className="text-xl text-blue-700">GBP</span>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions for this fund</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {transactionTypeIcons[transaction.type] || (
                        <DollarSign className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{transaction.type}</h4>
                        {transaction.reference && (
                          <span className="text-xs text-gray-500">
                            {transaction.reference}
                          </span>
                        )}
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-gray-600">
                          {transaction.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {transaction.createdBy.name} •{" "}
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        transaction.type === "WITHDRAWAL" ||
                        transaction.type === "TRANSFER_OUT"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {transaction.type === "WITHDRAWAL" ||
                      transaction.type === "TRANSFER_OUT"
                        ? "-"
                        : "+"}
                      £{transaction.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Transaction Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="TRANSFER_IN">Transfer In</option>
                <option value="TRANSFER_OUT">Transfer Out</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <Input
                required
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input
                required
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter transaction details..."
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Reference (optional)
              </label>
              <Input
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
                placeholder="e.g., invoice number or check number"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTransactionOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Transaction</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
