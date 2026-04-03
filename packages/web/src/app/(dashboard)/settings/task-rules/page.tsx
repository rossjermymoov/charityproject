"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2 } from "lucide-react";


interface TaskRule {
  id: string;
  name: string;
  triggerEvent: string;
  taskTitle: string;
  taskDescription: string | null;
  dueDays: number;
  priority: string;
  isActive: boolean;
  assignToUser?: {
    name: string;
  } | null;
  assignToRole?: string | null;
}

const TRIGGER_EVENTS = [
  { value: "CONTACT_CREATED", label: "Contact Created" },
  { value: "DONATION_CREATED", label: "Donation Created" },
  { value: "MEMBERSHIP_CREATED", label: "Membership Created" },
];

export default function TaskRulesPage() {
  const [rules, setRules] = useState<TaskRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/task-rules");
      if (!res.ok) throw new Error("Failed to fetch task rules");
      const data = await res.json();
      setRules(data);
    } catch (error) {
      console.error("Failed to load task rules");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const res = await fetch(`/api/task-rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      ;
      fetchRules();
    } catch {
      console.error("Failed to delete");
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Task Automation Rules</h1>
          <p className="text-gray-600 mt-1">Auto-assign tasks based on events</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Create Task Rule</h2>
          <p className="text-gray-600">
            Visit the API to create rules programmatically or use the task system directly.
          </p>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No task rules configured yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{rule.name}</h3>
                  <p className="text-sm text-gray-600">{rule.taskTitle}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  Delete
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                <p>Event: {TRIGGER_EVENTS.find((e) => e.value === rule.triggerEvent)?.label}</p>
                <p>Priority: {rule.priority} | Due: {rule.dueDays} days</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
