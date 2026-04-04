"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, HelpCircle, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DonorScore {
  contactId: string;
  contactName: string;
  email: string;
  overallScore: number;
  tier: "Platinum" | "Gold" | "Silver" | "Bronze";
  donationFrequency: number;
  totalDonated: number;
  recencyScore: number;
  giftAidStatus: boolean;
  engagementScore: number;
  lastDonationDate: string | null;
  donationCount: number;
}

export default function DonorScoringPage() {
  const [scores, setScores] = useState<DonorScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<{
    field: keyof DonorScore;
    direction: "asc" | "desc";
  }>({ field: "overallScore", direction: "desc" });
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  useEffect(() => {
    fetchDonorScores();
  }, []);

  const fetchDonorScores = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/finance/donor-scoring");
      const data = await response.json();
      setScores(data);
    } catch (error) {
      console.error("Failed to fetch donor scores:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      Platinum: "bg-purple-100 text-purple-800",
      Gold: "bg-yellow-100 text-yellow-800",
      Silver: "bg-gray-100 text-gray-800",
      Bronze: "bg-orange-100 text-orange-800",
    };
    return colors[tier] || "bg-gray-100 text-gray-800";
  };

  const getTierBadgeColor = (tier: string) => {
    const colors: Record<string, string> = {
      Platinum: "bg-purple-50 border-purple-200",
      Gold: "bg-yellow-50 border-yellow-200",
      Silver: "bg-gray-50 border-gray-200",
      Bronze: "bg-orange-50 border-orange-200",
    };
    return colors[tier] || "bg-gray-50 border-gray-200";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-700";
    if (score >= 60) return "text-blue-700";
    if (score >= 40) return "text-yellow-700";
    return "text-red-700";
  };

  const sortedScores = [...scores].sort((a, b) => {
    const aVal = a[sorting.field];
    const bVal = b[sorting.field];

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sorting.direction === "asc" ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal || "");
    const bStr = String(bVal || "");
    return sorting.direction === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const handleSort = (
    field: keyof DonorScore,
    direction: "asc" | "desc" = "asc"
  ) => {
    setSorting({ field, direction });
  };

  const SortHeader = ({
    field,
    label,
  }: {
    field: keyof DonorScore;
    label: string;
  }) => (
    <button
      onClick={() =>
        handleSort(
          field,
          sorting.field === field && sorting.direction === "asc"
            ? "desc"
            : "asc"
        )
      }
      className="font-semibold text-gray-700 hover:text-gray-900 text-left flex items-center gap-1"
    >
      {label}
      {sorting.field === field && (
        <span className="text-xs">
          {sorting.direction === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">
            Settings
          </Link>
          <span>/</span>
          <Link href="/finance" className="hover:text-gray-700">
            Finance
          </Link>
          <span>/</span>
          <span>Donor Scoring</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/finance" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Donor Scoring
              </h1>
              <p className="text-gray-500 mt-1">
                AI-powered prospect scoring based on donation patterns and
                engagement
              </p>
            </div>
          </div>
          <Button
            onClick={fetchDonorScores}
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Scores
          </Button>
        </div>
      </div>

      {/* Scoring Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-purple-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Platinum</p>
                <p className="text-xs text-gray-500">Score 80-100</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Gold</p>
                <p className="text-xs text-gray-500">Score 60-79</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-gray-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Silver</p>
                <p className="text-xs text-gray-500">Score 40-59</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Bronze</p>
                <p className="text-xs text-gray-500">Score 0-39</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scores Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Loading donor scores...</p>
            </div>
          ) : sortedScores.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">
                No donor data available for scoring
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left">
                      <SortHeader field="contactName" label="Contact Name" />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader field="overallScore" label="Score" />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader field="tier" label="Tier" />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        field="totalDonated"
                        label="Total Donated"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        field="donationCount"
                        label="Donations"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader
                        field="lastDonationDate"
                        label="Last Donation"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="font-semibold text-gray-700">
                        Gift Aid
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">
                          Breakdown
                        </span>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedScores.map((score) => (
                    <tr
                      key={score.contactId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {score.contactName}
                          </p>
                          <p className="text-xs text-gray-500">{score.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className={`font-bold text-lg ${getScoreColor(
                            score.overallScore
                          )}`}
                        >
                          {Math.round(score.overallScore)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`${getTierColor(score.tier)} border`}
                        >
                          {score.tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {formatCurrency(score.totalDonated)}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {score.donationCount}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {score.lastDonationDate
                          ? formatDate(new Date(score.lastDonationDate))
                          : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-medium ${
                            score.giftAidStatus
                              ? "text-green-700"
                              : "text-gray-500"
                          }`}
                        >
                          {score.giftAidStatus ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="relative"
                          onMouseEnter={() =>
                            setHoveredTooltip(score.contactId)
                          }
                          onMouseLeave={() => setHoveredTooltip(null)}
                        >
                          <button className="text-gray-400 hover:text-gray-600">
                            <HelpCircle className="h-4 w-4" />
                          </button>
                          {hoveredTooltip === score.contactId && (
                            <div className="absolute right-0 top-8 bg-gray-900 text-white text-xs p-3 rounded-lg whitespace-nowrap z-10 shadow-lg">
                              <p>
                                Frequency:{" "}
                                <span className="font-semibold">
                                  {Math.round(score.donationFrequency)}%
                                </span>
                              </p>
                              <p>
                                Recency:{" "}
                                <span className="font-semibold">
                                  {Math.round(score.recencyScore)}%
                                </span>
                              </p>
                              <p>
                                Engagement:{" "}
                                <span className="font-semibold">
                                  {Math.round(score.engagementScore)}%
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Donors</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {sortedScores.length}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500 opacity-50" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Platinum Tier</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {sortedScores.filter((s) => s.tier === "Platinum").length}
              </p>
            </div>
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
              P
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Avg Score
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Math.round(
                  sortedScores.reduce((sum, s) => sum + s.overallScore, 0) /
                    sortedScores.length
                )}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-yellow-500 opacity-50" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(
                  sortedScores.reduce((sum, s) => sum + s.totalDonated, 0)
                )}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </Card>
      </div>
    </div>
  );
}
