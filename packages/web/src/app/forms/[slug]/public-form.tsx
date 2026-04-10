"use client";

import { useState } from "react";

interface FormConfig {
  id: string;
  title: string;
  description: string | null;
  primaryColor: string;
  thankYouMessage: string;
  type: string;
  consentRequired: boolean;
  consentText: string | null;
  giftAidEnabled: boolean;
  recurringEnabled: boolean;
  allowCustomAmount: boolean;
  suggestedAmounts: number[];
}

interface FieldConfig {
  id: string;
  label: string;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  options: string | null;
  fieldKey: string | null;
}

export function PublicForm({
  form,
  fields,
}: {
  form: FormConfig;
  fields: FieldConfig[];
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [giftAid, setGiftAid] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const donationAmount = selectedAmount || parseFloat(customAmount) || 0;

  function updateValue(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Build data object with field keys
      const data: Record<string, string> = {};
      for (const field of fields) {
        const key = field.fieldKey || field.id;
        data[key] = values[field.id] || "";
      }

      const body: Record<string, unknown> = {
        formId: form.id,
        data,
        giftAidDeclared: giftAid,
        isRecurring,
      };

      if (form.type === "DONATION") {
        body.amount = donationAmount;
        if (!donationAmount || donationAmount <= 0) {
          setError("Please select or enter a donation amount.");
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: form.primaryColor + "20" }}
        >
          <svg className="w-8 h-8" style={{ color: form.primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
        <p className="text-gray-600">{form.thankYouMessage}</p>
        {form.type === "DONATION" && donationAmount > 0 && (
          <p className="mt-3 text-lg font-semibold" style={{ color: form.primaryColor }}>
            Your donation of £{donationAmount.toFixed(2)} has been received.
            {giftAid && (
              <span className="block text-sm font-normal text-gray-500 mt-1">
                With Gift Aid, your donation is worth £{(donationAmount * 1.25).toFixed(2)} to us!
              </span>
            )}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6" style={{ backgroundColor: form.primaryColor }}>
        <h1 className="text-2xl font-bold text-white">{form.title}</h1>
        {form.description && (
          <p className="text-white/80 mt-1">{form.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {/* Donation Amount Selector */}
        {form.type === "DONATION" && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              Choose your donation amount
            </label>
            {form.suggestedAmounts.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.suggestedAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                    className={`py-3 px-4 rounded-xl text-lg font-bold border-2 transition-all ${
                      selectedAmount === amount
                        ? "text-white shadow-md"
                        : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white"
                    }`}
                    style={
                      selectedAmount === amount
                        ? { backgroundColor: form.primaryColor, borderColor: form.primaryColor }
                        : {}
                    }
                  >
                    £{amount}
                  </button>
                ))}
              </div>
            )}
            {form.allowCustomAmount && (
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    £
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Other amount"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-200 text-lg focus:border-indigo-500 focus:ring-0"
                  />
                </div>
              </div>
            )}

            {/* Recurring toggle */}
            {form.recurringEnabled && (
              <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-indigo-600 w-5 h-5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Make this a monthly donation</span>
                  <span className="block text-xs text-gray-500">
                    Your card will be charged each month. Cancel anytime.
                  </span>
                </div>
              </label>
            )}
          </div>
        )}

        {/* Dynamic Fields */}
        {fields
          .filter((f) => f.type !== "AMOUNT")
          .map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {field.helpText && (
                <p className="text-xs text-gray-500 mb-1">{field.helpText}</p>
              )}
              {field.type === "TEXTAREA" ? (
                <textarea
                  value={values[field.id] || ""}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  required={field.isRequired}
                  placeholder={field.placeholder || ""}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              ) : field.type === "SELECT" ? (
                <select
                  value={values[field.id] || ""}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  required={field.isRequired}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select...</option>
                  {field.options &&
                    JSON.parse(field.options).map((opt: string) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                </select>
              ) : field.type === "CHECKBOX" ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={values[field.id] === "true"}
                    onChange={(e) => updateValue(field.id, e.target.checked ? "true" : "false")}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{field.placeholder || field.label}</span>
                </label>
              ) : (
                <input
                  type={
                    field.type === "EMAIL"
                      ? "email"
                      : field.type === "PHONE"
                      ? "tel"
                      : field.type === "NUMBER"
                      ? "number"
                      : field.type === "DATE"
                      ? "date"
                      : "text"
                  }
                  value={values[field.id] || ""}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  required={field.isRequired}
                  placeholder={field.placeholder || ""}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              )}
            </div>
          ))}

        {/* Gift Aid */}
        {form.giftAidEnabled && form.type === "DONATION" && donationAmount > 0 && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={giftAid}
                onChange={(e) => setGiftAid(e.target.checked)}
                className="mt-1 rounded border-green-300 text-green-600 w-5 h-5"
              />
              <div>
                <span className="text-sm font-semibold text-green-900">
                  Boost your donation by 25% with Gift Aid
                </span>
                {giftAid && (
                  <span className="block text-sm font-bold text-green-700 mt-1">
                    £{donationAmount.toFixed(2)} + £{(donationAmount * 0.25).toFixed(2)} Gift Aid
                    = £{(donationAmount * 1.25).toFixed(2)}
                  </span>
                )}
                <span className="block text-xs text-green-700 mt-1">
                  I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital
                  Gains Tax than the amount of Gift Aid claimed on all my donations in that tax
                  year it is my responsibility to pay any difference.
                </span>
              </div>
            </label>
          </div>
        )}

        {/* GDPR Consent */}
        {form.consentRequired && form.consentText && (
          <label className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              className="mt-1 rounded border-gray-300 text-indigo-600 w-5 h-5"
            />
            <span className="text-sm text-gray-700">{form.consentText}</span>
          </label>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-6 rounded-xl text-white font-semibold text-lg shadow-md transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: form.primaryColor }}
        >
          {submitting
            ? "Submitting..."
            : form.type === "DONATION"
            ? donationAmount > 0
              ? `Donate £${donationAmount.toFixed(2)}${isRecurring ? "/month" : ""}`
              : "Donate"
            : "Submit"}
        </button>

        <p className="text-xs text-center text-gray-400">
          Powered by Parity CRM
        </p>
      </form>
    </div>
  );
}
