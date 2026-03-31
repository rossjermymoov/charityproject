import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Trash2, FileText, ExternalLink, PoundSterling, Users, Heart } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { PLDashboard } from "./finance/pl-dashboard";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      campaign: true,
      ledgerCode: true,
      _count: { select: { attendees: true } },
      incomeLines: { orderBy: { sortOrder: "asc" } },
      costLines: { orderBy: { sortOrder: "asc" } },
      finance: true,
      donations: {
        include: { contact: true },
        orderBy: { date: "desc" },
      },
      registrationForm: {
        include: { _count: { select: { orders: true } } },
      },
      createdBy: true,
      fundraisingPages: {
        include: { contact: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { totalRaised: "desc" },
      },
    },
  });

  if (!event) notFound();

  // P&L calculations
  const totalIncome = event.incomeLines.reduce((s, l) => s + l.actual, 0);
  const totalCosts = event.costLines.reduce((s, l) => s + l.actual, 0);
  const estimatedCosts = event.costLines.reduce((s, l) => s + l.estimated, 0);
  const profit = totalIncome - totalCosts;
  const finance = event.finance;
  const isCompleted = event.status === "COMPLETED" && !!finance?.completedAt;
  const totalDonations = event.donations.reduce((sum, d) => sum + d.amount, 0);

  const statusColors: Record<string, string> = {
    PLANNED: "bg-gray-100 text-gray-800",
    OPEN: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  async function updateStatus(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const newStatus = formData.get("newStatus") as string;

    await prisma.event.update({
      where: { id },
      data: { status: newStatus },
    });
    await logAudit({ userId: session.id, action: "UPDATE", entityType: "Event", entityId: id, details: { status: newStatus } });

    revalidatePath(`/events/${id}`);
  }

  async function deleteEvent() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.event.delete({
      where: { id },
    });
    await logAudit({ userId: session.id, action: "DELETE", entityType: "Event", entityId: id });

    redirect("/events");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/events" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/events/${id}/attendees`}>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Attendees ({event._count.attendees})
            </Button>
          </Link>
          <Link href={`/events/${id}/finance`}>
            <Button variant="outline" size="sm">
              <PoundSterling className="h-4 w-4 mr-2" />
              P&amp;L
            </Button>
          </Link>
          <Link href={`/events/${id}/registration`}>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Registration Form
            </Button>
          </Link>
          {event.registrationForm && (
            <Link href={`/register/${event.registrationForm.id}`} target="_blank">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Public Form ({event.registrationForm._count.orders} orders)
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Event Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{event.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{event.description}</p>
              </div>
              <Badge className={statusColors[event.status]}>
                {event.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase">Type</p>
                <p className="text-sm font-medium text-gray-900">{event.type || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Start Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(event.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Location</p>
                <p className="text-sm font-medium text-gray-900">
                  {event.location || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Attendees</p>
                <p className="text-sm font-medium text-gray-900">
                  {event.capacity ? `${event._count.attendees}/${event.capacity}` : event._count.attendees}
                </p>
              </div>
              {event.campaign && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Campaign</p>
                  <Link href={`/campaigns/${event.campaign.id}`}>
                    <p className="text-sm font-medium text-blue-600 hover:underline">
                      {event.campaign.name}
                    </p>
                  </Link>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <form action={updateStatus} className="flex items-center gap-2">
                <select
                  name="newStatus"
                  defaultValue={event.status}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="PLANNED">Planned</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <Button type="submit" size="sm">Update</Button>
              </form>

              <form action={deleteEvent}>
                <Button variant="destructive" type="submit" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Event
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* P&L Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Profit &amp; Loss</h3>
            <Link href={`/events/${id}/finance`}>
              <Button variant="outline" size="sm" className="gap-1">
                <PoundSterling className="h-4 w-4" /> View Full P&amp;L
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <PLDashboard
            totalIncome={totalIncome}
            totalCosts={totalCosts}
            profit={profit}
            incomeTarget={finance?.incomeTarget || 0}
            costTarget={finance?.costTarget || 0}
            profitTarget={finance?.profitTarget || 0}
            estimatedCosts={estimatedCosts}
            finalTakings={finance?.finalTakings ?? null}
            isCompleted={isCompleted}
          />
        </CardContent>
      </Card>

      {/* Fundraising Pages linked to this event */}
      {event.fundraisingPages.length > 0 && (
        <Card className="border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Fundraising Pages</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {event.fundraisingPages.map((fp: { id: string; pageUrl: string; pageSlug: string; title: string | null; totalRaised: number; giftAidTotal: number; platform: string; contact: { id: string; firstName: string; lastName: string } }) => (
                <div key={fp.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/crm/contacts/${fp.contact.id}`}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                      >
                        {fp.contact.firstName} {fp.contact.lastName}
                      </Link>
                      <Badge className="bg-purple-100 text-purple-800 text-xs">{fp.platform}</Badge>
                    </div>
                    <a
                      href={fp.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:underline"
                    >
                      {fp.title || fp.pageSlug}
                    </a>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-700">£{fp.totalRaised.toFixed(2)}</p>
                    {fp.giftAidTotal > 0 && (
                      <p className="text-xs text-amber-700">+£{fp.giftAidTotal.toFixed(2)} gift aid</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Fundraising pages are managed from each fundraiser&apos;s contact record.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Donations */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Donations</h3>
        </CardHeader>
        <CardContent>
          {event.donations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No donations linked to this event</p>
          ) : (
            <div className="space-y-2">
              {event.donations.map((donation) => (
                <Link key={donation.id} href={`/finance/donations/${donation.id}`}>
                  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {donation.contact.firstName} {donation.contact.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(donation.date)} • {donation.type}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      £{donation.amount.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  Total: £{totalDonations.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
