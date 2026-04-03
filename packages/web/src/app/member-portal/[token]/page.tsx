"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface MemberData {
  contactId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    postcode: string | null;
    country: string | null;
  };
  membership: {
    id: string;
    memberNumber: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string;
    renewalDate: string | null;
    autoRenew: boolean;
  } | null;
  donationSummary: {
    count: number;
    total: number;
    currency: string;
  };
}

export default function MemberPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    country: "",
  });

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const response = await fetch(`/api/member-portal/${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Invalid or expired portal link");
          } else if (response.status === 410) {
            setError("This portal link has expired");
          } else {
            setError("Failed to load your information");
          }
          return;
        }

        const data = await response.json();
        setMemberData(data);
        setFormData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          addressLine1: data.address.line1 || "",
          addressLine2: data.address.line2 || "",
          city: data.address.city || "",
          postcode: data.address.postcode || "",
          country: data.address.country || "",
        });
      } catch (err) {
        setError("Failed to load your information. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchMemberData();
    }
  }, [token]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/member-portal/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        setError("Failed to save your information");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (err) {
      setError("Failed to save your information. Please try again.");
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
          <p className="mt-4 text-gray-600">Loading your member information...</p>
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

  if (!memberData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Member Portal
          </h1>
          <p className="text-gray-600">
            Hello {memberData.firstName}, view and manage your member details
          </p>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <p className="text-green-800">
              Your information has been saved successfully
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Membership Card */}
          {memberData.membership && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Membership
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Membership Type
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {memberData.membership.type}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Member Number
                    </p>
                    <p className="text-lg font-mono text-gray-900">
                      {memberData.membership.memberNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Status
                    </p>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          memberData.membership.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : memberData.membership.status === "EXPIRED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {memberData.membership.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Started
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Date(memberData.membership.startDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Expires
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Date(memberData.membership.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  {memberData.membership.renewalDate && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">
                        Next Renewal
                      </p>
                      <p className="text-sm text-gray-900">
                        {new Date(memberData.membership.renewalDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Auto-Renewal
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {memberData.membership.autoRenew ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile & Donations */}
          <div className="lg:col-span-2">
            {/* Donation Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Donation History
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Last 12 Months
                  </p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {memberData.donationSummary.count}
                  </p>
                  <p className="text-sm text-gray-600">donation{memberData.donationSummary.count !== 1 ? "s" : ""}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Total Amount
                  </p>
                  <p className="text-3xl font-bold text-indigo-600">
                    £{memberData.donationSummary.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">GBP</p>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Profile Information
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postcode
                    </label>
                    <input
                      type="text"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-8">
          Your data is secure and encrypted. Changes are saved immediately.
        </p>
      </div>
    </div>
  );
}
