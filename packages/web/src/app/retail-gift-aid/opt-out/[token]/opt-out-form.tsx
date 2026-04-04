"use client";

import { useState } from "react";

const OPT_OUT_REASONS = [
  { value: "INSUFFICIENT_TAX", label: "I have not paid enough tax to cover the Gift Aid" },
  { value: "NO_LONGER_WISH", label: "I no longer wish to Gift Aid donated goods" },
  { value: "OTHER", label: "Other reason" },
];

export function OptOutForm({
  token,
  contactName,
}: {
  token: string;
  contactName: string;
}) {
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason for opting out.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/retail-gift-aid/opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          reason: reason === "OTHER" ? otherReason || "Other" : OPT_OUT_REASONS.find((r) => r.value === reason)?.label || reason,
        }),
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
        <h3 className="text-lg font-semibold text-green-900">Opt-Out Confirmed</h3>
        <p className="text-green-700 mt-2">
          Thank you, {contactName}. Your opt-out has been recorded and you will
          be excluded from this Gift Aid claim. The charity has been notified.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Why are you opting out?
        </label>
        <div className="space-y-2">
          {OPT_OUT_REASONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                reason === opt.value
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={opt.value}
                checked={reason === opt.value}
                onChange={(e) => setReason(e.target.value)}
                className="text-amber-600"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {reason === "OTHER" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Please explain
          </label>
          <textarea
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Tell us why you're opting out..."
          />
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting..." : "Confirm Opt-Out"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        If you do not opt out, the charity will include your Gift Aid eligible
        donations in their HMRC claim.
      </p>
    </form>
  );
}
