import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewDpiaPage() {
  async function createDpia(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const dpia = await prisma.dpia.create({
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        projectOrSystem: formData.get("projectOrSystem") as string,
        dataController: formData.get("dataController") as string,
        dpoName: (formData.get("dpoName") as string) || null,
        dpoEmail: (formData.get("dpoEmail") as string) || null,
        csoName: (formData.get("csoName") as string) || null,
        legalBasis: (formData.get("legalBasis") as string) || null,
        dataSubjects: (formData.get("dataSubjects") as string) || null,
        dataCategories: (formData.get("dataCategories") as string) || null,
        specialCategories: formData.get("specialCategories") === "on",
        dataMinimisation: (formData.get("dataMinimisation") as string) || null,
        retentionPeriod: (formData.get("retentionPeriod") as string) || null,
        securityMeasures: (formData.get("securityMeasures") as string) || null,
        internationalTransfers: formData.get("internationalTransfers") === "on",
        transferSafeguards:
          (formData.get("transferSafeguards") as string) || null,
        consultationRequired: formData.get("consultationRequired") === "on",
        reviewDate: formData.get("reviewDate")
          ? new Date(formData.get("reviewDate") as string)
          : null,
        createdById: session.id,
      },
    });

    redirect(`/dashboard/compliance/dpias/${dpia.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/compliance/dpias" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Create Data Protection Impact Assessment
        </h1>
      </div>

      <form action={createDpia} className="space-y-6">
        {/* Section 1 - Overview */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              1. Assessment Overview
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Title" name="title" required />
            <Textarea
              label="Description"
              name="description"
              placeholder="Describe the processing activity and context..."
              required
            />
            <Input
              label="Project/System Name"
              name="projectOrSystem"
              placeholder="e.g., CharityOS CRM, Volunteer Portal"
              required
            />
            <Input
              label="Data Controller (Organisation)"
              name="dataController"
              required
            />
          </CardContent>
        </Card>

        {/* Section 2 - DPO & CSO */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              2. Oversight & Sign-off
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="DPO Name" name="dpoName" />
              <Input label="DPO Email" name="dpoEmail" type="email" />
            </div>
            <Input label="Clinical Safety Officer Name" name="csoName" />
          </CardContent>
        </Card>

        {/* Section 3 - Data Processing */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              3. Data Processing Details
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Legal Basis for Processing"
              name="legalBasis"
              options={[
                { value: "CONSENT", label: "Consent" },
                { value: "PUBLIC_TASK", label: "Public Task" },
                {
                  value: "LEGITIMATE_INTEREST",
                  label: "Legitimate Interest",
                },
                { value: "LEGAL_OBLIGATION", label: "Legal Obligation" },
                { value: "VITAL_INTEREST", label: "Vital Interest" },
                { value: "CONTRACT", label: "Contract" },
              ]}
            />
            <Textarea
              label="Data Subjects"
              name="dataSubjects"
              placeholder="e.g., Patients, Donors, Volunteers, Staff"
            />
            <Textarea
              label="Data Categories"
              name="dataCategories"
              placeholder="e.g., Contact details, Health data, Financial data"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="specialCategories"
                className="rounded border-gray-300"
              />
              Processing special category data (health, ethnicity, etc.)
            </label>
            <Textarea
              label="Data Minimisation"
              name="dataMinimisation"
              placeholder="How is data minimisation achieved? Only collect necessary data..."
            />
          </CardContent>
        </Card>

        {/* Section 4 - Security & Retention */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              4. Security & Data Retention
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Retention Period"
              name="retentionPeriod"
              placeholder="e.g., 3 years, 5 years, indefinite"
            />
            <Textarea
              label="Security Measures"
              name="securityMeasures"
              placeholder="e.g., Encryption, Access controls, Regular backups, Two-factor authentication"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="internationalTransfers"
                className="rounded border-gray-300"
              />
              Data transfers outside the UK/EU
            </label>
            <Textarea
              label="Transfer Safeguards"
              name="transferSafeguards"
              placeholder="If international transfers: standard contractual clauses, adequacy decisions, etc."
            />
          </CardContent>
        </Card>

        {/* Section 5 - Review */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              5. Review Schedule
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Next Review Date"
              name="reviewDate"
              type="date"
              placeholder="When should this DPIA be reviewed next?"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="consultationRequired"
                className="rounded border-gray-300"
              />
              ICO consultation required
            </label>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/compliance/dpias">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit">Create DPIA</Button>
        </div>
      </form>
    </div>
  );
}
