"use client";

import { useState } from "react";

interface DeclarationFormProps {
  token: string;
  contactName: string;
  isRetail?: boolean;
}

export function DeclarationForm({ token, contactName, isRetail = false }: DeclarationFormProps) {
  const [fullName, setFullName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed || !fullName.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/declare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName: fullName.trim(),
          confirm: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit declaration");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Thank You!
        </h2>
        <p className="text-gray-600">
          {isRetail
            ? "Your Retail Gift Aid declaration has been recorded. The charity can now claim Gift Aid on the proceeds from the sale of your donated goods."
            : "Your Gift Aid declaration has been recorded. This means the charity can claim an extra 25p for every £1 you donate."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className={`mt-1 rounded border-gray-300 ${isRetail ? "text-purple-600 focus:ring-purple-500" : "text-indigo-600 focus:ring-indigo-500"}`}
          />
          <span className="text-sm text-gray-700">
            {isRetail
              ? "I confirm that I am a UK taxpayer, I own the goods I am donating, I am not acting as a business, and I authorise the charity to act as my agent in selling my donated goods. I would like the charity to treat the proceeds from the sale of all goods I donate as Gift Aid donations, until I notify them otherwise."
              : "I confirm that I am a UK taxpayer and I would like the charity to treat all donations I have made in the past 4 years and all donations I make from the date of this declaration as Gift Aid donations, until I notify them otherwise."}
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Full Name (as digital signature)
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={contactName}
          required
          className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 ${isRetail ? "focus:ring-purple-500" : "focus:ring-indigo-500"} focus:border-transparent`}
        />
        <p className="text-xs text-gray-500 mt-1">
          By typing your name above, you are providing a legally binding
          electronic signature.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!confirmed || !fullName.trim() || submitting}
        className={`w-full ${isRetail ? "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500" : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"} text-white rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors`}
      >
        {submitting ? "Submitting..." : `Sign ${isRetail ? "Retail " : ""}Gift Aid Declaration`}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Date: {new Date().toLocaleDateString("en-GB")}
      </p>
    </form>
  );
}
