"use client";

import { useState } from "react";

interface RetailGiftAidFormProps {
  shopToken: string;
  shopName: string;
}

type Step = "email" | "existing" | "new" | "confirm" | "success";

interface ContactMatch {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  hasRetailGiftAid: boolean;
}

export function RetailGiftAidForm({ shopToken, shopName }: RetailGiftAidFormProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [matchedContact, setMatchedContact] = useState<ContactMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // New contact fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");

  // Confirmation
  const [agreed, setAgreed] = useState(false);
  const [signedName, setSignedName] = useState("");

  async function handleEmailLookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/retail-gift-aid/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (data.found) {
        setMatchedContact(data.contact);
        if (data.contact.hasRetailGiftAid) {
          // Already has retail gift aid
          setStep("success");
          setError("");
        } else {
          setStep("existing");
        }
      } else {
        setStep("new");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/retail-gift-aid/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopToken,
          email: email.trim().toLowerCase(),
          contactId: matchedContact?.id || null,
          firstName: matchedContact ? matchedContact.firstName : firstName.trim(),
          lastName: matchedContact ? matchedContact.lastName : lastName.trim(),
          addressLine1: matchedContact ? undefined : addressLine1.trim() || undefined,
          city: matchedContact ? undefined : city.trim() || undefined,
          postcode: matchedContact ? undefined : postcode.trim() || undefined,
          signedName: signedName.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("success");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    const alreadyHad = matchedContact?.hasRetailGiftAid;
    return (
      <div className="text-center py-6">
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
        {alreadyHad ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Already Registered
            </h2>
            <p className="text-gray-600">
              You already have an active Retail Gift Aid declaration on file.
              Thank you for your continued support!
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Thank You!
            </h2>
            <p className="text-gray-600">
              Your Retail Gift Aid declaration has been recorded. The charity can
              now claim Gift Aid on the proceeds from the sale of any goods you
              donate.
            </p>
          </>
        )}
        <p className="text-sm text-gray-500 mt-4">
          You can close this page now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Email lookup */}
      {step === "email" && (
        <form onSubmit={handleEmailLookup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll check if you're already in our system to avoid duplicates.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Looking up..." : "Continue"}
          </button>
        </form>
      )}

      {/* Step 2a: Existing contact found */}
      {step === "existing" && matchedContact && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-900 mb-1">
              Welcome back!
            </p>
            <p className="text-sm text-purple-800">
              We found your details: <strong>{matchedContact.firstName} {matchedContact.lastName}</strong>
            </p>
          </div>
          <p className="text-sm text-gray-600">
            Please confirm your Retail Gift Aid declaration by signing below.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type your full name to sign
            </label>
            <input
              type="text"
              required
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              placeholder={`${matchedContact.firstName} ${matchedContact.lastName}`}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">
              I confirm I am a UK taxpayer and I want to Gift Aid the proceeds
              from the sale of any goods I donate to this charity. I authorise the
              charity to act as my agent in selling my donated goods.
            </span>
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => { setStep("email"); setMatchedContact(null); setAgreed(false); setSignedName(""); }}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !agreed || !signedName.trim()}
              className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Submitting..." : "Sign Declaration"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2b: New contact — collect details */}
      {step === "new" && (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              We don't have your details on file yet. Please fill in the form below.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last name
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="123 High Street"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postcode
              </label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="SW1A 1AA"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          <hr className="border-gray-200" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type your full name to sign
            </label>
            <input
              type="text"
              required
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              placeholder="Your full name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">
              I confirm I am a UK taxpayer and I want to Gift Aid the proceeds
              from the sale of any goods I donate to this charity. I authorise the
              charity to act as my agent in selling my donated goods.
            </span>
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => { setStep("email"); setAgreed(false); setSignedName(""); }}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !agreed || !signedName.trim() || !firstName.trim() || !lastName.trim()}
              className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Submitting..." : "Sign Declaration"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
