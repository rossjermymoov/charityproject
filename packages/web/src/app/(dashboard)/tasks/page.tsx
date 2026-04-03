"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";


interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo: {
    name: string;
  };
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", color: "bg-yellow-100" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-100" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?status=${statusFilter}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error("Failed to load tasks");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error();
      ;
      fetchTasks();
    } catch {
      console.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      ;
      fetchTasks();
    } catch {
      console.error("Failed to delete task");
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-gray-600 mt-1">View and manage tasks</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {STATUS_OPTIONS.map((status) => (
          <Button
            key={status.value}
            variant={statusFilter === status.value ? "default" : "outline"}
            onClick={() => setStatusFilter(status.value)}
          >
            {status.label}
          </Button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No tasks</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  Delete
                </Button>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-gray-600">Assigned to:</span>
                  <span className="ml-2">{task.assignedTo.name}</span>
                </div>
                <div>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="px-2 py-1 border rounded"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
