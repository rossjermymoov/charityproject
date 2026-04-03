"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Fund {
  id: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
}

export default function FundTransferPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    fromFundId: "",
    toFundId: "",
    amount: "",
    reason: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchFunds();
  }, []);

  const fetchFunds = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/funds/summary");
      if (response.ok) {
        const data = await response.json();
        setFunds(data.funds.filter((f: Fund) => f.isActive));
      }
    } catch (error) {
      console.error("Error fetching funds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.fromFundId || !formData.toFundId || !formData.amount) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    if (formData.fromFundId === formData.toFundId) {
      setErrorMessage("Cannot transfer to the same fund");
      return;
    }

    const fromFund = funds.find((f) => f.id === formData.fromFundId);
    if (fromFund && parseFloat(formData.amount) > fromFund.balance) {
      setErrorMessage(
        `Insufficient balance. Available: £${fromFund.balance.toFixed(2)}`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/funds/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromFundId: formData.fromFundId,
          toFundId: formData.toFundId,
          amount: parseFloat(formData.amount),
          reason: formData.reason || null,
          date: formData.date,
        }),
      });

      if (response.ok) {
        setSuccessMessage("Fund transfer completed successfully");
        setFormData({
          fromFundId: "",
          toFundId: "",
          amount: "",
          reason: "",
          date: new Date().toISOString().split("T")[0],
        });
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Transfer failed");
      }
    } catch (error) {
      console.error("Error creating transfer:", error);
      setErrorMessage("Failed to create transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fromFund = funds.find((f) => f.id === formData.fromFundId);
  const toFund = funds.find((f) => f.id === formData.toFundId);

  if (isLoading) {
    return <div className="p-6">Loading funds...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/finance/funds">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Transfer Funds</h1>
      </div>

      {/* Transfer Card */}
      <Card>
        <CardHeader>
          <CardTitle>Fund Transfer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Messages */}
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {errorMessage}
              </div>
            )}

            {/* From Fund */}
            <div>
              <label className="block text-sm font-medium mb-1">
                From Fund <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.fromFundId}
                onChange={(e) =>
                  setFormData({ ...formData, fromFundId: e.target.value })
                }
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select source fund</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.name} - £{fund.balance.toFixed(2)}
                  </option>
                ))}
              </select>
              {fromFund && (
                <p className="text-xs text-gray-600 mt-1">
                  Available balance: £{fromFund.balance.toFixed(2)}
                </p>
              )}
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>

            {/* To Fund */}
            <div>
              <label className="block text-sm font-medium mb-1">
                To Fund <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.toFundId}
                onChange={(e) =>
                  setFormData({ ...formData, toFundId: e.target.value })
                }
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select destination fund</option>
                {funds
                  .filter((f) => f.id !== formData.fromFundId)
                  .map((fund) => (
                    <option key={fund.id} value={fund.id}>
                      {fund.name} - £{fund.balance.toFixed(2)}
                    </option>
                  ))}
              </select>
              {toFund && (
                <p className="text-xs text-gray-600 mt-1">
                  Current balance: £{toFund.balance.toFixed(2)}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 rounded-l">
                  £
                </span>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="rounded-l-none"
                />
              </div>
              {formData.amount && fromFund && (
                <p className="text-xs text-gray-600 mt-1">
                  Remaining balance: £
                  {(fromFund.balance - parseFloat(formData.amount)).toFixed(2)}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Transfer Date <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Reason (optional)
              </label>
              <Textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Enter transfer reason..."
                rows={3}
              />
            </div>

            {/* Transfer Summary */}
            {formData.fromFundId && formData.toFundId && formData.amount && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Transfer Summary:</strong>
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  From: <strong>{fromFund?.name}</strong>
                </p>
                <p className="text-sm text-blue-800">
                  To: <strong>{toFund?.name}</strong>
                </p>
                <p className="text-sm text-blue-800">
                  Amount: <strong>£{parseFloat(formData.amount).toFixed(2)}</strong>
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Link href="/finance/funds">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Complete Transfer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
