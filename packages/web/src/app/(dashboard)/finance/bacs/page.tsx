"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, RefreshCw, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Payment {
  id: string;
  contactName: string;
  contactEmail: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface PaymentRun {
  id: string;
  totalAmount: number;
  paymentCount: number;
  status: "PENDING" | "GENERATED" | "SUBMITTED" | "COMPLETED";
  createdAt: string;
}

export default function BacsPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentRuns, setPaymentRuns] = useState<PaymentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(
    new Set()
  );
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/finance/bacs/pending");
      const data = await response.json();
      setPayments(data.payments || []);
      setPaymentRuns(data.paymentRuns || []);
    } catch (error) {
      console.error("Failed to fetch BACS data:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePayment = (paymentId: string) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const selectAll = () => {
    if (selectedPayments.size === payments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(payments.map((p) => p.id)));
    }
  };

  const generateBACS = async () => {
    if (selectedPayments.size === 0) return;

    setGenerating(true);
    try {
      const response = await fetch("/api/finance/bacs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIds: Array.from(selectedPayments),
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BACS_${new Date().toISOString().split("T")[0]}.bacs`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        fetchPayments();
        setSelectedPayments(new Set());
      }
    } catch (error) {
      console.error("Failed to generate BACS file:", error);
    } finally {
      setGenerating(false);
    }
  };

  const selectedTotal = payments
    .filter((p) => selectedPayments.has(p.id))
    .reduce((sum, p) => sum + p.amount, 0);

  const selectedCount = selectedPayments.size;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/finance" className="hover:text-gray-700">
            Finance
          </Link>
          <span>/</span>
          <span>BACS Payments</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/finance" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                BACS Payment File Generator
              </h1>
              <p className="text-gray-500 mt-1">
                Generate BACS Standard 18 files for payment runs
              </p>
            </div>
          </div>
          <Button
            onClick={fetchPayments}
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Pending Payments Section */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Pending Payments</h3>
          <span className="text-sm text-gray-500">
            {payments.length} payment{payments.length !== 1 ? "s" : ""}
          </span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Loading pending payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                No pending payments available for BACS export
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selection Summary */}
              {selectedCount > 0 && (
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div>
                    <p className="text-sm font-medium text-indigo-900">
                      {selectedCount} payment{selectedCount !== 1 ? "s" : ""}{" "}
                      selected
                    </p>
                    <p className="text-sm text-indigo-700">
                      Total: {formatCurrency(selectedTotal)}
                    </p>
                  </div>
                  <Button
                    onClick={generateBACS}
                    disabled={generating}
                    className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {generating ? "Generating..." : "Generate BACS File"}
                  </Button>
                </div>
              )}

              {/* Payments Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedPayments.size === payments.length &&
                            payments.length > 0
                          }
                          onChange={selectAll}
                          className="h-4 w-4 text-indigo-600 rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Beneficiary
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedPayments.has(payment.id)}
                            onChange={() => togglePayment(payment.id)}
                            className="h-4 w-4 text-indigo-600 rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {payment.contactName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payment.contactEmail}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(new Date(payment.createdAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Run History */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Payment Run History</h3>
        </CardHeader>
        <CardContent>
          {paymentRuns.length === 0 ? (
            <p className="text-sm text-gray-500">No payment runs yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Payments
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paymentRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(new Date(run.createdAt))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {run.paymentCount}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatCurrency(run.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`${
                            run.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : run.status === "SUBMITTED"
                                ? "bg-blue-100 text-blue-800"
                                : run.status === "GENERATED"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {run.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-2">BACS File Format</h4>
          <p className="text-sm text-blue-800 mb-2">
            Generated files use the BACS Standard 18 format required by UK banks.
            Files are compatible with:
          </p>
          <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
            <li>Barclays, HSBC, Lloyds, Natwest and other major UK banks</li>
            <li>Accounting software (Xero, Sage, QuickBooks)</li>
            <li>Payment platforms and gateways</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
