import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Gift,
  Clock,
  Target,
  Radio,
  Plus,
  ArrowRight,
} from "lucide-react";
import { SavedReportsList } from "@/components/reports/saved-reports-list";

export default async function ReportsPage() {
  const session = await requireAuth();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Fetch all aggregated data in parallel
  const [
    totalContacts,
    monthlyDonations,
    monthlyHours,
    activeVolunteers,
    activeCampaigns,
    openBroadcasts,
  ] = await Promise.all([
    prisma.contact.count({
      where: { isArchived: false },
    }),
    prisma.donation.aggregate({
      where: {
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: { amount: true },
    }),
    prisma.volunteerHoursLog.aggregate({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: { hours: true },
    }),
    prisma.volunteerProfile.count({
      where: { status: { not: "ARCHIVED" } },
    }),
    prisma.campaign.count({
      where: { status: { not: "CANCELLED" } },
    }),
    prisma.broadcast.count({
      where: { status: "OPEN" },
    }),
  ]);

  const statCards = [
    {
      icon: Users,
      label: "Total Contacts",
      value: totalContacts.toLocaleString(),
    },
    {
      icon: Gift,
      label: "Donations (This Month)",
      value: `£${(monthlyDonations._sum.amount || 0).toFixed(2)}`,
    },
    {
      icon: Clock,
      label: "Volunteer Hours (This Month)",
      value: (monthlyHours._sum.hours || 0).toFixed(1),
    },
    {
      icon: Users,
      label: "Active Volunteers",
      value: activeVolunteers.toLocaleString(),
    },
    {
      icon: Target,
      label: "Active Campaigns",
      value: activeCampaigns.toLocaleString(),
    },
    {
      icon: Radio,
      label: "Open Broadcasts",
      value: openBroadcasts.toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-gray-500 mt-2">
            Dashboard overview and custom report builder
          </p>
        </div>
        <Link href="/reports/builder">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {card.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {card.value}
                    </p>
                  </div>
                  <Icon className="h-8 w-8 text-indigo-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/reports/builder">
              <Button variant="outline" className="w-full justify-between">
                <span>Build Custom Report</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/reports/builder?entity=DONATIONS">
              <Button variant="outline" className="w-full justify-between">
                <span>Analyze Donations</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Saved Reports */}
      <SavedReportsList userId={session.id} />
    </div>
  );
}
