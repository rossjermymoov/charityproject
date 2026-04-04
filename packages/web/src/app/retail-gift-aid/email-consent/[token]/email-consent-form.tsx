"use client";

import { useState } from "react";

export function EmailConsentForm({
  token,
  contactName,
  contactEmail,
}: {
  token: string;
  contactName: string;
  contactEmail: string;
}) {
  const [email, setEmail] = useState(contactEmail);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/retail-gift-aid/email-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
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
        <div className="text-green-600 text-4xl mb-3">✓</div>
        <h3 className="text-lg font-semibold text-green-900">
          Email Consent Confirmed
        </h3>
        <p className="text-green-700 mt-2">
          Thank you, {contactName}! Future Gift Aid notifications will be sent
          to <strong>{email}</strong>. This helps save printing and postage costs.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          required
        />
        {contactEmail && (
          <p className="text-xs text-gray-500 mt-1">
            We have this email on file. Update it if needed.
          </p>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Saving..." : "Yes, switch to email"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        You can change your mind at any time by contacting the charity.
      </p>
    </form>
  );
}
