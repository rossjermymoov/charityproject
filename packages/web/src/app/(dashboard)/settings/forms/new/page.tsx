"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  UserPlus,
  MessageSquare,
  CalendarDays,
  HandHeart,
  FileText,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const FORM_TYPES = [
  {
    type: "DONATION",
    name: "Donation Form",
    description: "Collect one-off or recurring donations with optional Gift Aid",
    icon: Heart,
    color: "bg-green-50 border-green-200 hover:border-green-400",
    iconColor: "text-green-600",
  },
  {
    type: "SIGNUP",
    name: "Signup / Newsletter",
    description: "Capture supporter details for mailing lists and updates",
    icon: UserPlus,
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    iconColor: "text-blue-600",
  },
  {
    type: "CONTACT",
    name: "Contact Us",
    description: "Let people send enquiries and messages to your charity",
    icon: MessageSquare,
    color: "bg-purple-50 border-purple-200 hover:border-purple-400",
    iconColor: "text-purple-600",
  },
  {
    type: "EVENT",
    name: "Event Registration",
    description: "Register attendees for your events and fundraisers",
    icon: CalendarDays,
    color: "bg-orange-50 border-orange-200 hover:border-orange-400",
    iconColor: "text-orange-600",
  },
  {
    type: "VOLUNTEER",
    name: "Volunteer Application",
    description: "Collect applications from potential volunteers",
    icon: HandHeart,
    color: "bg-yellow-50 border-yellow-200 hover:border-yellow-400",
    iconColor: "text-yellow-600",
  },
  {
    type: "CUSTOM",
    name: "Custom Form",
    description: "Start from scratch and add your own fields",
    icon: FileText,
    color: "bg-gray-50 border-gray-200 hover:border-gray-400",
    iconColor: "text-gray-600",
  },
];

export default function NewFormPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    primaryColor: "#4F46E5",
    thankYouMessage: "Thank you for your submission!",
    consentText: "I consent to being contacted about this submission",
    notifyEmail: "",
    suggestedAmounts: "5, 10, 25, 50, 100",
    allowCustomAmount: true,
    giftAidEnabled: false,
    recurringEnabled: false,
  });

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: selectedType }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/settings/forms/${data.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/forms">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Form</h1>
          <p className="text-gray-500 mt-1">Step {step} of 2</p>
        </div>
      </div>

      {/* Step 1: Choose Type */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Choose a form type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FORM_TYPES.map((ft) => {
              const Icon = ft.icon;
              return (
                <button
                  key={ft.type}
                  onClick={() => {
                    setSelectedType(ft.type);
                    setFormData((prev) => ({
                      ...prev,
                      name: ft.name,
                      title: ft.name,
                    }));
                  }}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    selectedType === ft.type
                      ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50"
                      : ft.color
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-lg p-2.5 ${
                        selectedType === ft.type ? "bg-indigo-100" : "bg-white"
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          selectedType === ft.type ? "text-indigo-600" : ft.iconColor
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{ft.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{ft.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedType && (
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Form Details</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form Name (internal)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g. Christmas Appeal Donation Form"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form Title (shown to public)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g. Support Our Christmas Appeal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="A short description shown at the top of the form"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Colour
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, primaryColor: e.target.value })
                        }
                        className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, primaryColor: e.target.value })
                        }
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notification Email
                    </label>
                    <input
                      type="email"
                      value={formData.notifyEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, notifyEmail: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Receive email on each submission"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thank You Message
                  </label>
                  <input
                    type="text"
                    value={formData.thankYouMessage}
                    onChange={(e) =>
                      setFormData({ ...formData, thankYouMessage: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GDPR Consent Text
                  </label>
                  <input
                    type="text"
                    value={formData.consentText}
                    onChange={(e) =>
                      setFormData({ ...formData, consentText: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedType === "DONATION" && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Donation Settings</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Suggested Amounts (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.suggestedAmounts}
                      onChange={(e) =>
                        setFormData({ ...formData, suggestedAmounts: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="5, 10, 25, 50, 100"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.allowCustomAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, allowCustomAmount: e.target.checked })
                        }
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm text-gray-700">Allow custom donation amount</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.giftAidEnabled}
                        onChange={(e) =>
                          setFormData({ ...formData, giftAidEnabled: e.target.checked })
                        }
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm text-gray-700">
                        Enable Gift Aid declaration
                      </span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.recurringEnabled}
                        onChange={(e) =>
                          setFormData({ ...formData, recurringEnabled: e.target.checked })
                        }
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm text-gray-700">
                        Allow recurring donations
                      </span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !formData.name}>
              {saving ? "Creating..." : "Create Form"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
