"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Preferences {
  contactId: string;
  firstName: string;
  email: string;
  phone: string;
  preferences: {
    emailOptIn: boolean;
    smsOptIn: boolean;
    postOptIn: boolean;
    phoneOptIn: boolean;
    communicationFrequency: string;
    interestCategories: string[];
  };
}

interface PreferenceCategory {
  id: string;
  label: string;
}

const INTEREST_CATEGORIES: PreferenceCategory[] = [
  { id: "fundraising", label: "Fundraising campaigns" },
  { id: "events", label: "Events and activities" },
  { id: "impact", label: "Impact stories" },
  { id: "volunteers", label: "Volunteer opportunities" },
  { id: "news", label: "Newsletter and updates" },
];

export default function PreferencesPage() {
  const params = useParams();
  const token = params.token as string;

  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    emailOptIn: true,
    smsOptIn: false,
    postOptIn: true,
    phoneOptIn: false,
    communicationFrequency: "WEEKLY",
    interestCategories: [] as string[],
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch(`/api/preferences/${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Invalid or expired preference link");
          } else if (response.status === 410) {
            setError("This preference link has expired");
          } else {
            setError("Failed to load preferences");
          }
          return;
        }

        const data = await response.json();
        setPreferences(data);
        setFormData(data.preferences);
      } catch (err) {
        setError("Failed to load preferences. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPreferences();
    }
  }, [token]);

  const handleToggle = (field: keyof typeof formData) => {
    if (field === "communicationFrequency") {
      return;
    }
    if (
      field === "emailOptIn" ||
      field === "smsOptIn" ||
      field === "postOptIn" ||
      field === "phoneOptIn"
    ) {
      setFormData((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    }
  };

  const handleFrequencyChange = (frequency: string) => {
    setFormData((prev) => ({
      ...prev,
      communicationFrequency: frequency,
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      interestCategories: prev.interestCategories.includes(categoryId)
        ? prev.interestCategories.filter((c) => c !== categoryId)
        : [...prev.interestCategories, categoryId],
    }));
  };

  const handleUnsubscribeAll = async () => {
    if (
      confirm(
        "Are you sure you want to unsubscribe from all communications? You can change this later."
      )
    ) {
      await handleSave(true);
    }
  };

  const handleSave = async (unsubscribeAll = false) => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/preferences/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          unsubscribeAll,
        }),
      });

      if (!response.ok) {
        setError("Failed to save preferences");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (err) {
      setError("Failed to save preferences. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unable to Load
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Communication Preferences
          </h1>
          <p className="text-gray-600">
            Hi {preferences.firstName}, manage how you'd like to hear from us
          </p>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <p className="text-green-800">
              Your preferences have been saved successfully
            </p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            {/* Communication Channels Section */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Communication Channels
              </h2>
              <div className="space-y-4">
                {/* Email Opt-in */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <label className="text-gray-900 font-medium">Email</label>
                    <p className="text-sm text-gray-600 mt-1">
                      {preferences.email || "Email not provided"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("emailOptIn")}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      formData.emailOptIn
                        ? "bg-indigo-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        formData.emailOptIn ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* SMS Opt-in */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <label className="text-gray-900 font-medium">
                      Text Message (SMS)
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {preferences.phone || "Phone not provided"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("smsOptIn")}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      formData.smsOptIn ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        formData.smsOptIn ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Post Opt-in */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <label className="text-gray-900 font-medium">
                      Post / Mail
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Traditional mail at your address
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("postOptIn")}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      formData.postOptIn
                        ? "bg-indigo-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        formData.postOptIn ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Phone Opt-in */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <label className="text-gray-900 font-medium">
                      Phone Call
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Direct calls to discuss your interests
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("phoneOptIn")}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      formData.phoneOptIn
                        ? "bg-indigo-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        formData.phoneOptIn ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Frequency Section */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                How often should we contact you?
              </h2>
              <div className="space-y-3">
                {["DAILY", "WEEKLY", "MONTHLY"].map((freq) => (
                  <label
                    key={freq}
                    className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                    style={{
                      borderColor:
                        formData.communicationFrequency === freq
                          ? "#4f46e5"
                          : "#e5e7eb",
                      backgroundColor:
                        formData.communicationFrequency === freq
                          ? "#eef2ff"
                          : "#f9fafb",
                    }}
                  >
                    <input
                      type="radio"
                      name="frequency"
                      value={freq}
                      checked={formData.communicationFrequency === freq}
                      onChange={(e) => handleFrequencyChange(e.target.value)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="ml-3 text-gray-900 font-medium">
                      {freq === "DAILY"
                        ? "Daily digest"
                        : freq === "WEEKLY"
                          ? "Weekly digest"
                          : "Monthly digest"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Interest Categories Section */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Interests
              </h2>
              <p className="text-gray-600 mb-4">
                Let us know what you're interested in (optional)
              </p>
              <div className="space-y-3">
                {INTEREST_CATEGORIES.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={formData.interestCategories.includes(
                        category.id
                      )}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="ml-3 text-gray-900">{category.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-8 space-y-3">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>

              <button
                onClick={handleUnsubscribeAll}
                disabled={saving}
                className="w-full px-6 py-3 bg-red-50 text-red-700 font-semibold rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-50 transition"
              >
                Unsubscribe from All
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-gray-500 text-center mt-6">
              Your communication preferences are important to us. Changes are
              saved immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
