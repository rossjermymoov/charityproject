"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

interface RenewalStats {
  upcomingCount: number;
  overdueCount: number;
  recentlyRenewedCount: number;
  totalRevenue: number;
}

interface UpcomingRenewal {
  id: string;
  memberNumber: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
  membershipType: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  endDate: string;
  autoRenew: boolean;
  daysUntilRenewal: number;
}

interface ExpiredMembership {
  id: string;
  memberNumber: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
  membershipType: {
    id: string;
    name: string;
    renewalGraceDays: number;
  };
  endDate: string;
  status: string;
  daysSinceExpiry: number;
}

export default function RenewalDashboardPage() {
  const [stats, setStats] = useState<RenewalStats | null>(null);
  const [upcomingRenewals, setUpcomingRenewals] = useState<UpcomingRenewal[]>([]);
  const [expiredMemberships, setExpiredMemberships] = useState<ExpiredMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, upcomingRes, expiredRes] = await Promise.all([
        fetch("/api/memberships/renewal-stats"),
        fetch("/api/memberships/upcoming-renewals?days=30"),
        fetch("/api/memberships/expired"),
      ]);

      if (!statsRes.ok || !upcomingRes.ok || !expiredRes.ok) {
        throw new Error("Failed to load renewal data");
      }

      const statsData = await statsRes.json();
      const upcomingData = await upcomingRes.json();
      const expiredData = await expiredRes.json();

      setStats(statsData);
      setUpcomingRenewals(upcomingData);
      setExpiredMemberships(expiredData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      console.error("Error loading renewal data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleProcessRenewals() {
    try {
      setProcessing(true);
      const res = await fetch("/api/memberships/process-renewals", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to process renewals");
      }

      const result = await res.json();
      alert(
        `Processed ${result.processed} renewals. ${result.failed} failed.${
          result.errors.length > 0 ? ` Errors: ${result.errors.join("; ")}` : ""
        }`
      );

      // Reload data
      await loadData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      alert(`Error: ${errorMsg}`);
      console.error("Error processing renewals:", err);
    } finally {
      setProcessing(false);
    }
  }

  async function handleManualRenewal(membershipId: string) {
    try {
      const res = await fetch(`/api/memberships/${membershipId}/renew`, {
        method: "PUT",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to renew membership");
      }

      alert("Membership renewed successfully!");
      await loadData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      alert(`Error: ${errorMsg}`);
      console.error("Error renewing membership:", err);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Membership Renewals</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage automatic membership renewals and track renewal status
          </p>
        </div>
        <Button
          onClick={handleProcessRenewals}
          disabled={processing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {processing ? "Processing..." : "Process Auto-Renewals"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Upcoming Renewals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {stats.upcomingCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                in the next 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {stats.overdueCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                expired or lapsed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Recently Renewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {stats.recentlyRenewedCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                in the last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Annual Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                £{stats.totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                from active memberships
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Renewals */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Renewals (Next 30 Days)</CardTitle>
          <CardDescription>
            Memberships scheduled to renew in the next month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingRenewals.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No upcoming renewals"
              description="All memberships with upcoming renewals are up to date"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Member
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Membership
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Current Expiry
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Days Left
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingRenewals.map((renewal) => (
                    <tr
                      key={renewal.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {renewal.contact.firstName} {renewal.contact.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {renewal.memberNumber}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {renewal.membershipType.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            £{renewal.membershipType.price.toFixed(2)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(new Date(renewal.endDate))}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            renewal.daysUntilRenewal <= 7
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {renewal.daysUntilRenewal} days
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/finance/memberships/${renewal.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          {renewal.autoRenew && (
                            <Button
                              size="sm"
                              onClick={() => handleManualRenewal(renewal.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Renew Now
                            </Button>
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

      {/* Expired Memberships */}
      <Card>
        <CardHeader>
          <CardTitle>Expired & Lapsed Memberships</CardTitle>
          <CardDescription>
            Memberships that have expired and may need renewal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expiredMemberships.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No expired memberships"
              description="All memberships are current or active"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Member
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Membership
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Expired Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Days Expired
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expiredMemberships.map((membership) => (
                    <tr
                      key={membership.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {membership.contact.firstName} {membership.contact.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {membership.memberNumber}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">
                          {membership.membershipType.name}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(new Date(membership.endDate))}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            membership.status === "EXPIRED"
                              ? "bg-red-100 text-red-800"
                              : "bg-orange-100 text-orange-800"
                          }
                        >
                          {membership.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {membership.daysSinceExpiry} days
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/finance/memberships/${membership.id}`}>
                          <Button variant="outline" size="sm">
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
