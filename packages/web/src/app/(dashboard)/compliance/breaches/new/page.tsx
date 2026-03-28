import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewBreachPage() {
  async function createBreach(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const breach = await prisma.dataBreach.create({
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        discoveredAt: new Date(formData.get("discoveredAt") as string),
        severity: formData.get("severity") as string,
        category: (formData.get("category") as string) || null,
        cause: (formData.get("cause") as string) || null,
        dataSubjectsAffected: formData.get("dataSubjectsAffected")
          ? parseInt(formData.get("dataSubjectsAffected") as string)
          : null,
        dataTypesAffected: (formData.get("dataTypesAffected") as string) || null,
        containmentActions: (formData.get("containmentActions") as string) || null,
        status: "OPEN",
        createdById: session.id,
      },
    });

    redirect(`/dashboard/compliance/breaches/${breach.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/compliance/breaches" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Report Data Breach</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createBreach} className="space-y-6">
            {/* Incident Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Incident Details</h3>
              <Input label="Title" name="title" required />
              <Textarea label="Description" name="description" required />
              <Input label="Discovered At" name="discoveredAt" type="datetime-local" required />
              <Select
                label="Severity"
                name="severity"
                required
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "CRITICAL", label: "Critical" },
                ]}
              />
              <Select
                label="Category"
                name="category"
                options={[
                  { value: "CONFIDENTIALITY", label: "Confidentiality" },
                  { value: "INTEGRITY", label: "Integrity" },
                  { value: "AVAILABILITY", label: "Availability" },
                ]}
              />
              <Input label="Cause" name="cause" placeholder="e.g., Phishing, Misconfiguration, Insider threat" />
            </div>

            {/* Impact */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Impact</h3>
              <Input
                label="Data Subjects Affected"
                name="dataSubjectsAffected"
                type="number"
                placeholder="Approximate number"
              />
              <Textarea
                label="Data Types Affected"
                name="dataTypesAffected"
                placeholder="e.g., Contact details, Health data, Financial information"
              />
            </div>

            {/* Response */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Response</h3>
              <Textarea
                label="Containment Actions"
                name="containmentActions"
                placeholder="What actions have been taken to contain the breach?"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Link href="/dashboard/compliance/breaches">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">Report Breach</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
