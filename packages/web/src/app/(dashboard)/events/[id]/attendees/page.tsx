import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { revalidatePath } from "next/cache";
import { formatDate } from "@/lib/utils";

export default async function EventAttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      capacity: true,
      attendees: {
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              organisation: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) notFound();

  const contacts = await prisma.contact.findMany({
    where: { isArchived: false },
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true },
  });

  const statusColors: Record<string, string> = {
    REGISTERED: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    ATTENDED: "bg-green-100 text-green-800",
    NO_SHOW: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  async function addAttendee(formData: FormData) {
    "use server";
    const sess = await getSession();
    if (!sess) redirect("/login");

    const contactId = formData.get("contactId") as string;

    await prisma.eventAttendee.create({
      data: {
        eventId: id,
        contactId,
        status: (formData.get("status") as string) || "REGISTERED",
        ticketType: (formData.get("ticketType") as string) || null,
      },
    });

    revalidatePath(`/events/${id}/attendees`);
  }

  async function removeAttendee(formData: FormData) {
    "use server";
    const sess = await getSession();
    if (!sess) redirect("/login");

    const attendeeId = formData.get("attendeeId") as string;
    await prisma.eventAttendee.delete({ where: { id: attendeeId } });
    revalidatePath(`/events/${id}/attendees`);
  }

  const confirmedCount = event.attendees.filter((a) =>
    ["CONFIRMED", "ATTENDED"].includes(a.status)
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/events" className="hover:text-gray-700">Events</Link>
          <span>/</span>
          <Link href={`/events/${id}`} className="hover:text-gray-700">{event.name}</Link>
          <span>/</span>
          <span>Attendees</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/events/${id}`} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Attendees</h1>
            <p className="text-gray-500 mt-1">
              {event.attendees.length} total · {confirmedCount} confirmed
              {event.capacity ? ` · ${event.capacity} capacity` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Add Attendee */}
      <Card>
        <CardContent className="pt-6">
          <form action={addAttendee} className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
              <SearchableSelect
                name="contactId"
                placeholder="Search contacts..."
                options={contacts.map((c) => ({
                  value: c.id,
                  label: `${c.firstName} ${c.lastName}`,
                }))}
                required
              />
            </div>
            <div className="w-40">
              <Input label="Ticket Type" name="ticketType" placeholder="e.g. VIP" />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="REGISTERED">Registered</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ATTENDED">Attended</option>
                <option value="NO_SHOW">No Show</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <Button type="submit" size="sm" className="gap-1 mb-[1px]">
              <Plus className="h-3 w-3" /> Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Attendee List */}
      <Card>
        <CardContent className="pt-6">
          {event.attendees.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No attendees yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {event.attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/crm/contacts/${attendee.contact.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {attendee.contact.firstName} {attendee.contact.lastName}
                      </Link>
                      <Badge className={statusColors[attendee.status]}>
                        {attendee.status}
                      </Badge>
                      {attendee.ticketType && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {attendee.ticketType}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-0.5 text-xs text-gray-500">
                      {attendee.contact.email && <span>{attendee.contact.email}</span>}
                      {attendee.contact.phone && <span>{attendee.contact.phone}</span>}
                      {attendee.contact.organisation && (
                        <span>{attendee.contact.organisation.name}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {formatDate(attendee.createdAt)}
                  </p>
                  <form action={removeAttendee} className="flex-shrink-0">
                    <input type="hidden" name="attendeeId" value={attendee.id} />
                    <button type="submit" className="text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
