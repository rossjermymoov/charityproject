"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Plus, Download, FileText, AlertCircle } from "lucide-react";
import { useUser } from "@/lib/auth";

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
  createdBy: { name: string };
}

export default function GasdsPage() {
  const user = useUser();
  const [selectedTaxYear, setSelectedTaxYear] = useState(() => {
    // Default to current tax year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // UK tax year: April 6 to April 5
    // If current date is before April 6, use previous year
    if (currentMonth < 4 || (currentMonth === 4 && now.getDate() < 6)) {
      return `${currentYear - 1}-${String(currentYear).slice(2)}`;
    }
    return `${currentYear}-${String(currentYear + 1).slice(2)}`;
  });

  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [claims, setClaims] = useState<GasdsClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch eligibility data and claims
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const token = user.id; // Using user ID as bearer token

        // Fetch eligibility
        const eligRes = await fetch(`/api/gasds/eligible?taxYear=${selectedTaxYear}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!eligRes.ok) throw new Error("Failed to fetch eligibility");
        const eligData = await eligRes.json();
        setEligibility(eligData);

        // Fetch claims for this tax year
        const claimsRes = await fetch(`/api/gasds/claims?taxYear=${selectedTaxYear}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!claimsRes.ok) throw new Error("Failed to fetch claims");
        const claimsData = await claimsRes.json();
        setClaims(claimsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedTaxYear]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "secondary";
      case "READY":
        return "outline";
      case "SUBMITTED":
        return "default";
      case "ACCEPTED":
        return "default";
      case "REJECTED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GASDS Claims</h1>
          <p className="text-gray-500 mt-1">
            Gift Aid Small Donations Scheme
          </p>
        </div>
        <Link href="/finance/gift-aid/gasds/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Claim
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Tax Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Tax Year</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedTaxYear}
            onValueChange={setSelectedTaxYear}
          >
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
            <option value="2026-27">2026-27</option>
          </Select>
        </CardContent>
      </Card>

      {/* Eligibility Card */}
      {eligibility && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your GASDS Allowance</CardTitle>
                <CardDescription className="mt-1">
                  Tax year {eligibility.taxYear}
                </CardDescription>
              </div>
              <div className={`text-sm font-semibold px-3 py-1 rounded-full ${
                eligibility.eligible
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {eligibility.eligible ? "Eligible" : "Limit Reached"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Annual Limit</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{eligibility.annualLimit.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Regular Gift Aid</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{eligibility.regularGiftAid.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Already Claimed</p>
                <p className="text-2xl font-bold text-amber-600">
                  £{eligibility.claimed.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-green-600">
                  £{eligibility.remaining.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Allowance Used</span>
                <span className="text-gray-600">
                  {eligibility.annualLimit > 0
                    ? Math.round((eligibility.claimed / eligibility.annualLimit) * 100)
                    : 0}
                  %
                </span>
              </div>
              <Progress
                value={
                  eligibility.annualLimit > 0
                    ? (eligibility.claimed / eligibility.annualLimit) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            <p className="text-xs text-gray-600">
              The annual limit is the lower of £8,000 or 10 times your regular Gift Aid.
              Your limit is £{eligibility.annualLimit.toFixed(2)}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>GASDS Claims</CardTitle>
          <CardDescription>
            All claims for {selectedTaxYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading claims...</div>
          ) : claims.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No claims for this tax year</p>
              <Link href="/finance/gift-aid/gasds/new">
                <Button variant="outline" className="mt-4">
                  Create First Claim
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Period
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Donations
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Claim Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Created By
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {new Date(claim.claimPeriodStart).toLocaleDateString("en-GB")} -{" "}
                          {new Date(claim.claimPeriodEnd).toLocaleDateString("en-GB")}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          £{claim.totalSmallDonations.toFixed(2)}
                          <span className="text-gray-500 ml-2">
                            ({claim.entries.length})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        £{claim.claimAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(claim.status)}>
                          {getStatusLabel(claim.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {claim.createdBy.name}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/finance/gift-aid/gasds/${claim.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
