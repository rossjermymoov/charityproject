import { formatDate, formatShortDate } from '@/lib/utils';
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { ConfirmButton } from "@/components/ui/confirm-button";

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

export default async function HazardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const hazard = await prisma.clinicalHazard.findUnique({
    where: { id },
  });

  if (!hazard) {
    redirect("/compliance/clinical-safety");
  }

  async function updateAcceptability(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.clinicalHazard.update({
      where: { id },
      data: {
        riskAcceptability: formData.get("riskAcceptability") as string,
      },
    });

    redirect(`/compliance/clinical-safety/${id}`);
  }

  async function signOff(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.clinicalHazard.update({
      where: { id },
      data: {
        csoSignedOff: true,
        csoSignedOffAt: new Date(),
        csoReview: (formData.get("csoReview") as string) || null,
      },
    });

    redirect(`/compliance/clinical-safety/${id}`);
  }

  async function updateStatus(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.clinicalHazard.update({
      where: { id },
      data: {
        status: formData.get("status") as string,
      },
    });

    redirect(`/compliance/clinical-safety/${id}`);
  }

  async function deleteHazard() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.clinicalHazard.delete({
      where: { id },
    });

    redirect("/compliance/clinical-safety");
  }

  const riskLevelColors: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800",
    HIGH: "bg-orange-100 text-orange-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    LOW: "bg-green-100 text-green-800",
  };

  const acceptabilityColors: Record<string, string> = {
    ACCEPTABLE: "bg-green-100 text-green-800",
    TOLERABLE: "bg-yellow-100 text-yellow-800",
    UNACCEPTABLE: "bg-red-100 text-red-800",
  };

  const statusColors: Record<string, string> = {
    OPEN: "bg-red-100 text-red-800",
    MITIGATED: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-green-100 text-green-800",
    TRANSFERRED: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/compliance/clinical-safety">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {hazard.hazardNumber}: {hazard.name}
            </h1>
            <p className="text-gray-500 mt-1">Clinical safety hazard</p>
          </div>
        </div>
        <form action={deleteHazard}>
          <ConfirmButton
            message="Are you sure you want to delete this hazard?"
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </ConfirmButton>
        </form>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge className={riskLevelColors[hazard.initialRiskLevel] || ""}>
          Initial Risk: {hazard.initialRiskLevel}
        </Badge>
        <Badge className={acceptabilityColors[hazard.riskAcceptability] || ""}>
          {hazard.riskAcceptability}
        </Badge>
        <Badge className={statusColors[hazard.status] || ""}>
          {hazard.status}
        </Badge>
        {hazard.csoSignedOff && <Badge variant="default">CSO Signed Off</Badge>}
      </div>

      {/* Hazard Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hazard Information</h2>
        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Description</p>
            <p className="text-sm text-gray-900 mt-1">{hazard.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {hazard.cause && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Cause</p>
                <p className="text-sm text-gray-900 mt-1">{hazard.cause}</p>
              </div>
            )}
            {hazard.effect && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Effect</p>
                <p className="text-sm text-gray-900 mt-1">{hazard.effect}</p>
              </div>
            )}
          </div>

          {hazard.category && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
              <p className="text-sm text-gray-900 mt-1">{hazard.category.replace(/_/g, " ")}</p>
            </div>
          )}

          {hazard.assignedTo && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Assigned To</p>
              <p className="text-sm text-gray-900 mt-1">{hazard.assignedTo}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Initial Risk Assessment */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Initial Risk Assessment</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Severity</p>
            <p className="text-sm text-gray-900 mt-1 font-medium">{hazard.initialSeverity}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Likelihood</p>
            <p className="text-sm text-gray-900 mt-1 font-medium">{hazard.initialLikelihood}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Risk Level</p>
            <Badge className={riskLevelColors[hazard.initialRiskLevel] || ""}>
              {hazard.initialRiskLevel}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Controls */}
      {hazard.controls && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Controls & Mitigations</h2>
          <p className="text-sm text-gray-900">{hazard.controls}</p>
        </Card>
      )}

      {/* Residual Risk Assessment */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Residual Risk Assessment</h2>
        {hazard.residualSeverity && hazard.residualLikelihood ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Residual Severity</p>
              <p className="text-sm text-gray-900 mt-1 font-medium">{hazard.residualSeverity}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Residual Likelihood</p>
              <p className="text-sm text-gray-900 mt-1 font-medium">{hazard.residualLikelihood}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Residual Risk Level</p>
              <Badge className={riskLevelColors[hazard.residualRiskLevel || ""] || ""}>
                {hazard.residualRiskLevel}
              </Badge>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Not yet assessed</p>
        )}
      </Card>

      {/* Risk Acceptability */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Acceptability Decision</h2>
        <form action={updateAcceptability} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Acceptability Level
            </label>
            <select
              name="riskAcceptability"
              defaultValue={hazard.riskAcceptability}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ACCEPTABLE">Acceptable</option>
              <option value="TOLERABLE">Tolerable</option>
              <option value="UNACCEPTABLE">Unacceptable</option>
            </select>
          </div>
          <Button type="submit">Save Acceptability</Button>
        </form>
      </Card>

      {/* CSO Sign-off */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Safety Officer Sign-off</h2>
        {hazard.csoSignedOff ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">
                <span className="font-semibold">✓ Signed off</span> on{" "}
                {hazard.csoSignedOffAt && formatDate(hazard.csoSignedOffAt)}
              </p>
            </div>
            {hazard.csoReview && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Review Notes</p>
                <p className="text-sm text-gray-900 mt-1">{hazard.csoReview}</p>
              </div>
            )}
          </div>
        ) : (
          <form action={signOff} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CSO Review Notes
              </label>
              <textarea
                name="csoReview"
                placeholder="Clinical Safety Officer review and approval notes"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Button type="submit">Sign Off as CSO</Button>
          </form>
        )}
      </Card>

      {/* Status Management */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h2>
        <form action={updateStatus} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              name="status"
              defaultValue={hazard.status}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="OPEN">Open</option>
              <option value="MITIGATED">Mitigated</option>
              <option value="CLOSED">Closed</option>
              <option value="TRANSFERRED">Transferred</option>
            </select>
          </div>
          <Button type="submit">Update Status</Button>
        </form>
      </Card>
    </div>
  );
}
