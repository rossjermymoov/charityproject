import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function BankDocumentsPage() {
  const session = await requireAuth();

  const bankDocs = await prisma.bankDocument.findMany({
    include: {
      createdBy: true,
      donations: { select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  async function createBankDoc() {
    "use server";
    const session = await requireAuth();

    // Generate sequential reference: BD-YYYYMMDD-NNN
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const prefix = `BD-${dateStr}`;

    const existing = await prisma.bankDocument.count({
      where: { reference: { startsWith: prefix } },
    });

    const ref = `${prefix}-${String(existing + 1).padStart(3, "0")}`;

    const doc = await prisma.bankDocument.create({
      data: {
        reference: ref,
        date: today,
        createdById: session.id,
      },
    });

    revalidatePath("/finance/bank-documents");
    redirect(`/finance/bank-documents/${doc.id}`);
  }

  const statusColors: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-800",
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Documents</h1>
          <p className="text-gray-500 mt-1">Batch donations into numbered bank documents for accounting</p>
        </div>
        <form action={createBankDoc}>
          <Button type="submit" className="gap-2">
            <Plus className="h-4 w-4" />
            New Bank Document
          </Button>
        </form>
      </div>

      {bankDocs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No bank documents"
          description="Create your first bank document to start batching donations."
          actionLabel="New Bank Document"
          actionHref="#"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bankDocs.map((doc) => {
                  const total = doc.donations.reduce((sum, d) => sum + d.amount, 0);
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <Link href={`/finance/bank-documents/${doc.id}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                          {doc.reference}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(doc.date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{doc.donations.length}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">£{total.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <Badge className={statusColors[doc.status] || ""}>{doc.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{doc.createdBy.name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
