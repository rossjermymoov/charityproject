"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const TRIGGERS = [
  { value: "DONATION_RECEIVED", label: "Donation Received" },
  { value: "CONTACT_CREATED", label: "Contact Created" },
  { value: "TAG_ADDED", label: "Tag Added" },
  { value: "EVENT_REGISTERED", label: "Event Registered" },
  { value: "MEMBERSHIP_RENEWED", label: "Membership Renewed" },
  { value: "GIFT_AID_DECLARED", label: "Gift Aid Declared" },
  { value: "CAMPAIGN_TARGET_MET", label: "Campaign Target Met" },
];

const ACTION_TYPES = [
  { value: "SEND_EMAIL", label: "Send Email" },
  { value: "ADD_TAG", label: "Add Tag to Contact" },
  { value: "CREATE_TASK", label: "Create Task" },
];

export default function NewAutomationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("DONATION_RECEIVED");
  const [actions, setActions] = useState<Array<any>>([
    { type: "SEND_EMAIL", templateId: "" },
  ]);
  const [conditions, setConditions] = useState<Record<string, any>>({});
  const [isActive, setIsActive] = useState(false);

  const handleAddAction = () => {
    setActions([...actions, { type: "SEND_EMAIL", templateId: "" }]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleActionChange = (index: number, field: string, value: any) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          trigger,
          actions,
          conditions,
          isActive,
        }),
      });

      if (!response.ok) throw new Error("Failed to create rule");

      router.push("/settings/automations");
      router.refresh();
    } catch (error) {
      alert("Error creating automation rule");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/automations" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Automation Rule</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Thank donors over £100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this rule do?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Event
              </label>
              <Select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                options={TRIGGERS}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Conditions (Optional)
              </label>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                {trigger === "DONATION_RECEIVED" && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Minimum Amount (£)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 100"
                        value={conditions.minAmount || ""}
                        onChange={(e) =>
                          setConditions({
                            ...conditions,
                            minAmount: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Maximum Amount (£)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 10000"
                        value={conditions.maxAmount || ""}
                        onChange={(e) =>
                          setConditions({
                            ...conditions,
                            maxAmount: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>
                  </>
                )}
                {Object.keys(conditions).length === 0 && (
                  <p className="text-sm text-gray-500">
                    Leave empty to apply to all events
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Actions
              </label>
              <div className="space-y-4">
                {actions.map((action, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">
                        Action {idx + 1}
                      </h4>
                      {actions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAction(idx)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm text-gray-600 mb-1">
                        Action Type
                      </label>
                      <Select
                        value={action.type}
                        onChange={(e) =>
                          handleActionChange(idx, "type", e.target.value)
                        }
                        options={ACTION_TYPES}
                      />
                    </div>

                    {action.type === "SEND_EMAIL" && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Email Template
                        </label>
                        <Input
                          value={action.templateId || ""}
                          onChange={(e) =>
                            handleActionChange(idx, "templateId", e.target.value)
                          }
                          placeholder="Template ID or name"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Create templates in Email Templates section
                        </p>
                      </div>
                    )}

                    {action.type === "ADD_TAG" && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Tag Name
                        </label>
                        <Input
                          value={action.tagName || ""}
                          onChange={(e) =>
                            handleActionChange(idx, "tagName", e.target.value)
                          }
                          placeholder="e.g., Thanked"
                        />
                      </div>
                    )}

                    {action.type === "CREATE_TASK" && (
                      <>
                        <div className="mb-3">
                          <label className="block text-sm text-gray-600 mb-1">
                            Description
                          </label>
                          <Input
                            value={action.description || ""}
                            onChange={(e) =>
                              handleActionChange(idx, "description", e.target.value)
                            }
                            placeholder="Task description"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Assign To (User ID - Optional)
                          </label>
                          <Input
                            value={action.assignTo || ""}
                            onChange={(e) =>
                              handleActionChange(idx, "assignTo", e.target.value)
                            }
                            placeholder="Leave empty for no assignment"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddAction}
                className="mt-4"
              >
                + Add Another Action
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Activate this rule immediately
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/settings/automations">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
