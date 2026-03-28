import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { BarChart3, Users, Gift, Clock, Target, Radio } from "lucide-react";

export default async function ReportsPage() {
  await requireAuth();

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
    donationsByType,
    donationsByCampaign,
    hoursByDepartment,
  ] = await Promise.all([
    // Total contacts
    prisma.contact.count({
      where: { isArchived: false },
    }),

    // Total donations this month
    prisma.donation.aggregate({
      where: {
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: { amount: true },
    }),

    // Total volunteer hours this month
    prisma.volunteerHoursLog.aggregate({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: { hours: true },
    }),

    // Active volunteers
    prisma.volunteerProfile.count({
      where: { status: { not: "ARCHIVED" } },
    }),

    // Active campaigns
    prisma.campaign.count({
      where: { status: { not: "CANCELLED" } },
    }),

    // Open broadcasts
    prisma.broadcast.count({
      where: { status: "OPEN" },
    }),

    // Donations by type
    prisma.donation.groupBy({
      by: ["type"],
      _count: true,
      _sum: { amount: true },
      where: {
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    }),

    // Donations by campaign
    prisma.donation.groupBy({
      by: ["campaignId"],
      _count: true,
      _sum: { amount: true },
      where: {
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        campaignId: { not: null },
      },
    }),

    // Hours by department
    prisma.volunteerHoursLog.groupBy({
      by: ["departmentId"],
      _count: true,
      _sum: { hours: true },
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
        departmentId: { not: null },
      },
    }),
  ]);

  // Enrich donations by campaign with campaign names
  const enrichedCampaigns = await Promise.all(
    donationsByCampaign.map(async (item) => {
      const campaign = await prisma.campaign.findUnique({
        where: { id: item.campaignId || "" },
        select: { name: true },
      });
      return {
        ...item,
        campaignName: campaign?.name || "Unknown",
      };
    })
  );

  // Enrich hours by department with department names
  const enrichedDepartments = await Promise.all(
    hoursByDepartment.map(async (item) => {
      const dept = await prisma.department.findUnique({
        where: { id: item.departmentId || "" },
        select: { name: true },
      });
      return {
        ...item,
        departmentName: dept?.name || "Unknown",
      };
    })
  );

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of your organization's key metrics
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-6">
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
            </Card>
          );
        })}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donations by Type */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Donations by Type
          </h2>
          {donationsByType.length === 0 ? (
            <p className="text-sm text-gray-500">No donations this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                      Count
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {donationsByType.map((row) => (
                    <tr key={row.type}>
                      <td className="py-2 text-gray-900 font-medium">
                        {row.type}
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {row._count}
                      </td>
                      <td className="py-2 text-right text-gray-900 font-medium">
                        £{(row._sum.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Donations by Campaign */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Donations by Campaign
          </h2>
          {enrichedCampaigns.length === 0 ? (
            <p className="text-sm text-gray-500">No campaign donations this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                      Campaign
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                      Count
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {enrichedCampaigns.map((row) => (
                    <tr key={row.campaignId}>
                      <td className="py-2 text-gray-900 font-medium truncate">
                        {row.campaignName}
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {row._count}
                      </td>
                      <td className="py-2 text-right text-gray-900 font-medium">
                        £{(row._sum.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Volunteer Hours by Department */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Volunteer Hours by Department
        </h2>
        {enrichedDepartments.length === 0 ? (
          <p className="text-sm text-gray-500">No hours logged this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                    Total Hours
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">
                    Volunteer Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {enrichedDepartments.map((row) => (
                  <tr key={row.departmentId}>
                    <td className="py-2 text-gray-900 font-medium">
                      {row.departmentName}
                    </td>
                    <td className="py-2 text-right text-gray-900 font-medium">
                      {(row._sum.hours || 0).toFixed(1)} hrs
                    </td>
                    <td className="py-2 text-right text-gray-500">
                      {row._count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
