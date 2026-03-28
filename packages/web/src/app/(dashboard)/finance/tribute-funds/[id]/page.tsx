import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

export default async function TributeFundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fund = await prisma.tributeFund.findUnique({
    where: { id },
    include: {
      guardians: { include: { contact: true } },
      milestones: { orderBy: { date: "desc" } },
      createdBy: true,
    },
  });

  if (!fund) notFound();

  async function toggleStatus(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const currentFund = await prisma.tributeFund.findUnique({ where: { id } });
    const newStatus = currentFund?.status === "ACTIVE" ? "CLOSED" : "ACTIVE";

    await prisma.tributeFund.update({
      where: { id },
      data: { status: newStatus },
    });

    redirect(`/finance/tribute-funds/${id}`);
  }

  async function addGuardian(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const contactId = formData.get("contactId") as string;
    const isPrimary = formData.get("isPrimary") === "on";

    // If marking as primary, unmark other primaries
    if (isPrimary) {
      await prisma.tributeFundGuardian.updateMany({
        where: { tributeFundId: id },
        data: { isPrimary: false },
      });
    }

    await prisma.tributeFundGuardian.create({
      data: {
        tributeFundId: id,
        contactId,
        isPrimary,
      },
    });

    redirect(`/finance/tribute-funds/${id}`);
  }

  async function removeGuardian(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const guardianId = formData.get("guardianId") as string;

    await prisma.tributeFundGuardian.delete({
      where: { id: guardianId },
    });

    redirect(`/finance/tribute-funds/${id}`);
  }

  async function addMilestone(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.tributeFundMilestone.create({
      data: {
        tributeFundId: id,
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || null,
        date: new Date(formData.get("date") as string),
      },
    });

    redirect(`/finance/tribute-funds/${id}`);
  }

  async function deleteFund() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.tributeFund.delete({
      where: { id },
    });

    redirect("/finance/tribute-funds");
  }

  const typeColors: Record<string, string> = {
    TRADITIONAL: "bg-blue-100 text-blue-800",
    ROBIN: "bg-pink-100 text-pink-800",
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
  };

  // Get contacts for guardian selection (excluding existing guardians)
  const allContacts = await prisma.contact.findMany({
    where: {
      id: {
        notIn: fund.guardians.map((g) => g.contactId),
      },
    },
    orderBy: { firstName: "asc" },
    take: 100,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/tribute-funds" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Fund Details</h1>
      </div>

      {/* Fund Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Fund Name</p>
              <p className="text-2xl font-bold text-gray-900">{fund.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
              <Badge className={statusColors[fund.status]}>{fund.status}</Badge>
            </div>
            {fund.inMemoryOf && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">In Memory Of</p>
                <p className="text-gray-900">{fund.inMemoryOf}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Fund Type</p>
              <Badge className={typeColors[fund.type]}>{fund.type}</Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Raised</p>
              <p className="text-2xl font-bold text-green-600">£{fund.totalRaised.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Created</p>
              <p className="text-gray-900">{formatDate(fund.createdAt)}</p>
            </div>
          </div>
          {fund.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Description</p>
              <p className="text-gray-700 whitespace-pre-wrap">{fund.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Toggle */}
      <form action={toggleStatus} className="flex justify-end">
        <Button variant={fund.status === "ACTIVE" ? "destructive" : "outline"} type="submit">
          {fund.status === "ACTIVE" ? "Close Fund" : "Reopen Fund"}
        </Button>
      </form>

      {/* Guardians Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Guardians</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* List of Guardians */}
          {fund.guardians.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No guardians yet</p>
          ) : (
            <div className="space-y-2">
              {fund.guardians.map((guardian) => (
                <div key={guardian.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {guardian.contact.firstName} {guardian.contact.lastName}
                    </p>
                    {guardian.contact.email && (
                      <p className="text-xs text-gray-500">{guardian.contact.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {guardian.isPrimary && (
                      <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                    )}
                    <form action={removeGuardian}>
                      <input type="hidden" name="guardianId" value={guardian.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Guardian */}
          {allContacts.length > 0 && (
            <form action={addGuardian} className="border-t border-gray-100 pt-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Add Guardian</h4>
              <select
                name="contactId"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Select a contact...</option>
                {allContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isPrimary"
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Mark as Primary Guardian</span>
              </label>
              <Button type="submit" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Guardian
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Milestones Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Milestones</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* List of Milestones */}
          {fund.milestones.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No milestones yet</p>
          ) : (
            <div className="space-y-3">
              {fund.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{milestone.title}</p>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">{formatDate(milestone.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Milestone */}
          <form action={addMilestone} className="border-t border-gray-100 pt-4 space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Add Milestone</h4>
            <Input
              label="Title"
              name="title"
              placeholder="e.g., Reached £1000"
              required
            />
            <Textarea
              label="Description"
              name="description"
              placeholder="Optional details about this milestone"
            />
            <Input
              label="Date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Fund */}
      <div className="flex justify-end">
        <form action={deleteFund}>
          <Button type="submit" variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Fund
          </Button>
        </form>
      </div>
    </div>
  );
}
