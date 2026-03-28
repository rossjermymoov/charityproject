import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Gift, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function GiftAidPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "";

  const giftAids = await prisma.giftAid.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { contact: { firstName: { contains: search } } },
                { contact: { lastName: { contains: search } } },
              ],
            }
          : {},
        statusFilter ? { status: statusFilter } : {},
      ],
    },
    include: {
      contact: true,
      createdBy: true,
    },
    orderBy: { declarationDate: "desc" },
    take: 50,
  });

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    EXPIRED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gift Aid Declarations</h1>
          <p className="text-gray-500 mt-1">Manage Gift Aid declarations from donors</p>
        </div>
        <Link href="/dashboard/finance/gift-aid/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Declaration
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
              placeholder="Search by contact name..."
              className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      {/* Gift aid list */}
      {giftAids.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No Gift Aid declarations"
          description="Get started by recording your first Gift Aid declaration."
          actionLabel="New Declaration"
          actionHref="/dashboard/finance/gift-aid/new"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Declaration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {giftAids.map((giftAid) => (
                  <tr key={giftAid.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/finance/gift-aid/${giftAid.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {giftAid.contact.firstName} {giftAid.contact.lastName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(giftAid.declarationDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(giftAid.startDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {giftAid.endDate ? formatDate(giftAid.endDate) : "Ongoing"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[giftAid.status]}>{giftAid.status}</Badge>
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
