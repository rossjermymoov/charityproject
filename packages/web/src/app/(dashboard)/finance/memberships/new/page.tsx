"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface MembershipType {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export default function NewMembershipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [typesLoaded, setTypesLoaded] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedType, setSelectedType] = useState<MembershipType | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [error, setError] = useState("");

  // Load contacts on component mount
  if (!contactsLoaded) {
    fetch("/api/contacts")
      .then((res) => res.json())
      .then((data) => {
        setContacts(data);
        setContactsLoaded(true);
      })
      .catch(() => setContactsLoaded(true));
  }

  // Load membership types on component mount
  if (!typesLoaded) {
    fetch("/api/membership-types")
      .then((res) => res.json())
      .then((data) => {
        setMembershipTypes(data);
        setTypesLoaded(true);
      })
      .catch(() => setTypesLoaded(true));
  }

  const filteredContacts = contactSearch
    ? contacts.filter(
        (c) =>
          c.firstName.toLowerCase().includes(contactSearch.toLowerCase()) ||
          c.lastName.toLowerCase().includes(contactSearch.toLowerCase()) ||
          c.email?.toLowerCase().includes(contactSearch.toLowerCase())
      )
    : contacts;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!selectedContact) {
      setError("Please select a contact");
      return;
    }

    if (!selectedType) {
      setError("Please select a membership type");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      contactId: selectedContact.id,
      membershipTypeId: selectedType.id,
      startDate: formData.get("startDate"),
      autoRenew: formData.get("autoRenew") === "on",
    };

    try {
      const response = await fetch("/api/memberships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create membership");
        setLoading(false);
        return;
      }

      const result = await response.json();
      router.push(`/finance/memberships/${result.id}`);
    } catch (err) {
      setError("An error occurred while creating the membership");
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/memberships" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Membership</h1>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Create Membership</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-100">
                {error}
              </div>
            )}

            {/* Contact Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={
                    selectedContact
                      ? `${selectedContact.firstName} ${selectedContact.lastName}`
                      : contactSearch
                  }
                  onChange={(e) => {
                    setContactSearch(e.target.value);
                    setShowContactDropdown(true);
                  }}
                  onFocus={() => setShowContactDropdown(true)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {showContactDropdown && contactSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No contacts found</div>
                    ) : (
                      filteredContacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => {
                            setSelectedContact(contact);
                            setContactSearch("");
                            setShowContactDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </div>
                          {contact.email && (
                            <div className="text-xs text-gray-500">{contact.email}</div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedContact && (
                <div className="mt-2 inline-flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-200">
                  <span className="text-sm text-indigo-700">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContact(null);
                      setContactSearch("");
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-bold"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Membership Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Membership Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedType?.id || ""}
                onChange={(e) => {
                  const type = membershipTypes.find((t) => t.id === e.target.value);
                  setSelectedType(type || null);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a type...</option>
                {membershipTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - £{type.price.toFixed(2)} ({type.duration} months)
                  </option>
                ))}
              </select>

              {selectedType && selectedType.description && (
                <p className="mt-2 text-sm text-gray-600">{selectedType.description}</p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                required
                defaultValue={today}
                min={today}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Auto Renewal */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoRenew"
                name="autoRenew"
                className="rounded border-gray-300"
              />
              <label htmlFor="autoRenew" className="text-sm font-medium text-gray-700">
                Enable automatic renewal
              </label>
            </div>

            {/* Summary */}
            {selectedType && (
              <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-200">
                <h4 className="font-semibold text-indigo-900 mb-2">Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Membership:</span>
                    <span className="font-medium text-indigo-900">{selectedType.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Price:</span>
                    <span className="font-medium text-indigo-900">
                      £{selectedType.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Duration:</span>
                    <span className="font-medium text-indigo-900">{selectedType.duration} months</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading || !selectedContact || !selectedType}>
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Membership"
                )}
              </Button>
              <Link href="/finance/memberships">
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
