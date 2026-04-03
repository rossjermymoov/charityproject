"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, AlertCircle } from "lucide-react";

interface EligibilityData {
  taxYear: string;
  annualLimit: number;
  regularGiftAid: number;
  claimed: number;
  remaining: number;
  eligible: boolean;
}

interface GasdsClaim {
  id: string;
  taxYear: string;
  claimPeriodStart: string;
  claimPeriodEnd: string;
  totalSmallDonations: number;
  claimAmount: number;
  status: string;
  submittedAt?: string;
  entries: Array<{ id: string; amount: number; date: string; source: string }>;
  createdBy?: { name: string };
}

function getCurrentTaxYear(): string {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  if (m < 4 || (m === 4 && now.getDate() < 6)) {
    return `${y - 1}-${String(y).slice(2)}`;
  }
  return `${y}-${String(y + 1).slice(2)}`;
}

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  READY: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function GasdsPage() {
  const [selectedTaxYear, setSelectedTaxYear] = useState(getCurrentTaxYear);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [claims, setClaims] = useState<GasdsClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eligRes, claimsRes] = await Promise.all([
          fetch(`/api/gasds/eligible?taxYear=${selectedTaxYear}`),
          fetch(`/api/gasds/claims?taxYear=${selectedTaxYear}`),
        ]);
        if (eligRes.ok) setEligibility(await eligRes.json());
        if (claimsRes.ok) setClaims(await claimsRes.json());
      } catch {
        setError("Failed to load GASDS data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedTaxYear]);

  const pctUsed =
    eligibility && eligibility.annualLimit > 0
      ? Math.round((eligibility.claimed / eligibility.annualLimit) * 100)
      : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GASDS Claims</h1>
          <p className="text-gray-500 mt-1">Gift Aid Small Donations Scheme</p>
        </div>
        <Link href="/finance/gift-aid/gasds/new">
          <button className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            <Plus className="h-4 w-4" /> New Claim
          </button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Tax Year Selector */}
      <div className="rounded-lg border bg-white p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tax Year</label>
        <select
          value={selectedTaxYear}
          onChange={(e) => setSelectedTaxYear(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="2024-25">2024-25</option>
          <option value="2025-26">2025-26</option>
          <option value="2026-27">2026-27</option>
        </select>
      </div>

      {/* Eligibility Card */}
      {eligibility && (
        <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Your GASDS Allowance</h2>
              <p className="text-sm text-gray-600 mt-0.5">Tax year {eligibility.taxYear}</p>
            </div>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${
                eligibility.eligible ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {eligibility.eligible ? "Eligible" : "Limit Reached"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Annual Limit</p>
              <p className="text-2xl font-bold text-gray-900">£{eligibility.annualLimit.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Regular Gift Aid</p>
              <p className="text-2xl font-bold text-gray-900">£{eligibility.regularGiftAid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Already Claimed</p>
              <p className="text-2xl font-bold text-amber-600">£{eligibility.claimed.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-green-600">£{eligibility.remaining.toFixed(2)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Allowance Used</span>
              <span className="text-gray-600">{pctUsed}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${pctUsed >= 100 ? "bg-red-500" : pctUsed >= 75 ? "bg-amber-500" : "bg-blue-500"}`}
                style={{ width: `${Math.min(pctUsed, 100)}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-600 mt-4">
            The annual limit is the lower of £8,000 or 10 times your regular Gift Aid.
          </p>
        </div>
      )}

      {/* Claims Table */}
      <div className="rounded-lg border bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Claims for {selectedTaxYear}</h2>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading claims...</div>
          ) : claims.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No claims for this tax year</p>
              <Link href="/finance/gift-aid/gasds/new">
                <button className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                  Create First Claim
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Period</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Donations</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Claim Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(claim.claimPeriodStart).toLocaleDateString("en-GB")} –{" "}
                        {new Date(claim.claimPeriodEnd).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 px-4">
                        £{claim.totalSmallDonations.toFixed(2)}
                        <span className="text-gray-500 ml-1">({claim.entries?.length ?? 0})</span>
                      </td>
                      <td className="py-3 px-4 font-semibold">£{claim.claimAmount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyles[claim.status] || "bg-gray-100 text-gray-700"}`}>
                          {claim.status.charAt(0) + claim.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/finance/gift-aid/gasds/${claim.id}`} className="text-teal-600 hover:underline text-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
