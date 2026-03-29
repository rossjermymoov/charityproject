import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Plus, Search, Heart, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; lottery?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const typeFilter = params.type || "";
  const lotteryFilter = params.lottery || "";

  const contacts = await prisma.contact.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        typeFilter ? { types: { has: typeFilter } } : {},
        lotteryFilter === "yes" ? { isLotteryMember: true } : {},
      ],
    },
    include: {
      organisation: true,
      tags: { include: { tag: true } },
      volunteerProfile: true,
      giftAids: {
        where: { status: "ACTIVE" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const typeColors: Record<string, string> = {
    DONOR: "bg-green-100 text-green-800",
    VOLUNTEER: "bg-indigo-100 text-indigo-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 mt-1">Manage your contacts, donors, and volunteers</p>
        </div>
        <Link href="/crm/contacts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </Link>
      </div>

      {/* Search and filters */}
      <Card className="p-4">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              name="search"
              type="text"
              defaultValue={search}
              placeholder="Search by name or email..."
              className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <select
            name="type"
            defaultValue={typeFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="VOLUNTEER">Volunteer</option>
            <option value="DONOR">Donor</option>
          </select>
          <select
            name="lottery"
            defaultValue={lotteryFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Lottery</option>
            <option value="yes">Lottery Members</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      {/* Contact list */}
      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description="Get started by adding your first contact to the CRM."
          actionLabel="Add Contact"
          actionHref="/crm/contacts/new"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Types
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gift Aid
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lottery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/crm/contacts/${contact.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar firstName={contact.firstName} lastName={contact.lastName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </p>
                          {contact.phone && (
                            <p className="text-xs text-gray-500">{contact.phone}</p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{contact.email || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {contact.types.length > 0 ? (
                          contact.types.map((t) => (
                            <Badge key={t} className={typeColors[t] || "bg-gray-100 text-gray-800"}>
                              {t}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {contact.giftAids.length > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          {contact.giftAids.some((ga) => ga.type === "STANDARD" || ga.type !== "RETAIL") && (
                            <span className="inline-flex items-center justify-center rounded-full bg-pink-100 w-6 h-6 text-xs font-bold text-pink-800" title="Standard Gift Aid">
                              S
                            </span>
                          )}
                          {contact.giftAids.some((ga) => ga.type === "RETAIL") && (
                            <span className="inline-flex items-center justify-center rounded-full bg-purple-100 w-6 h-6 text-xs font-bold text-purple-800" title="Retail Gift Aid">
                              R
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {contact.isLotteryMember ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800" title="Lottery member">
                          <Ticket className="h-3 w-3 text-amber-600" />
                          LM
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {contact.organisation?.name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {contact.tags.map((ct) => (
                          <Badge key={ct.tagId} variant="outline" className="text-xs">
                            {ct.tag.name}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
