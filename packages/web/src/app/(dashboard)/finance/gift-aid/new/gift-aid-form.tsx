"use client";

import { useState } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, UserPlus } from "lucide-react";

interface ContactOption {
  value: string;
  label: string;
}

interface GiftAidFormProps {
  contacts: ContactOption[];
  action: string; // form action URL — we'll use native form action
}

export function GiftAidForm({ contacts: initialContacts, action }: GiftAidFormProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [showNewContact, setShowNewContact] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");

  // Quick-create contact fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [postcode, setPostcode] = useState("");

  async function handleCreateContact() {
    if (!firstName.trim() || !lastName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() || undefined, addressLine1: addressLine1.trim() || undefined, postcode: postcode.trim() || undefined }),
      });

      if (!res.ok) throw new Error("Failed to create contact");

      const newContact = await res.json();
      const newOption = {
        value: newContact.id,
        label: `${newContact.firstName} ${newContact.lastName}`,
      };

      // Add to list and select it
      setContacts((prev) =>
        [...prev, newOption].sort((a, b) => a.label.localeCompare(b.label))
      );
      setSelectedContactId(newContact.id);

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setAddressLine1("");
      setPostcode("");
      setShowNewContact(false);
    } catch {
      alert("Failed to create contact. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Contact selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
        <SearchableSelect
          name="contactId"
          required
          placeholder="Search contacts..."
          defaultValue={selectedContactId}
          options={contacts}
          onCreateNew={() => setShowNewContact(true)}
          createNewLabel="Create New Contact"
        />
      </div>

      {/* Inline new contact form */}
      {showNewContact && (
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <UserPlus className="h-4 w-4" />
                <span className="text-sm font-semibold">Quick Add Contact</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNewContact(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Last name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Email (optional)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Address (optional)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Postcode</label>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Postcode (optional)"
                />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={handleCreateContact}
                disabled={creating || !firstName.trim() || !lastName.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
                {creating ? "Creating..." : "Add & Select"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rest of the gift aid form fields */}
      <Select
        label="Declaration Type"
        name="type"
        required
        defaultValue="STANDARD"
        options={[
          { value: "STANDARD", label: "Standard Gift Aid" },
          { value: "RETAIL", label: "Retail Gift Aid" },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input label="Declaration Date" name="declarationDate" type="date" required />
        <Input label="Start Date" name="startDate" type="date" required />
      </div>

      <Input
        label="End Date (optional - leave blank for ongoing)"
        name="endDate"
        type="date"
        placeholder="Leave blank if ongoing"
      />

      <div className="border-t pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isBackdated"
            onChange={(e) => {
              const form = e.currentTarget.form;
              const backdateField = form?.querySelector('input[name="backdateFrom"]');
              if (backdateField) {
                backdateField.parentElement!.style.display = e.currentTarget.checked ? "block" : "none";
              }
            }}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Can this be backdated?</span>
        </label>
      </div>

      <div style={{ display: "none" }}>
        <Input
          label="Backdate From"
          name="backdateFrom"
          type="date"
          placeholder="Select the earliest date for this declaration"
        />
      </div>

      <Input label="Notes" name="notes" placeholder="Additional notes..." />
    </div>
  );
}
