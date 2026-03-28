import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewContactPage() {
  const organisations = await prisma.organisation.findMany({
    orderBy: { name: "asc" },
  });

  async function createContact(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const contact = await prisma.contact.create({
      data: {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        email: (formData.get("email") as string) || null,
        phone: (formData.get("phone") as string) || null,
        type: formData.get("type") as string,
        dateOfBirth: (formData.get("dateOfBirth") as string) || null,
        addressLine1: (formData.get("addressLine1") as string) || null,
        city: (formData.get("city") as string) || null,
        postcode: (formData.get("postcode") as string) || null,
        country: (formData.get("country") as string) || null,
        organisationId: (formData.get("organisationId") as string) || null,
        consentPost: formData.get("consentPost") === "on",
        consentEmail: formData.get("consentEmail") === "on",
        consentPhone: formData.get("consentPhone") === "on",
        consentSms: formData.get("consentSms") === "on",
        consentUpdatedAt: new Date(),
        createdById: session.id,
      },
    });

    redirect(`/crm/contacts/${contact.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/crm/contacts" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Contact</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createContact} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" name="firstName" required />
              <Input label="Last Name" name="lastName" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" name="email" type="email" />
              <Input label="Phone" name="phone" type="tel" />
            </div>
            <Select
              label="Type"
              name="type"
              options={[
                { value: "DONOR", label: "Donor" },
                { value: "SUPPORTER", label: "Supporter" },
                { value: "BENEFICIARY", label: "Beneficiary" },
                { value: "VOLUNTEER", label: "Volunteer" },
                { value: "OTHER", label: "Other" },
              ]}
            />
            <Input label="Date of Birth" name="dateOfBirth" type="date" />
            <Select
              label="Organisation"
              name="organisationId"
              placeholder="Select organisation (optional)"
              options={organisations.map((org) => ({ value: org.id, label: org.name }))}
            />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Address</h3>
              <Input label="Address Line 1" name="addressLine1" />
              <div className="grid grid-cols-3 gap-4">
                <Input label="City" name="city" />
                <Input label="Postcode" name="postcode" />
                <Input label="Country" name="country" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Communication Consent</h3>
              <p className="text-xs text-gray-500">Record the contact&apos;s communication preferences (GDPR)</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" name="consentPost" className="rounded border-gray-300" />
                  Post
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" name="consentEmail" className="rounded border-gray-300" />
                  Email
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" name="consentPhone" className="rounded border-gray-300" />
                  Phone
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" name="consentSms" className="rounded border-gray-300" />
                  SMS
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Link href="/crm/contacts">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit">Create Contact</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
