import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewSARPage() {
  async function createSAR(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const requestDate = new Date(formData.get("requestDate") as string);
    // Due date is 1 calendar month from request date
    const dueDate = new Date(requestDate);
    dueDate.setMonth(dueDate.getMonth() + 1);

    const sar = await prisma.subjectAccessRequest.create({
      data: {
        requesterName: formData.get("requesterName") as string,
        requesterEmail: (formData.get("requesterEmail") as string) || null,
        requesterPhone: (formData.get("requesterPhone") as string) || null,
        requestDate,
        dueDate,
        description: (formData.get("description") as string) || null,
        status: "RECEIVED",
        createdById: session.id,
      },
    });

    redirect(`/dashboard/compliance/sars/${sar.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/compliance/sars" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Subject Access Request</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createSAR} className="space-y-6">
            {/* Requester Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Requester Details</h3>
              <Input label="Requester Name" name="requesterName" required />
              <Input label="Requester Email" name="requesterEmail" type="email" />
              <Input label="Requester Phone" name="requesterPhone" type="tel" />
            </div>

            {/* Request Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Request Details</h3>
              <Input label="Request Date" name="requestDate" type="date" required />
              <p className="text-xs text-gray-500">
                Note: Due date will be automatically set to 1 calendar month from the request date.
              </p>
              <Textarea
                label="Description"
                name="description"
                placeholder="What data is the requester asking for?"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Link href="/dashboard/compliance/sars">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">Create SAR</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
