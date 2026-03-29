import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  Users,
  UserCheck,
  Radio,
  PoundSterling,
  Heart,
  Calendar,
  Clock,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  DonationsChart,
  DonationTypePie,
  VolunteerHoursChart,
} from "@/components/ui/dashboard-charts";

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function getLast12Months(): { start: Date; months: string[] } {
  const now = new Date();
  const months: string[] = [];
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push(getMonthLabel(d));
  }
  return { start, months };
}

export default async function DashboardPage() {
  const session = await getSession();
  const { start: twelveMonthsAgo, months } = getLast12Months();

  const [
    contactCount,
    volunteerCount,
    activeVolunteers,
    openBroadcasts,
    // Donations
    totalDonationsThisYear,
    donationsLast12Months,
    donationsByType,
    // Gift Aid
    activeGiftAidDeclarations,
    giftAidableUnclaimed,
    // Volunteer Hours
    volunteerHoursLast12Months,
    totalHoursThisYear,
    // Collection Tins
    deployedTins,
    totalTins,
    tinCollectionsThisYear,
    // Events
    upcomingEvents,
    // Campaigns
    activeCampaigns,
    // Recent activity
    recentDonations,
    recentBroadcasts,
    upcomingAssignments,
  ] = await Promise.all([
    // Contacts & Volunteers
    prisma.contact.count(),
    prisma.volunteerProfile.count(),
    prisma.volunteerProfile.count({ where: { status: "ACTIVE" } }),
    prisma.broadcast.count({ where: { status: "OPEN" } }),
    // Donations this year
    prisma.donation.aggregate({
      _sum: { amount: true },
      _count: true,
      where: {
        date: { gte: new Date(new Date().getFullYear(), 0, 1) },
        status: { in: ["RECEIVED", "PENDING"] },
      },
    }),
    // Monthly donations last 12 months
    prisma.donation.findMany({
      where: {
        date: { gte: twelveMonthsAgo },
        status: { in: ["RECEIVED", "PENDING"] },
      },
      select: { amount: true, date: true, isGiftAidable: true },
    }),
    // Donations by type
    prisma.donation.groupBy({
      by: ["type"],
      _sum: { amount: true },
      where: { status: { in: ["RECEIVED", "PENDING"] } },
    }),
    // Gift Aid
    prisma.giftAid.count({ where: { status: "ACTIVE" } }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: {
        isGiftAidable: true,
        giftAidClaimed: false,
        status: "RECEIVED",
      },
    }),
    // Volunteer Hours last 12 months
    prisma.volunteerHoursLog.findMany({
      where: {
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { hours: true, createdAt: true },
    }),
    // Total hours this year
    prisma.volunteerHoursLog.aggregate({
      _sum: { hours: true },
      where: {
        createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
      },
    }),
    // Tins
    prisma.collectionTin.count({ where: { status: "DEPLOYED" } }),
    prisma.collectionTin.count(),
    prisma.collectionTinMovement.aggregate({
      _sum: { amount: true },
      _count: true,
      where: {
        type: "COUNTED",
        amount: { not: null },
        date: { gte: new Date(new Date().getFullYear(), 0, 1) },
      },
    }),
    // Upcoming events
    prisma.event.findMany({
      where: {
        startDate: { gte: new Date() },
        status: { in: ["PLANNED", "OPEN"] },
      },
      orderBy: { startDate: "asc" },
      take: 5,
      include: { _count: { select: { attendees: true } } },
    }),
    // Active campaigns
    prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Recent donations
    prisma.donation.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: { contact: true },
    }),
    // Recent Broadcasts
    prisma.broadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { department: true, responses: true },
    }),
    // Upcoming Assignments
    prisma.assignment.findMany({
      where: { status: { in: ["SCHEDULED", "CONFIRMED"] } },
      orderBy: { date: "asc" },
      take: 5,
      include: {
        volunteer: { include: { contact: true } },
        department: true,
      },
    }),
  ]);

  // Process monthly donations into chart data
  const monthlyMap: Record<string, { total: number; giftAid: number; count: number }> = {};
  months.forEach((m) => (monthlyMap[m] = { total: 0, giftAid: 0, count: 0 }));
  donationsLast12Months.forEach((d) => {
    const label = getMonthLabel(new Date(d.date));
    if (monthlyMap[label]) {
      monthlyMap[label].total += d.amount;
      if (d.isGiftAidable) monthlyMap[label].giftAid += d.amount * 0.25;
      monthlyMap[label].count += 1;
    }
  });
  const monthlyDonationData = months.map((m) => ({
    month: m,
    total: Math.round(monthlyMap[m].total * 100) / 100,
    giftAid: Math.round(monthlyMap[m].giftAid * 100) / 100,
    count: monthlyMap[m].count,
  }));

  // Process donation type breakdown
  const typeLabels: Record<string, string> = {
    DONATION: "Donations",
    PAYMENT: "Payments",
    GIFT: "Gifts",
    EVENT_FEE: "Event Fees",
    SPONSORSHIP: "Sponsorship",
    LEGACY: "Legacy",
    GRANT: "Grants",
    IN_KIND: "In Kind",
  };
  const donationTypeData = donationsByType.map((d) => ({
    name: typeLabels[d.type] || d.type,
    value: d._sum.amount || 0,
  }));

  // Process volunteer hours into chart data
  const hoursMap: Record<string, number> = {};
  months.forEach((m) => (hoursMap[m] = 0));
  volunteerHoursLast12Months.forEach((h) => {
    const label = getMonthLabel(new Date(h.createdAt));
    if (hoursMap[label] !== undefined) {
      hoursMap[label] += h.hours;
    }
  });
  const monthlyHoursData = months.map((m) => ({
    month: m,
    hours: Math.round(hoursMap[m] * 10) / 10,
  }));

  // Computed values
  const totalDonationsAmount = totalDonationsThisYear._sum.amount || 0;
  const totalDonationsCount = totalDonationsThisYear._count || 0;
  const unclaimedGiftAid = (giftAidableUnclaimed._sum.amount || 0) * 0.25;
  const totalVolunteerHours = totalHoursThisYear._sum.hours || 0;
  const tinCollections = tinCollectionsThisYear._sum.amount || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {session?.name}</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Donations This Year"
          value={`£${totalDonationsAmount.toFixed(2)}`}
          icon={PoundSterling}
          trend={`${totalDonationsCount} donations`}
          trendUp={true}
        />
        <StatCard
          title="Gift Aid Claimable"
          value={`£${unclaimedGiftAid.toFixed(2)}`}
          icon={Heart}
          trend={`${activeGiftAidDeclarations} active declarations`}
          trendUp={true}
        />
        <StatCard
          title="Volunteer Hours"
          value={`${totalVolunteerHours.toFixed(0)} hrs`}
          icon={Clock}
          trend={`${activeVolunteers} active volunteers`}
          trendUp={true}
        />
        <StatCard
          title="Tin Collections"
          value={`£${tinCollections.toFixed(2)}`}
          icon={Package}
          trend={`${deployedTins} of ${totalTins} deployed`}
          trendUp={true}
        />
      </div>

      {/* Second Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Contacts" value={contactCount} icon={Users} />
        <StatCard title="Volunteers" value={volunteerCount} icon={UserCheck} />
        <StatCard title="Open Broadcasts" value={openBroadcasts} icon={Radio} />
        <StatCard
          title="Upcoming Events"
          value={upcomingEvents.length}
          icon={Calendar}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Donations Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Monthly Donations & Gift Aid
              </h2>
              <Link
                href="/finance/donations"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <DonationsChart data={monthlyDonationData} />
          </CardContent>
        </Card>

        {/* Donation Type Breakdown */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Income Breakdown
            </h2>
          </CardHeader>
          <CardContent>
            <DonationTypePie data={donationTypeData} />
          </CardContent>
        </Card>
      </div>

      {/* Volunteer Hours Chart + Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Volunteer Hours
              </h2>
              <Link
                href="/volunteers/hours"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <VolunteerHoursChart data={monthlyHoursData} />
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Active Campaigns
              </h2>
              <Link
                href="/campaigns"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeCampaigns.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">
                No active campaigns
              </p>
            ) : (
              <div className="space-y-3">
                {activeCampaigns.map((campaign) => {
                  const progress =
                    campaign.budgetTarget && campaign.budgetTarget > 0
                      ? Math.min(
                          (campaign.actualRaised / campaign.budgetTarget) * 100,
                          100
                        )
                      : 0;
                  return (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.id}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {campaign.name}
                        </p>
                        {campaign.budgetTarget ? (
                          <span className="text-xs text-gray-500">
                            £{campaign.actualRaised.toFixed(0)} / £
                            {campaign.budgetTarget.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            £{campaign.actualRaised.toFixed(0)}
                          </span>
                        )}
                      </div>
                      {campaign.budgetTarget && campaign.budgetTarget > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Events, Donations, Broadcasts, Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Upcoming Events
              </h2>
              <Link
                href="/events"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No upcoming events
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {event.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(event.startDate)}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {event._count.attendees} attendees
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Donations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Donations
              </h2>
              <Link
                href="/finance/donations"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No donations yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <Link
                        href={`/crm/contacts/${donation.contactId}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {donation.contact.firstName}{" "}
                        {donation.contact.lastName}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {formatDate(donation.date)} ·{" "}
                        {donation.type.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        £{donation.amount.toFixed(2)}
                      </p>
                      {donation.isGiftAidable && (
                        <span className="text-xs text-amber-600">
                          +Gift Aid
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Broadcasts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Broadcasts
              </h2>
              <Link
                href="/broadcasts"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentBroadcasts.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No broadcasts yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentBroadcasts.map((broadcast) => (
                  <Link
                    key={broadcast.id}
                    href={`/broadcasts/${broadcast.id}`}
                    className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {broadcast.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {broadcast.department?.name} ·{" "}
                        {broadcast.responses.length} responses
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(broadcast.urgency)}>
                        {broadcast.urgency}
                      </Badge>
                      <Badge className={getStatusColor(broadcast.status)}>
                        {broadcast.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Upcoming Assignments
              </h2>
              <Link
                href="/assignments"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No upcoming assignments
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {assignment.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {assignment.volunteer.contact.firstName}{" "}
                        {assignment.volunteer.contact.lastName} ·{" "}
                        {assignment.department.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {assignment.date}
                      </p>
                      <p className="text-xs text-gray-500">
                        {assignment.startTime} - {assignment.endTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
