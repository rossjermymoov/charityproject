import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function calculateRiskLevel(severity: string, likelihood: string): string {
  const severityOrder: Record<string, number> = {
    CATASTROPHIC: 5,
    MAJOR: 4,
    CONSIDERABLE: 3,
    SIGNIFICANT: 2,
    MINOR: 1,
  };

  const likelihoodOrder: Record<string, number> = {
    VERY_HIGH: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    VERY_LOW: 1,
  };

  const severityScore = severityOrder[severity] || 0;
  const likelihoodScore = likelihoodOrder[likelihood] || 0;
  const product = severityScore * likelihoodScore;

  if (product >= 20) return "CRITICAL";
  if (product >= 12) return "HIGH";
  if (product >= 6) return "MEDIUM";
  return "LOW";
}

export default async function NewHazardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  async function createHazard(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const initialSeverity = formData.get("initialSeverity") as string;
    const initialLikelihood = formData.get("initialLikelihood") as string;
    const initialRiskLevel = calculateRiskLevel(initialSeverity, initialLikelihood);

    const residualSeverity = formData.get("residualSeverity") as string;
    const residualLikelihood = formData.get("residualLikelihood") as string;
    const residualRiskLevel = residualSeverity && residualLikelihood
      ? calculateRiskLevel(residualSeverity, residualLikelihood)
      : null;

    await prisma.clinicalHazard.create({
      data: {
        hazardNumber: formData.get("hazardNumber") as string,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        cause: (formData.get("cause") as string) || null,
        effect: (formData.get("effect") as string) || null,
        category: (formData.get("category") as string) || null,
        initialSeverity,
        initialLikelihood,
        initialRiskLevel,
        controls: (formData.get("controls") as string) || null,
        residualSeverity: residualSeverity || null,
        residualLikelihood: residualLikelihood || null,
        residualRiskLevel,
        assignedTo: (formData.get("assignedTo") as string) || null,
      },
    });

    redirect("/dashboard/compliance/clinical-safety");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/compliance/clinical-safety">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Hazard</h1>
          <p className="text-gray-500 mt-1">Add hazard to the clinical safety log</p>
        </div>
      </div>

      <form action={createHazard} className="space-y-6">
        {/* Hazard Identification */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hazard Identification</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hazard Number *
                </label>
                <input
                  name="hazardNumber"
                  required
                  placeholder="e.g. HAZ-001"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  name="name"
                  required
                  placeholder="Brief hazard title"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                required
                placeholder="What is the hazard?"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cause</label>
              <textarea
                name="cause"
                placeholder="What causes this hazard?"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effect</label>
              <textarea
                name="effect"
                placeholder="What happens if this hazard occurs?"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select...</option>
                <option value="PATIENT_SAFETY">Patient Safety</option>
                <option value="DATA_LOSS">Data Loss</option>
                <option value="SYSTEM_FAILURE">System Failure</option>
                <option value="ACCESS_CONTROL">Access Control</option>
                <option value="CLINICAL_DECISION">Clinical Decision</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Initial Risk Assessment */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Initial Risk Assessment</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Severity *
                </label>
                <select
                  name="initialSeverity"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select...</option>
                  <option value="CATASTROPHIC">Catastrophic</option>
                  <option value="MAJOR">Major</option>
                  <option value="CONSIDERABLE">Considerable</option>
                  <option value="SIGNIFICANT">Significant</option>
                  <option value="MINOR">Minor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Likelihood *
                </label>
                <select
                  name="initialLikelihood"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select...</option>
                  <option value="VERY_HIGH">Very High</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="VERY_LOW">Very Low</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-blue-700">
                Risk Level: Calculated automatically from severity x likelihood
              </p>
            </div>
          </div>
        </Card>

        {/* Controls */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Controls</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Controls & Mitigations
              </label>
              <textarea
                name="controls"
                placeholder="What controls are in place to mitigate this hazard?"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Residual Assessment */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Residual Risk Assessment</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Residual Severity
                </label>
                <select
                  name="residualSeverity"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select...</option>
                  <option value="CATASTROPHIC">Catastrophic</option>
                  <option value="MAJOR">Major</option>
                  <option value="CONSIDERABLE">Considerable</option>
                  <option value="SIGNIFICANT">Significant</option>
                  <option value="MINOR">Minor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Residual Likelihood
                </label>
                <select
                  name="residualLikelihood"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select...</option>
                  <option value="VERY_HIGH">Very High</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="VERY_LOW">Very Low</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Assignment */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <input
                name="assignedTo"
                placeholder="Person responsible for mitigation"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit">Create Hazard</Button>
          <Link href="/dashboard/compliance/clinical-safety">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
