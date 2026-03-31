import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Download, Mail, Phone, MapPin, Building2, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revalidatePath } from "next/cache";

export default async function EventSuppliersPage({
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
      startDate: true,
      incomeLines: {
        where: { organisationId: { not: null } },
        orderBy: { sortOrder: "asc" },
        include: {
          organisation: {
            include: {
              contacts: {
                where: { status: "ACTIVE" },
                take: 3,
                orderBy: { createdAt: "asc" },
                select: { id: true, firstName: true, lastName: true, email: true, phone: true },
              },
            },
          },
        },
      },
      costLines: {
        where: { organisationId: { not: null } },
        orderBy: { sortOrder: "asc" },
        include: {
          organisation: {
            include: {
              contacts: {
                where: { status: "ACTIVE" },
                take: 3,
                orderBy: { createdAt: "asc" },
                select: { id: true, firstName: true, lastName: true, email: true, phone: true },
              },
            },
          },
        },
      },
    },
  });

  if (!event) notFound();

  // Deduplicate organisations across income and cost lines
  const orgMap = new Map<string, {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    postcode: string | null;
    contacts: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null }[];
    lines: { type: "income" | "cost"; label: string }[];
  }>();

  for (const line of event.incomeLines) {
    if (!line.organisation) continue;
    const existing = orgMap.get(line.organisation.id);
    const lineInfo = { type: "income" as const, label: line.label };
    if (existing) {
      existing.lines.push(lineInfo);
    } else {
      orgMap.set(line.organisation.id, {
        ...line.organisation,
        lines: [lineInfo],
      });
    }
  }

  for (const line of event.costLines) {
    if (!line.organisation) continue;
    const existing = orgMap.get(line.organisation.id);
    const lineInfo = { type: "cost" as const, label: line.label };
    if (existing) {
      existing.lines.push(lineInfo);
    } else {
      orgMap.set(line.organisation.id, {
        ...line.organisation,
        lines: [lineInfo],
      });
    }
  }

  const suppliers = Array.from(orgMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  async function emailSupplierList(formData: FormData) {
    "use server";
    const sess = await getSession();
    if (!sess) redirect("/login");

    const emailTo = formData.get("emailTo") as string;
    const eventId = formData.get("eventId") as string;

    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/events/${eventId}/supplier-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailTo }),
    });

    if (!res.ok) {
      console.error("Failed to send supplier PDF", await res.text());
    }

    revalidatePath(`/events/${eventId}/finance/suppliers`);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/events" className="hover:text-gray-700">Events</Link>
          <span>/</span>
          <Link href={`/events/${id}`} className="hover:text-gray-700">{event.name}</Link>
          <span>/</span>
          <Link href={`/events/${id}/finance`} className="hover:text-gray-700">P&amp;L</Link>
          <span>/</span>
          <span>Suppliers</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/events/${id}/finance`} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Event Suppliers</h1>
            <p className="text-gray-500 mt-1">{event.name} — {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Email PDF */}
      <Card>
        <CardContent className="pt-6">
          <form action={emailSupplierList} className="flex items-end gap-3">
            <input type="hidden" name="eventId" value={id} />
            <div className="flex-1">
              <Input
                label="Email supplier contact sheet to"
                name="emailTo"
                type="email"
                required
                placeholder="you@example.com"
                defaultValue={session.email || ""}
              />
            </div>
            <Button type="submit" className="gap-1 mb-[1px]">
              <Mail className="h-4 w-4" /> Send PDF
            </Button>
            <a href={`/api/events/${id}/supplier-pdf`} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="outline" className="gap-1 mb-[1px]">
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </a>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Generates a PDF with all supplier contact details for this event. Email it or download directly.
          </p>
        </CardContent>
      </Card>

      {/* Supplier List */}
      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No suppliers assigned yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Assign supplier organisations to income or cost lines in the{" "}
              <Link href={`/events/${id}/finance`} className="text-indigo-600 hover:text-indigo-700">P&amp;L</Link>{" "}
              to see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suppliers.map((supplier) => (
            <Card key={supplier.id}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900">{supplier.name}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-sm text-gray-600">
                      {supplier.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <a href={`tel:${supplier.phone}`} className="hover:text-gray-900">{supplier.phone}</a>
                        </span>
                      )}
                      {supplier.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <a href={`mailto:${supplier.email}`} className="hover:text-gray-900">{supplier.email}</a>
                        </span>
                      )}
                      {supplier.website && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5 text-gray-400" />
                          <a href={supplier.website} target="_blank" rel="noopener" className="hover:text-gray-900">{supplier.website}</a>
                        </span>
                      )}
                      {supplier.addressLine1 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {[supplier.addressLine1, supplier.city, supplier.postcode].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>

                    {/* Key contacts at this organisation */}
                    {supplier.contacts.length > 0 && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium text-gray-600">Contacts: </span>
                        {supplier.contacts.map((c, i) => (
                          <span key={c.id}>
                            {i > 0 && ", "}
                            <Link href={`/crm/contacts/${c.id}`} className="text-indigo-600 hover:text-indigo-700">
                              {c.firstName} {c.lastName}
                            </Link>
                            {c.phone && <span className="text-gray-400"> ({c.phone})</span>}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {supplier.lines.map((l, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            l.type === "income"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {l.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
