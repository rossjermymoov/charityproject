"use client";

import { useState } from "react";

interface ContactDetails {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
}

export function UpdateDetailsForm({
  token,
  contactName,
  currentDetails,
}: {
  token: string;
  contactName: string;
  currentDetails: ContactDetails;
}) {
  const [details, setDetails] = useState<ContactDetails>(currentDetails);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(field: keyof ContactDetails, value: string) {
    setDetails((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!details.firstName.trim() || !details.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/retail-gift-aid/update-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...details }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-4xl mb-3">&#10003;</div>
        <h3 className="text-lg font-semibold text-green-900">Details Updated</h3>
        <p className="text-green-700 mt-2">
          Thank you, {contactName}. Your details have been updated successfully.
          Your Gift Aid declaration will continue with your new information.
        </p>
      </div>
    );
  }

  const fields: { key: keyof ContactDetails; label: string; required?: boolean }[] = [
    { key: "firstName", label: "First name", required: true },
    { key: "lastName", label: "Last name", required: true },
    { key: "addressLine1", label: "Address line 1" },
    { key: "addressLine2", label: "Address line 2" },
    { key: "city", label: "City / Town" },
    { key: "postcode", label: "Postcode" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={details[field.key]}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={field.required}
          />
        </div>
      ))}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Saving..." : "Confirm My Details"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        If your details are already correct, you don&apos;t need to make any changes.
      </p>
    </form>
  );
}
