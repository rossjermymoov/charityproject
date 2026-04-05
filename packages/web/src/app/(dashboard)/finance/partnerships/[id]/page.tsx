"use client";

import { formatDate, formatShortDate } from '@/lib/utils';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ArrowLeft, Mail, Phone, Edit2, Trash2, Plus, Calendar } from "lucide-react";

interface Partnership {
  id: string;
  type: string;
  status: string;
  annualValue: number | null;
  totalValue: number | null;
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  notes: string | null;
  benefits: string[];
  createdAt: string;
  updatedAt: string;
  organisation: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  activities: Activity[];
}

interface Activity {
  id: string;
  type: string;
  date: string;
  description: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const statusColors: Record<string, string> = {
  PROSPECT: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  LAPSED: "bg-orange-100 text-orange-800",
  ENDED: "bg-gray-100 text-gray-800",
};

const activityTypeLabels: Record<string, string> = {
  MEETING: "Meeting",
  EMAIL: "Email",
  CALL: "Call",
  EVENT: "Event",
  PAYMENT: "Payment",
  NOTE: "Note",
};

const activityTypeColors: Record<string, string> = {
  MEETING: "bg-blue-100 text-blue-800",
  EMAIL: "bg-purple-100 text-purple-800",
  CALL: "bg-green-100 text-green-800",
  EVENT: "bg-pink-100 text-pink-800",
  PAYMENT: "bg-yellow-100 text-yellow-800",
  NOTE: "bg-gray-100 text-gray-800",
};

export default function PartnershipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const partnershipId = params.id as string;

  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editData, setEditData] = useState({
    status: "",
    type: "",
    startDate: "",
    endDate: "",
    annualValue: "",
    totalValue: "",
    renewalDate: "",
    notes: "",
  });

  const [activityData, setActivityData] = useState({
    type: "NOTE",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    const fetchPartnership = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/partnerships/${partnershipId}`);

        if (!response.ok) {
          throw new Error("Partnership not found");
        }

        const data = await response.json();
        setPartnership(data);

        setEditData({
          status: data.status,
          type: data.type,
          startDate: data.startDate ? data.startDate.split("T")[0] : "",
          endDate: data.endDate ? data.endDate.split("T")[0] : "",
          annualValue: data.annualValue?.toString() || "",
          totalValue: data.totalValue?.toString() || "",
          renewalDate: data.renewalDate ? data.renewalDate.split("T")[0] : "",
          notes: data.notes || "",
        });
      } catch (error) {
        console.error("Error fetching partnership:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnership();
  }, [partnershipId]);

  const handleUpdate = async () => {
    try {
      setEditing(true);
      const response = await fetch(`/api/partnerships/${partnershipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editData.status,
          type: editData.type,
          startDate: editData.startDate || null,
          endDate: editData.endDate || null,
          annualValue: editData.annualValue || null,
          totalValue: editData.totalValue || null,
          renewalDate: editData.renewalDate || null,
          notes: editData.notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update partnership");
      }

      const updated = await response.json();
      setPartnership(updated);
      setEditing(false);
    } catch (error) {
      console.error("Error updating partnership:", error);
      alert("Failed to update partnership");
    }
  };

  const handleAddActivity = async () => {
    try {
      const response = await fetch(`/api/partnerships/${partnershipId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activityData.type,
          date: activityData.date,
          description: activityData.description || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add activity");
      }

      const newActivity = await response.json();
      if (partnership) {
        setPartnership({
          ...partnership,
          activities: [newActivity, ...partnership.activities],
        });
      }

      setActivityData({
        type: "NOTE",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setShowActivityDialog(false);
    } catch (error) {
      console.error("Error adding activity:", error);
      alert("Failed to add activity");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this partnership?")) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/partnerships/${partnershipId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete partnership");
      }

      router.push("/finance/partnerships");
    } catch (error) {
      console.error("Error deleting partnership:", error);
      alert("Failed to delete partnership");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading partnership...</div>
      </div>
    );
  }

  if (!partnership) {
    return (
      <div className="space-y-4">
        <Link href="/finance/partnerships">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partnerships
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-gray-600">
            Partnership not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/partnerships">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{partnership.organisation.name}</h1>
            <div className="flex gap-2 mt-2">
              <Badge className={statusColors[partnership.status] || "bg-gray-100 text-gray-800"}>
                {partnership.status}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Partnership Details */}
        <Card>
          <CardHeader>
            <CardTitle>Partnership Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Type</label>
              <Select
                options={[
                  { value: "PARTNER", label: "Partner" },
                  { value: "SPONSOR", label: "Sponsor" },
                  { value: "PATRON", label: "Patron" },
                  { value: "CORPORATE_DONOR", label: "Corporate Donor" },
                ]}
                value={editData.type}
                onChange={(e) => setEditData({ ...editData, type: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <Select
                options={[
                  { value: "PROSPECT", label: "Prospect" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "LAPSED", label: "Lapsed" },
                  { value: "ENDED", label: "Ended" },
                ]}
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Start Date</label>
                <Input
                  type="date"
                  value={editData.startDate}
                  onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">End Date</label>
                <Input
                  type="date"
                  value={editData.endDate}
                  onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Annual Value</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.annualValue}
                  onChange={(e) => setEditData({ ...editData, annualValue: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Total Value</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.totalValue}
                  onChange={(e) => setEditData({ ...editData, totalValue: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Renewal Date</label>
              <Input
                type="date"
                value={editData.renewalDate}
                onChange={(e) => setEditData({ ...editData, renewalDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Notes</label>
              <textarea
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={3}
              />
            </div>

            <Button onClick={handleUpdate} disabled={editing} className="w-full">
              {editing ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Organisation & Contact */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-medium">{partnership.organisation.name}</div>
              {partnership.organisation.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {partnership.organisation.email}
                </div>
              )}
              {partnership.organisation.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  {partnership.organisation.phone}
                </div>
              )}
            </CardContent>
          </Card>

          {partnership.contact && (
            <Card>
              <CardHeader>
                <CardTitle>Key Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="font-medium">
                  {partnership.contact.firstName} {partnership.contact.lastName}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {partnership.contact.email}
                </div>
                {partnership.contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {partnership.contact.phone}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {partnership.benefits && partnership.benefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {partnership.benefits.map((benefit, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activity Timeline</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowActivityDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </CardHeader>
        <CardContent>
          {partnership.activities && partnership.activities.length > 0 ? (
            <div className="space-y-4">
              {partnership.activities.map((activity) => (
                <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={activityTypeColors[activity.type] || "bg-gray-100 text-gray-800"}>
                        {activityTypeLabels[activity.type] || activity.type}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {formatDate(activity.date)}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="mt-2 text-sm text-gray-600">{activity.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      By {activity.user.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              No activities recorded yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Activity Dialog */}
      {showActivityDialog && (
        <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
          <Card className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  options={[
                    { value: "MEETING", label: "Meeting" },
                    { value: "EMAIL", label: "Email" },
                    { value: "CALL", label: "Call" },
                    { value: "EVENT", label: "Event" },
                    { value: "PAYMENT", label: "Payment" },
                    { value: "NOTE", label: "Note" },
                  ]}
                  value={activityData.type}
                  onChange={(e) => setActivityData({ ...activityData, type: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={activityData.date}
                  onChange={(e) => setActivityData({ ...activityData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={activityData.description}
                  onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={3}
                  placeholder="Add details about this activity..."
                />
              </div>

              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setShowActivityDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddActivity}>Add Activity</Button>
              </div>
            </CardContent>
          </Card>
        </Dialog>
      )}
    </div>
  );
}
