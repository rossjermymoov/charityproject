"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Download, Trash2, AlertCircle } from "lucide-react";
import { useUser } from "@/lib/auth";

interface GasdsEntry {
  id: string;
  date: string;
  source: string;
  amount: number;
  description?: string;
}

export default function NewGasdsPage() {
  const router = useRouter();
  const user = useUser();

  const [taxYear, setTaxYear] = useState(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    if (currentMonth < 4 || (currentMonth === 4 && now.getDate() < 6)) {
      return `${currentYear - 1}-${String(currentYear).slice(2)}`;
    }
    return `${currentYear}-${String(currentYear + 1).slice(2)}`;
  });

  const [claimPeriodStart, setClaimPeriodStart] = useState("");
  const [claimPeriodEnd, setClaimPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");

  const [entries, setEntries] = useState<GasdsEntry[]>([]);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    source: "CASH",
    amount: "",
    description: "",
  });

  const [eligibility, setEligibility] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch eligibility when tax year changes
  useEffect(() => {
    const fetchEligibility = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/gasds/eligible?taxYear=${taxYear}`, {
          headers: { Authorization: `Bearer ${user.id}` },
        });
        if (res.ok) {
          setEligibility(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch eligibility:", err);
      }
    };
    fetchEligibility();
  }, [user, taxYear]);

  const handleAddEntry = () => {
    if (!newEntry.date || !newEntry.amount || isNaN(parseFloat(newEntry.amount))) {
      setError("Please enter a valid date and amount");
      return;
    }

    const amount = parseFloat(newEntry.amount);
    if (amount <= 0 || amount > 30) {
      setError("Amount must be between £0.01 and £30");
      return;
    }

    // Check if total would exceed remaining limit
    const total = entries.reduce((sum, e) => sum + e.amount, 0) + amount;
    if (eligibility && total > eligibility.remaining) {
      setError(
        `Total would exceed remaining allowance of £${eligibility.remaining.toFixed(2)}`
      );
      return;
    }

    const entry: GasdsEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: newEntry.date,
      source: newEntry.source,
      amount,
      description: newEntry.description || undefined,
    };

    setEntries([...entries, entry]);
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      source: "CASH",
      amount: "",
      description: "",
    });
    setError(null);
  };

  const handleRemoveEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const handleSubmit = async (action: "draft" | "ready") => {
    if (!user) return;

    if (!taxYear || !claimPeriodStart || !claimPeriodEnd) {
      setError("Please fill in all claim details");
      return;
    }

    if (entries.length === 0) {
      setError("Please add at least one entry");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create claim
      const claimRes = await fetch("/api/gasds/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          taxYear,
          claimPeriodStart,
          claimPeriodEnd,
          notes: notes || null,
        }),
      });

      if (!claimRes.ok) {
        const err = await claimRes.json();
        throw new Error(err.error || "Failed to create claim");
      }

      const claim = await claimRes.json();

      // Add entries
      let totalAmount = 0;
      for (const entry of entries) {
        const entryRes = await fetch("/api/gasds/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.id}`,
          },
          body: JSON.stringify({
            claimId: claim.id,
            date: entry.date,
            source: entry.source,
            amount: entry.amount,
            description: entry.description,
          }),
        });

        if (!entryRes.ok) {
          const err = await entryRes.json();
          throw new Error(err.error || "Failed to add entry");
        }
        totalAmount += entry.amount;
      }

      // Update claim status if needed
      if (action === "ready") {
        await fetch(`/api/gasds/claims/${claim.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.id}`,
          },
          body: JSON.stringify({ status: "READY" }),
        });
      }

      setSuccess(`Claim created successfully with £${totalAmount.toFixed(2)} in entries`);
      setTimeout(() => {
        router.push(`/finance/gift-aid/gasds/${claim.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const claimValue = Math.round(totalAmount * 0.25 * 100) / 100;

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/finance/gift-aid/gasds">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New GASDS Claim</h1>
          <p className="text-gray-500 mt-1">Create a new claim for small donations</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 flex gap-2">
            <div className="text-sm text-green-800">{success}</div>
          </CardContent>
        </Card>
      )}

      {/* Eligibility Alert */}
      {eligibility && !eligibility.eligible && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              You have reached your GASDS allowance for {taxYear}. Annual limit is £
              {eligibility.annualLimit.toFixed(2)}.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claim Details */}
      <Card>
        <CardHeader>
          <CardTitle>Claim Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Year
              </label>
              <Select value={taxYear} onValueChange={setTaxYear}>
                <option value="2024-25">2024-25</option>
                <option value="2025-26">2025-26</option>
                <option value="2026-27">2026-27</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period Start
              </label>
              <Input
                type="date"
                value={claimPeriodStart}
                onChange={(e) => setClaimPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period End
              </label>
              <Input
                type="date"
                value={claimPeriodEnd}
                onChange={(e) => setClaimPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this claim..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Add Donations</CardTitle>
          <CardDescription>
            Add individual small cash/contactless donations (max £30 each)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <Input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <Select
                value={newEntry.source}
                onValueChange={(value) => setNewEntry({ ...newEntry, source: value })}
              >
                <option value="CASH">Cash</option>
                <option value="CONTACTLESS">Contactless</option>
                <option value="COLLECTION_TIN">Collection Tin</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (£)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="30"
                value={newEntry.amount}
                onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddEntry} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <Input
              type="text"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              placeholder="e.g., Collection at community center"
            />
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Entries ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No entries added yet. Add donations above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Source
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(entry.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{entry.source}</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">£{entry.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {entry.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEntry(entry.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {entries.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Claim Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Donations</p>
                <p className="text-2xl font-bold">£{totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Claim Value (25%)</p>
                <p className="text-2xl font-bold text-green-600">£{claimValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining Allowance</p>
                <p className="text-2xl font-bold text-indigo-600">
                  £
                  {eligibility
                    ? (eligibility.remaining - totalAmount).toFixed(2)
                    : "N/A"}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              The claim amount is calculated as 25% of the total donations, matching the
              basic rate of income tax.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/finance/gift-aid/gasds" className="flex-1">
          <Button variant="outline" className="w-full">
            Cancel
          </Button>
        </Link>
        <Button
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={isSubmitting || entries.length === 0}
          className="flex-1"
        >
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit("ready")}
          disabled={isSubmitting || entries.length === 0}
          className="flex-1"
        >
          {isSubmitting ? "Creating..." : "Create & Mark Ready"}
        </Button>
      </div>
    </div>
  );
}
