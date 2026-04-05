"use client";

import { useState } from "react";
import { Calendar, MapPin, Heart, CheckCircle2, AlertCircle } from "lucide-react";

interface FormItem {
  id: string;
  name: string;
  description: string | null;
  type: string;
  price: number | null;
  isRequired: boolean;
  isGiftAidEligible: boolean;
  maxQuantity: number | null;
  options: string | null;
  imageUrl: string | null;
}

interface FormData {
  id: string;
  title: string;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  headerText: string | null;
  thankYouMessage: string | null;
  requiresPayment: boolean;
  allowDonations: boolean;
  collectPhone: boolean;
  collectAddress: boolean;
  giftAidEnabled: boolean;
  stripeEnabled: boolean;
  goCardlessEnabled: boolean;
  event: {
    id: string;
    name: string;
    description: string | null;
    startDate: string;
    endDate: string | null;
    location: string | null;
  };
  items: FormItem[];
}

interface ItemSelection {
  itemId: string;
  quantity: number;
  variant?: string;
  customAmount?: number;
}

export function RegistrationFormClient({ form }: { form: FormData }) {
  const [step, setStep] = useState<"details" | "items" | "giftaid" | "payment" | "success">("details");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Attendee details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");

  // Items
  const [selections, setSelections] = useState<Record<string, ItemSelection>>(() => {
    const initial: Record<string, ItemSelection> = {};
    form.items
      .filter((item) => item.isRequired)
      .forEach((item) => {
        initial[item.id] = { itemId: item.id, quantity: 1 };
      });
    return initial;
  });

  // Donation
  const [donationAmount, setDonationAmount] = useState("");

  // Gift Aid
  const [giftAidDeclared, setGiftAidDeclared] = useState(false);
  const [existingGiftAid, setExistingGiftAid] = useState<boolean | null>(null);
  const [giftAidChecked, setGiftAidChecked] = useState(false);

  // Order result
  const [orderNumber, setOrderNumber] = useState("");

  // Calculate totals
  const hasGiftAidItems = form.items.some((i) => i.isGiftAidEligible && selections[i.id]);
  const showGiftAidStep = form.giftAidEnabled && hasGiftAidItems;

  function calculateTotal() {
    let subtotal = 0;
    let giftAidTotal = 0;

    for (const item of form.items) {
      const sel = selections[item.id];
      if (!sel || sel.quantity === 0) continue;

      if (item.type === "DONATION") {
        const amt = sel.customAmount || 0;
        subtotal += amt;
        if (item.isGiftAidEligible) giftAidTotal += amt;
      } else {
        const lineTotal = (item.price || 0) * sel.quantity;
        subtotal += lineTotal;
        if (item.isGiftAidEligible) giftAidTotal += lineTotal;
      }
    }

    return { subtotal, giftAidTotal };
  }

  const { subtotal, giftAidTotal } = calculateTotal();

  function toggleItem(item: FormItem) {
    if (item.isRequired) return;
    setSelections((prev) => {
      if (prev[item.id]) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: { itemId: item.id, quantity: 1 } };
    });
  }

  function updateQuantity(itemId: string, qty: number) {
    setSelections((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: Math.max(0, qty) },
    }));
  }

  function updateVariant(itemId: string, variant: string) {
    setSelections((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], variant },
    }));
  }

  function updateDonation(itemId: string, amount: string) {
    setDonationAmount(amount);
    const parsed = parseFloat(amount);
    setSelections((prev) => ({
      ...prev,
      [itemId]: {
        itemId,
        quantity: parsed > 0 ? 1 : 0,
        customAmount: parsed > 0 ? parsed : 0,
      },
    }));
  }

  async function checkGiftAid() {
    if (!email || !firstName || !lastName) return;
    try {
      const res = await fetch(
        `/api/register/check-gift-aid?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`
      );
      const data = await res.json();
      setExistingGiftAid(data.hasGiftAid);
      setGiftAidChecked(true);
      if (data.hasGiftAid) {
        setGiftAidDeclared(true);
      }
    } catch {
      setGiftAidChecked(true);
      setExistingGiftAid(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/register/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: form.id,
          eventId: form.event.id,
          attendee: {
            firstName,
            lastName,
            email,
            phone: phone || null,
            addressLine1: addressLine1 || null,
            city: city || null,
            postcode: postcode || null,
          },
          selections: Object.values(selections).filter((s) => s.quantity > 0),
          giftAidDeclared,
          paymentMethod: subtotal > 0 ? "STRIPE" : "FREE",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setOrderNumber(data.orderNumber);
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const startDate = new Date(form.event.startDate);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: `${form.primaryColor}10` }}
    >
      {/* Header */}
      <div
        className="text-white py-8 px-4"
        style={{ backgroundColor: form.primaryColor }}
      >
        <div className="max-w-2xl mx-auto text-center">
          {form.logoUrl && (
            <img
              src={form.logoUrl}
              alt="Logo"
              className="h-16 mx-auto mb-4 object-contain"
            />
          )}
          <h1 className="text-3xl font-bold">{form.title}</h1>
          {form.headerText && (
            <p className="text-lg mt-2 opacity-90">{form.headerText}</p>
          )}
          <div className="flex items-center justify-center gap-4 mt-4 text-sm opacity-80">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
            </span>
            {form.event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {form.event.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      {step !== "success" && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            {["details", "items", ...(showGiftAidStep ? ["giftaid"] : []), "payment"].map(
              (s, i) => {
                const labels: Record<string, string> = {
                  details: "Your Details",
                  items: "Select Items",
                  giftaid: "Gift Aid",
                  payment: "Confirm",
                };
                const steps = ["details", "items", ...(showGiftAidStep ? ["giftaid"] : []), "payment"];
                const currentIndex = steps.indexOf(step);
                const isActive = s === step;
                const isDone = i < currentIndex;
                return (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isActive
                          ? "text-white"
                          : isDone
                          ? "text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                      style={{
                        backgroundColor: isActive
                          ? form.primaryColor
                          : isDone
                          ? form.accentColor
                          : undefined,
                      }}
                    >
                      {isDone ? "✓" : i + 1}
                    </div>
                    <span
                      className={`hidden sm:inline ${
                        isActive ? "font-medium text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {labels[s]}
                    </span>
                    {i < steps.length - 1 && (
                      <div className="flex-1 h-px bg-gray-300" />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Your Details */}
        {step === "details" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Details
            </h2>
            {form.description && (
              <p className="text-sm text-gray-600">{form.description}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": form.primaryColor } as React.CSSProperties}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:border-transparent"
                required
              />
            </div>
            {form.collectPhone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            )}
            {form.collectAddress && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Address line 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
            <div className="pt-4">
              <button
                onClick={() => {
                  if (!firstName || !lastName || !email) {
                    setError("Please fill in all required fields");
                    return;
                  }
                  setError(null);
                  setStep("items");
                }}
                className="w-full py-3 rounded-lg text-white font-medium text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: form.primaryColor }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Items */}
        {step === "items" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Select Items
            </h2>

            <div className="space-y-3">
              {form.items
                .filter((item) => item.type !== "DONATION")
                .map((item) => {
                  const selected = !!selections[item.id];
                  const sel = selections[item.id];
                  const optionsList = item.options
                    ? item.options.split(",").map((o) => o.trim())
                    : [];

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        selected
                          ? "border-opacity-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{
                        borderColor: selected ? form.primaryColor : undefined,
                        backgroundColor: selected
                          ? `${form.primaryColor}08`
                          : undefined,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleItem(item)}
                            disabled={item.isRequired}
                            className="mt-1 rounded"
                            style={{ accentColor: form.primaryColor }}
                          />
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-16 w-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.name}
                              {item.isRequired && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </p>
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {item.description}
                              </p>
                            )}
                            {item.isGiftAidEligible && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1">
                                <Heart className="h-3 w-3" /> Gift Aid Eligible
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900 flex-shrink-0">
                          £{(item.price || 0).toFixed(2)}
                        </p>
                      </div>

                      {selected && (
                        <div className="mt-3 ml-8 flex flex-wrap gap-3">
                          {item.type === "MERCHANDISE" && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">
                                Qty:
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={item.maxQuantity || 99}
                                value={sel?.quantity || 1}
                                onChange={(e) =>
                                  updateQuantity(
                                    item.id,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                              />
                            </div>
                          )}
                          {optionsList.length > 0 && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">
                                Option:
                              </label>
                              <select
                                value={sel?.variant || ""}
                                onChange={(e) =>
                                  updateVariant(item.id, e.target.value)
                                }
                                className="rounded border border-gray-300 px-2 py-1 text-sm"
                              >
                                <option value="">Select...</option>
                                {optionsList.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Donation option */}
            {form.allowDonations &&
              form.items
                .filter((item) => item.type === "DONATION")
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border-2 border-gray-200"
                    style={{
                      borderColor:
                        parseFloat(donationAmount) > 0
                          ? form.accentColor
                          : undefined,
                      backgroundColor:
                        parseFloat(donationAmount) > 0
                          ? `${form.accentColor}08`
                          : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5" style={{ color: form.accentColor }} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500">
                            {item.description}
                          </p>
                        )}
                        {item.isGiftAidEligible && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1">
                            <Heart className="h-3 w-3" /> Gift Aid Eligible
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-gray-600">
                          £
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={donationAmount}
                          onChange={(e) =>
                            updateDonation(item.id, e.target.value)
                          }
                          placeholder="0.00"
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-lg font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}

            {/* Order Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">Total</p>
                <p className="text-2xl font-bold" style={{ color: form.primaryColor }}>
                  £{subtotal.toFixed(2)}
                </p>
              </div>
              {giftAidTotal > 0 && form.giftAidEnabled && (
                <p className="text-sm text-amber-700 mt-1">
                  £{(giftAidTotal * 0.25).toFixed(2)} extra through Gift Aid
                  (on £{giftAidTotal.toFixed(2)} eligible)
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep("details")}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (showGiftAidStep) {
                    checkGiftAid();
                    setStep("giftaid");
                  } else {
                    setStep("payment");
                  }
                }}
                className="flex-1 py-3 rounded-lg text-white font-medium text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: form.primaryColor }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Gift Aid */}
        {step === "giftaid" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Gift Aid</h2>
            <p className="text-sm text-gray-600">
              Gift Aid lets the charity claim an extra 25p for every £1 you
              donate at no cost to you. You just need to be a UK taxpayer.
            </p>

            {giftAidChecked && existingGiftAid ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Gift Aid declaration found
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    We already have an active Gift Aid declaration on file for{" "}
                    {firstName} {lastName}. Gift Aid will be claimed
                    automatically on eligible items.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {giftAidChecked && !existingGiftAid && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        No Gift Aid declaration found
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        We don't have a Gift Aid declaration on file. You can
                        make one now to boost your contribution by 25%.
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    giftAidDeclared
                      ? "border-opacity-100 bg-opacity-5"
                      : "border-gray-200"
                  }`}
                  style={{
                    borderColor: giftAidDeclared
                      ? form.accentColor
                      : undefined,
                    backgroundColor: giftAidDeclared
                      ? `${form.accentColor}08`
                      : undefined,
                  }}
                  onClick={() => setGiftAidDeclared(!giftAidDeclared)}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={giftAidDeclared}
                      onChange={(e) => setGiftAidDeclared(e.target.checked)}
                      className="mt-1 rounded"
                      style={{ accentColor: form.accentColor }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        Yes, I am a UK taxpayer and I would like the charity to
                        treat all eligible donations I make as Gift Aid
                        donations.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        I understand that if I pay less Income Tax and/or
                        Capital Gains Tax than the amount of Gift Aid claimed on
                        all my donations in that tax year it is my
                        responsibility to pay any difference. I will notify the
                        charity if I want to cancel this declaration, change my
                        name or home address, or no longer pay sufficient tax.
                      </p>
                    </div>
                  </label>
                </div>

                {giftAidDeclared && giftAidTotal > 0 && (
                  <div
                    className="p-3 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: `${form.accentColor}15`,
                      color: form.accentColor,
                    }}
                  >
                    Your Gift Aid declaration will generate an extra £
                    {(giftAidTotal * 0.25).toFixed(2)} for the charity!
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep("items")}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep("payment")}
                className="flex-1 py-3 rounded-lg text-white font-medium text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: form.primaryColor }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Payment / Confirm */}
        {step === "payment" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Confirm & Pay
            </h2>

            {/* Order summary */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Order Summary</p>
              {form.items.map((item) => {
                const sel = selections[item.id];
                if (!sel || sel.quantity === 0) return null;
                const lineTotal =
                  item.type === "DONATION"
                    ? sel.customAmount || 0
                    : (item.price || 0) * sel.quantity;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 text-sm"
                  >
                    <div>
                      <span className="text-gray-900">{item.name}</span>
                      {sel.variant && (
                        <span className="text-gray-500 ml-1">
                          ({sel.variant})
                        </span>
                      )}
                      {sel.quantity > 1 && (
                        <span className="text-gray-500 ml-1">
                          x{sel.quantity}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">£{lineTotal.toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2 text-lg font-bold">
                <span>Total</span>
                <span style={{ color: form.primaryColor }}>
                  £{subtotal.toFixed(2)}
                </span>
              </div>
              {giftAidDeclared && giftAidTotal > 0 && (
                <p className="text-sm text-amber-700">
                  + £{(giftAidTotal * 0.25).toFixed(2)} Gift Aid (claimed by
                  charity)
                </p>
              )}
            </div>

            {/* Attendee summary */}
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium text-gray-900">
                {firstName} {lastName}
              </p>
              <p className="text-gray-600">{email}</p>
              {phone && <p className="text-gray-600">{phone}</p>}
            </div>

            {/* Payment method selection */}
            {subtotal > 0 && (form.stripeEnabled || form.goCardlessEnabled) && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </p>
                <div className="space-y-2">
                  {form.stripeEnabled && (
                    <div className="p-3 rounded-lg border-2 border-indigo-500 bg-indigo-50">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="payment"
                          value="STRIPE"
                          defaultChecked
                          className="accent-indigo-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Card Payment (Stripe)
                          </p>
                          <p className="text-xs text-gray-500">
                            Credit/Debit Card, Apple Pay, Google Pay
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                  {form.goCardlessEnabled && (
                    <div className="p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="payment"
                          value="GOCARDLESS"
                          className="accent-indigo-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Direct Debit (GoCardless)
                          </p>
                          <p className="text-xs text-gray-500">
                            Pay via bank Direct Debit
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() =>
                  setStep(showGiftAidStep ? "giftaid" : "items")
                }
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-lg text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: form.primaryColor }}
              >
                {submitting
                  ? "Processing..."
                  : subtotal > 0
                  ? `Pay £${subtotal.toFixed(2)}`
                  : "Register"}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: `${form.accentColor}20` }}
            >
              <CheckCircle2
                className="h-8 w-8"
                style={{ color: form.accentColor }}
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Registration Complete!
            </h2>
            <p className="text-gray-600">
              {form.thankYouMessage ||
                `Thank you for registering for ${form.event.name}. You will receive a confirmation email shortly.`}
            </p>
            {orderNumber && (
              <p className="text-sm text-gray-500">
                Order reference: <span className="font-mono font-bold">{orderNumber}</span>
              </p>
            )}
            {giftAidDeclared && giftAidTotal > 0 && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${form.accentColor}15`,
                  color: form.accentColor,
                }}
              >
                <Heart className="h-4 w-4" />
                Gift Aid: £{(giftAidTotal * 0.25).toFixed(2)} extra for the
                charity
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
