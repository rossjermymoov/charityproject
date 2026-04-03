"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  TrendingUp,
  Lock,
  Target,
  ArrowRight,
  Eye,
  Edit2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

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

interface FundSummary {
  totalBalance: number;
  fundCount: number;
  byType: {
    UNRESTRICTED: number;
    RESTRICTED: number;
    ENDOWMENT: number;
  };
  funds: Fund[];
}

const fundTypeIcons: Record<string, React.ReactNode> = {
  UNRESTRICTED: <TrendingUp className="w-5 h-5" />,
  RESTRICTED: <Lock className="w-5 h-5" />,
  ENDOWMENT: <Target className="w-5 h-5" />,
};

const fundTypeColors: Record<string, string> = {
  UNRESTRICTED: "bg-blue-100 text-blue-800",
  RESTRICTED: "bg-amber-100 text-amber-800",
  ENDOWMENT: "bg-purple-100 text-purple-800",
};

export default function FundsPage() {
  const [summary, setSummary] = useState<FundSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "UNRESTRICTED",
    description: "",
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/funds/summary");
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Error fetching fund summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFund = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsCreateOpen(false);
        setFormData({ name: "", type: "UNRESTRICTED", description: "" });
        fetchSummary();
      }
    } catch (error) {
      console.error("Error creating fund:", error);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading funds...</div>;
  }

  if (!summary) {
    return <div className="p-6">Failed to load funds</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fund Accounting</h1>
          <p className="text-gray-600 mt-2">
            Manage unrestricted, restricted, and endowment funds
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/funds/transfer">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4 mr-2" />
              Transfer
            </Button>
          </Link>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Fund
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{summary.totalBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unrestricted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{summary.byType.UNRESTRICTED.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{summary.byType.RESTRICTED.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Endowment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{summary.byType.ENDOWMENT.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funds List */}
      <Card>
        <CardHeader>
          <CardTitle>Funds ({summary.fundCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.funds.length === 0 ? (
              <p className="text-gray-500">No funds created yet</p>
            ) : (
              summary.funds.map((fund) => (
                <Link key={fund.id} href={`/finance/funds/${fund.id}`}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400">
                          {fundTypeIcons[fund.type] || <TrendingUp className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold">{fund.name}</h3>
                          {fund.description && (
                            <p className="text-sm text-gray-600">{fund.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge className={fundTypeColors[fund.type] || "bg-gray-100"}>
                        {fund.type}
                      </Badge>
                      <div className="text-right">
                        <div className="font-bold">£{fund.balance.toFixed(2)}</div>
                        {!fund.isActive && (
                          <div className="text-xs text-gray-500">Inactive</div>
                        )}
                      </div>
                      <Eye className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Fund Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Fund</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateFund} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fund Name</label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., General Operating Fund"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fund Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="UNRESTRICTED">Unrestricted</option>
                <option value="RESTRICTED">Restricted</option>
                <option value="ENDOWMENT">Endowment</option>
              </select>
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
                placeholder="Enter fund description..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Fund</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
