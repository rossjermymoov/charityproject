"use client";

import { formatDate, formatShortDate } from '@/lib/utils';

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Download,
  Send,
  Check,
  AlertCircle,
  Loader,
} from "lucide-react";
// Auth handled by API routes via cookies

interface GasdsClaim {
  id: string;
  taxYear: string;
  claimPeriodStart: string;
  claimPeriodEnd: string;
  totalSmallDonations: number;
  claimAmount: number;
  status: string;
  hmrcReference?: string;
  submittedAt?: string;
  responseAt?: string;
  notes?: string;
  entries: Array<{
    id: string;
    date: string;
    source: string;
    amount: number;
    description?: string;
  }>;
  createdBy: { name: string; email: string };
  createdAt: string;
}

export default function GasdsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [claim, setClaim] = useState<GasdsClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const res = await fetch(`/api/gasds/claims/${id}`);

        if (!res.ok) {
          throw new Error("Failed to fetch claim");
        }

        setClaim(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load claim");
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [id]);

  const handleDelete = async () => {
    if (!claim) return;

    if (!window.confirm("Are you sure you want to delete this claim? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/gasds/claims/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete claim");
      }

      router.push("/finance/gift-aid/gasds");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete claim");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async () => {
    if (!claim) return;

    if (!window.confirm("Submit this claim to HMRC? This action cannot be undone.")) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/gasds/claims/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "SUBMITTED",
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit claim");
      }

      const updated = await res.json();
      setClaim(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit claim");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const getStatusTimeline = (claim: GasdsClaim) => {
    const events = [
      { label: "Created", date: claim.createdAt, icon: Check },
      claim.submittedAt && { label: "Submitted", date: claim.submittedAt, icon: Send },
      claim.responseAt && {
        label: claim.status === "ACCEPTED" ? "Accepted" : "Rejected",
        date: claim.responseAt,
        icon: claim.status === "ACCEPTED" ? Check : AlertCircle,
      },
    ].filter(Boolean) as Array<{ label: string; date: string; icon: any }>;

    return events;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">Claim not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeline = getStatusTimeline(claim);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/finance/gift-aid/gasds">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">GASDS Claim</h1>
            <p className="text-gray-500 mt-1">
              {formatDate(claim.claimPeriodStart)} -{" "}
              {formatDate(claim.claimPeriodEnd)}
            </p>
          </div>
        </div>
        <Badge variant={getStatusColor(claim.status)} className="text-base">
          {getStatusLabel(claim.status)}
        </Badge>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Tax Year</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{claim.taxYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Donations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">£{claim.totalSmallDonations.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Claim Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">£{claim.claimAmount.toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-1">25% of donations</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((event, index) => {
                const Icon = event.icon;
                const isLast = index === timeline.length - 1;

                return (
                  <div key={event.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      {!isLast && (
                        <div className="w-0.5 h-8 bg-gray-200 my-2" />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className="font-medium text-gray-900">{event.label}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleString("en-GB", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* HMRC Reference */}
      {claim.hmrcReference && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">HMRC Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm bg-gray-50 p-3 rounded border border-gray-200">
              {claim.hmrcReference}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {claim.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{claim.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Entries ({claim.entries.length})</CardTitle>
          <CardDescription>Individual donations included in this claim</CardDescription>
        </CardHeader>
        <CardContent>
          {claim.entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No entries</div>
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
                  </tr>
                </thead>
                <tbody>
                  {claim.entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {formatDate(entry.date)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{entry.source}</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">£{entry.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {entry.description || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claim Info */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Claim Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Created by:</span>
            <span className="font-medium">
              {claim.createdBy.name} ({claim.createdBy.email})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">
              {new Date(claim.createdAt).toLocaleString("en-GB")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        {claim.status === "DRAFT" && (
          <>
            <Button
              variant="outline"
              onClick={() => router.push(`/finance/gift-aid/gasds/${claim.id}/edit`)}
              className="flex-1"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </>
        )}

        {claim.status === "READY" && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "Submitting..." : "Submit to HMRC"}
          </Button>
        )}

        {(claim.status === "SUBMITTED" || claim.status === "ACCEPTED" || claim.status === "REJECTED") && (
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download Claim
          </Button>
        )}

        <Link href="/finance/gift-aid/gasds" className="flex-1">
          <Button variant="outline" className="w-full">
            Back to Claims
          </Button>
        </Link>
      </div>
    </div>
  );
}
