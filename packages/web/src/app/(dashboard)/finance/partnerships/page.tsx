"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

interface Partnership {
  id: string;
  type: string;
  status: string;
  annualValue: number | null;
  totalValue: number | null;
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  organisation: {
    id: string;
    name: string;
  };
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface Stats {
  total: number;
  activeCount: number;
  totalAnnualValue: number;
  totalValue: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

const statusColors: Record<string, string> = {
  PROSPECT: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  LAPSED: "bg-orange-100 text-orange-800",
  ENDED: "bg-gray-100 text-gray-800",
};

const typeLabels: Record<string, string> = {
  SPONSOR: "Sponsor",
  PARTNER: "Partner",
  PATRON: "Patron",
  CORPORATE_DONOR: "Corporate Donor",
};

export default function PartnershipsPage() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [partnershipsRes, statsRes] = await Promise.all([
          fetch(
            `/api/partnerships?${new URLSearchParams({
              ...(search && { search }),
              ...(statusFilter && { status: statusFilter }),
              ...(typeFilter && { type: typeFilter }),
            }).toString()}`
          ),
          fetch("/api/partnerships/stats"),
        ]);

        if (partnershipsRes.ok) {
          setPartnerships(await partnershipsRes.json());
        }

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } catch (error) {
        console.error("Error fetching partnerships:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partnerships</h1>
          <p className="text-gray-600">Manage corporate partnerships and sponsorships</p>
        </div>
        <Link href="/finance/partnerships/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Partnership
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Partnerships</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-600">{stats.activeCount} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Annual Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                £{(stats.totalAnnualValue / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-gray-600">From active partnerships</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                £{(stats.totalValue / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-gray-600">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Prospects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.PROSPECT || 0}</div>
              <p className="text-xs text-gray-600">Awaiting activation</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <Input
            placeholder="Search partnerships..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Select
          options={[
            { value: "", label: "All Statuses" },
            { value: "PROSPECT", label: "Prospect" },
            { value: "ACTIVE", label: "Active" },
            { value: "LAPSED", label: "Lapsed" },
            { value: "ENDED", label: "Ended" },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
        <Select
          options={[
            { value: "", label: "All Types" },
            { value: "SPONSOR", label: "Sponsor" },
            { value: "PARTNER", label: "Partner" },
            { value: "PATRON", label: "Patron" },
            { value: "CORPORATE_DONOR", label: "Corporate Donor" },
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
      </div>

      {/* Partnerships Table */}
      <Card>
        <CardHeader>
          <CardTitle>Partnerships</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${partnerships.length} partnership${partnerships.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading partnerships...</div>
          ) : partnerships.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No partnerships found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-gray-600 font-semibold">
                    <th className="pb-3 px-4">Organisation</th>
                    <th className="pb-3 px-4">Type</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Contact</th>
                    <th className="pb-3 px-4">Annual Value</th>
                    <th className="pb-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partnerships.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium">{p.organisation.name}</td>
                      <td className="py-4 px-4">{typeLabels[p.type] || p.type}</td>
                      <td className="py-4 px-4">
                        <Badge className={statusColors[p.status] || "bg-gray-100 text-gray-800"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {p.contact ? `${p.contact.firstName} ${p.contact.lastName}` : "-"}
                      </td>
                      <td className="py-4 px-4">
                        {p.annualValue ? `£${Number(p.annualValue).toFixed(2)}` : "-"}
                      </td>
                      <td className="py-4 px-4">
                        <Link href={`/finance/partnerships/${p.id}`}>
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
