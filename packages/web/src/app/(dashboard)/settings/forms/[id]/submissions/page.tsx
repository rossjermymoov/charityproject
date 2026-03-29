import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Inbox, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  RECEIVED: "bg-blue-100 text-blue-800",
  PROCESSED: "bg-green-100 text-green-800",
  SPAM: "bg-red-100 text-red-800",
  ERROR: "bg-orange-100 text-orange-800",
};

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const form = await prisma.form.findUnique({
    where: { id },
    select: { id: true, name: true, type: true },
  });

  if (!form) notFound();

  const submissions = await prisma.formSubmission.findMany({
    where: { formId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  async function markProcessed(formData: FormData) {
    "use server";
    const submissionId = formData.get("submissionId") as string;
    await prisma.formSubmission.update({
      where: { id: submissionId },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
    revalidatePath(`/settings/forms/${id}/submissions`);
  }

  function parseData(dataStr: string): Record<string, string> {
    try {
      return JSON.parse(dataStr);
    } catch {
      return {};
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/settings/forms/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Form
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-gray-500 mt-1">
            {form.name} &middot; {submissions.length} submissions
          </p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="No submissions yet"
            description="Submissions will appear here once people start filling in your form."
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  {form.type === "DONATION" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.map((sub) => {
                  const data = parseData(sub.data);
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(sub.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {data.firstName || ""} {data.lastName || ""}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {data.email || "-"}
                      </td>
                      {form.type === "DONATION" && (
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {sub.amount ? `£${sub.amount.toFixed(2)}` : "-"}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <Badge className={statusColors[sub.status] || ""}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {sub.status === "RECEIVED" && (
                          <form action={markProcessed} className="inline">
                            <input type="hidden" name="submissionId" value={sub.id} />
                            <Button variant="ghost" size="sm" type="submit">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                              Process
                            </Button>
                          </form>
                        )}
                      </td>
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
