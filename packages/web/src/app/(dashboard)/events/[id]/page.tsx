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
import { formatDate } from "@/lib/utils";
import { revalidatePath } from "next/cache";

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
      attendees: {
        include: { contact: true },
        orderBy: { createdAt: "desc" },
      },
      merchandise: { orderBy: { createdAt: "desc" } },
      donations: {
        include: { contact: true },
        orderBy: { date: "desc" },
      },
      createdBy: true,
    },
  });

  if (!event) notFound();

  const contacts = await prisma.contact.findMany({
    where: { isArchived: false },
    orderBy: { lastName: "asc" },
  });

  const statusColors: Record<string, string> = {
    PLANNED: "bg-gray-100 text-gray-800",
    OPEN: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const attendeeStatusColors: Record<string, string> = {
    REGISTERED: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    ATTENDED: "bg-green-100 text-green-800",
    NO_SHOW: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  async function addAttendee(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const contactId = formData.get("contactId") as string;

    await prisma.eventAttendee.create({
      data: {
        eventId: id,
        contactId,
        status: (formData.get("status") as string) || "REGISTERED",
        ticketType: (formData.get("ticketType") as string) || null,
      },
    });

    revalidatePath(`/events/${id}`);
  }

  async function removeAttendee(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const attendeeId = formData.get("attendeeId") as string;

    await prisma.eventAttendee.delete({
      where: { id: attendeeId },
    });

    revalidatePath(`/events/${id}`);
  }

  async function addMerchandise(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.eventMerchandise.create({
      data: {
        eventId: id,
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || null,
        quantity: formData.get("quantity") ? parseInt(formData.get("quantity") as string) : 0,
        unitPrice: formData.get("unitPrice") ? parseFloat(formData.get("unitPrice") as string) : null,
      },
    });

    revalidatePath(`/events/${id}`);
  }

  async function removeMerchandise(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const merchandiseId = formData.get("merchandiseId") as string;

    await prisma.eventMerchandise.delete({
      where: { id: merchandiseId },
    });

    revalidatePath(`/events/${id}`);
  }

  async function updateStatus(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const newStatus = formData.get("newStatus") as string;

    await prisma.event.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath(`/events/${id}`);
  }

  async function deleteEvent() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.event.delete({
      where: { id },
    });

    redirect("/events");
  }

  const totalMerchandiseRevenue = event.merchandise.reduce((sum, item) => {
    return sum + (item.quantitySold * (item.unitPrice || 0));
  }, 0);

  const totalDonations = event.donations.reduce((sum, donation) => sum + donation.amount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/events" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
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
                <p className="text-xs text-gray-500 uppercase">Capacity</p>
                <p className="text-sm font-medium text-gray-900">
                  {event.capacity ? `${event.attendees.length}/${event.capacity}` : event.attendees.length}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendees */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Attendees</h3>
          </CardHeader>
          <CardContent>
            <form action={addAttendee} className="space-y-3 mb-6 pb-6 border-b border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <SearchableSelect
                  name="contactId"
                  placeholder="Search contacts..."
                  options={contacts.map((contact) => ({
                    value: contact.id,
                    label: `${contact.firstName} ${contact.lastName}`,
                  }))}
                  required
                />
              </div>
              <Input
                label="Ticket Type"
                name="ticketType"
                placeholder="e.g., VIP, Standard"
              />
              <select
                name="status"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full"
              >
                <option value="REGISTERED">Registered</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ATTENDED">Attended</option>
                <option value="NO_SHOW">No Show</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <Button type="submit" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Attendee
              </Button>
            </form>

            {event.attendees.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No attendees yet</p>
            ) : (
              <div className="space-y-2">
                {event.attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {attendee.contact.firstName} {attendee.contact.lastName}
                      </p>
                      {attendee.ticketType && (
                        <p className="text-xs text-gray-500">{attendee.ticketType}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={attendeeStatusColors[attendee.status]}>
                        {attendee.status}
                      </Badge>
                      <form action={removeAttendee}>
                        <input type="hidden" name="attendeeId" value={attendee.id} />
                        <button
                          type="submit"
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Merchandise */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Merchandise</h3>
          </CardHeader>
          <CardContent>
            <form action={addMerchandise} className="space-y-3 mb-6 pb-6 border-b border-gray-100">
              <Input label="Item Name" name="name" required />
              <Input
                label="Quantity"
                name="quantity"
                type="number"
              />
              <Input
                label="Unit Price (£)"
                name="unitPrice"
                type="number"
                step="0.01"
                placeholder="Optional"
              />
              <Button type="submit" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </form>

            {event.merchandise.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No merchandise</p>
            ) : (
              <div className="space-y-2">
                {event.merchandise.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantitySold} sold of {item.quantity}
                        {item.unitPrice && ` • £${(item.quantitySold * item.unitPrice).toFixed(2)}`}
                      </p>
                    </div>
                    <form action={removeMerchandise}>
                      <input type="hidden" name="merchandiseId" value={item.id} />
                      <button
                        type="submit"
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    Total Revenue: £{totalMerchandiseRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
