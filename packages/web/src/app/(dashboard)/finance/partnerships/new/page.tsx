"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Organisation {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function NewPartnershipPage() {
  const router = useRouter();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    organisationId: "",
    contactId: "",
    type: "PARTNER",
    status: "PROSPECT",
    startDate: "",
    endDate: "",
    annualValue: "",
    totalValue: "",
    renewalDate: "",
    notes: "",
    benefits: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orgsRes, contactsRes] = await Promise.all([
          fetch("/api/crm/organisations"),
          fetch("/api/contacts"),
        ]);

        if (orgsRes.ok) {
          const data = await orgsRes.json();
          setOrganisations(Array.isArray(data) ? data : []);
        }

        if (contactsRes.ok) {
          const data = await contactsRes.json();
          setContacts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.organisationId) {
      alert("Please select an organisation");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/partnerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationId: formData.organisationId,
          contactId: formData.contactId || null,
          type: formData.type,
          status: formData.status,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          annualValue: formData.annualValue || null,
          totalValue: formData.totalValue || null,
          renewalDate: formData.renewalDate || null,
          notes: formData.notes || null,
          benefits: formData.benefits ? formData.benefits.split(",").map((b) => b.trim()) : [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create partnership");
      }

      const partnership = await response.json();
      router.push(`/finance/partnerships/${partnership.id}`);
    } catch (error) {
      console.error("Error creating partnership:", error);
      alert("Failed to create partnership");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/partnerships">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Partnership</h1>
          <p className="text-gray-600">Create a new corporate partnership record</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partnership Details</CardTitle>
          <CardDescription>Enter the basic information for the partnership</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Organisation *</label>
                <Select
                  options={[
                    { value: "", label: "Select organisation..." },
                    ...organisations.map((org) => ({
                      value: org.id,
                      label: org.name,
                    })),
                  ]}
                  value={formData.organisationId}
                  onChange={(e) => setFormData({ ...formData, organisationId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Partnership Type *</label>
                <Select
                  options={[
                    { value: "PARTNER", label: "Partner" },
                    { value: "SPONSOR", label: "Sponsor" },
                    { value: "PATRON", label: "Patron" },
                    { value: "CORPORATE_DONOR", label: "Corporate Donor" },
                  ]}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status *</label>
                <Select
                  options={[
                    { value: "PROSPECT", label: "Prospect" },
                    { value: "ACTIVE", label: "Active" },
                    { value: "LAPSED", label: "Lapsed" },
                    { value: "ENDED", label: "Ended" },
                  ]}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Key Contact</label>
                <Select
                  options={[
                    { value: "", label: "Select contact..." },
                    ...contacts.map((contact) => ({
                      value: contact.id,
                      label: `${contact.firstName} ${contact.lastName}`,
                    })),
                  ]}
                  value={formData.contactId}
                  onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <Input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <Input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Annual Value (£)</label>
                <Input
                  type="number"
                  name="annualValue"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.annualValue}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Total Value (£)</label>
                <Input
                  type="number"
                  name="totalValue"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.totalValue}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Renewal Date</label>
                <Input
                  type="date"
                  name="renewalDate"
                  value={formData.renewalDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Benefits (comma-separated)</label>
              <Input
                name="benefits"
                placeholder="e.g., Brand visibility, Employee volunteering, Sponsorship rights"
                value={formData.benefits}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                name="notes"
                placeholder="Additional notes about this partnership..."
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={4}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Partnership"}
              </Button>
              <Link href="/finance/partnerships">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
