import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

export default async function DpiaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dpia = await prisma.dpia.findUnique({
    where: { id },
    include: {
      createdBy: true,
      risks: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!dpia) notFound();

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    IN_REVIEW: "bg-blue-100 text-blue-800",
    DPO_REVIEW: "bg-indigo-100 text-indigo-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    REQUIRES_UPDATE: "bg-orange-100 text-orange-800",
  };

  const riskLevelColors: Record<string, string> = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    VERY_HIGH: "bg-red-100 text-red-800",
  };

  // Calculate risk level based on likelihood x severity
  const calculateRiskLevel = (
    likelihood: string,
    severity: string
  ): string => {
    const levels: Record<string, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      VERY_HIGH: 4,
    };
    const score = levels[likelihood] * levels[severity];
    if (score <= 2) return "LOW";
    if (score <= 6) return "MEDIUM";
    if (score <= 9) return "HIGH";
    return "VERY_HIGH";
  };

  async function updateStatus(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const newStatus = formData.get("status") as string;
    await prisma.dpia.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath(`/compliance/dpias/${id}`);
  }

  async function signOffDpo(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const dpoAdvice = formData.get("dpoAdvice") as string;
    await prisma.dpia.update({
      where: { id },
      data: {
        dpoAdvice,
        dpoSignedOff: true,
        dpoSignedOffAt: new Date(),
      },
    });

    revalidatePath(`/compliance/dpias/${id}`);
  }

  async function signOffCso(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.dpia.update({
      where: { id },
      data: {
        csoSignedOff: true,
        csoSignedOffAt: new Date(),
      },
    });

    revalidatePath(`/compliance/dpias/${id}`);
  }

  async function overruleDpo(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const overruleReason = formData.get("overruleReason") as string;
    await prisma.dpia.update({
      where: { id },
      data: {
        dpoOverruled: true,
        overruleReason,
      },
    });

    revalidatePath(`/compliance/dpias/${id}`);
  }

  async function addRisk(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const likelihood = formData.get("likelihood") as string;
    const severity = formData.get("severity") as string;
    const riskLevel = calculateRiskLevel(likelihood, severity);

    await prisma.dpiaRisk.create({
      data: {
        dpiaId: id,
        description: formData.get("description") as string,
        likelihood,
        severity,
        riskLevel,
        mitigation: (formData.get("mitigation") as string) || null,
        residualRisk: (formData.get("residualRisk") as string) || null,
        riskOwner: (formData.get("riskOwner") as string) || null,
      },
    });

    revalidatePath(`/compliance/dpias/${id}`);
  }

  async function deleteRisk(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const riskId = formData.get("riskId") as string;
    await prisma.dpiaRisk.delete({ where: { id: riskId } });

    revalidatePath(`/compliance/dpias/${id}`);
  }

  async function deleteDpia() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.dpia.delete({ where: { id } });
    redirect("/compliance/dpias");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/compliance/dpias" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{dpia.title}</h1>
          <p className="text-gray-500 mt-1">{dpia.description}</p>
        </div>
      </div>

      {/* Status Bar */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Current Status</p>
              <p className="text-xs text-blue-700">
                Created {formatDate(dpia.createdAt)} by {dpia.createdBy.name}
              </p>
            </div>
          </div>
          <form action={updateStatus} className="flex items-center gap-2">
            <select
              name="status"
              defaultValue={dpia.status}
              className="rounded-lg border border-blue-300 px-3 py-2 text-sm bg-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DPO_REVIEW">DPO Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="REQUIRES_UPDATE">Requires Update</option>
            </select>
            <Button type="submit" size="sm">
              Update
            </Button>
          </form>
        </div>
      </Card>

      {/* Overview sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1 - Overview */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Assessment Overview
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                Project/System
              </p>
              <p className="text-sm text-gray-900">{dpia.projectOrSystem}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                Data Controller
              </p>
              <p className="text-sm text-gray-900">{dpia.dataController}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                Legal Basis
              </p>
              <p className="text-sm text-gray-900">{dpia.legalBasis || "—"}</p>
            </div>
            {dpia.reviewDate && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Next Review
                </p>
                <p className="text-sm text-gray-900">
                  {formatDate(dpia.reviewDate)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2 - Data Processing */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Data Processing
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {dpia.dataSubjects && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Data Subjects
                </p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {dpia.dataSubjects}
                </p>
              </div>
            )}
            {dpia.dataCategories && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Data Categories
                </p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {dpia.dataCategories}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                Special Categories
              </p>
              <Badge
                className={
                  dpia.specialCategories
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }
              >
                {dpia.specialCategories ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Retention */}
      {(dpia.dataMinimisation ||
        dpia.retentionPeriod ||
        dpia.securityMeasures) && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Security & Retention
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {dpia.dataMinimisation && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Data Minimisation
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {dpia.dataMinimisation}
                </p>
              </div>
            )}
            {dpia.retentionPeriod && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Retention Period
                </p>
                <p className="text-sm text-gray-700">{dpia.retentionPeriod}</p>
              </div>
            )}
            {dpia.securityMeasures && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Security Measures
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {dpia.securityMeasures}
                </p>
              </div>
            )}
            {dpia.internationalTransfers && dpia.transferSafeguards && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  International Transfer Safeguards
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {dpia.transferSafeguards}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* DPO Sign-off section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              DPO Sign-off
            </h2>
            {dpia.dpoSignedOff && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {dpia.dpoSignedOff ? (
            <div className="space-y-4 mb-4 pb-4 border-b border-gray-100">
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm font-medium text-green-900 mb-1">
                  Signed off {formatDate(dpia.dpoSignedOffAt!)}
                </p>
                {dpia.dpoAdvice && (
                  <p className="text-sm text-green-800 whitespace-pre-wrap">
                    {dpia.dpoAdvice}
                  </p>
                )}
              </div>
              {dpia.dpoOverruled && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <p className="text-sm font-medium text-orange-900">
                    DPO advice overruled
                  </p>
                  <p className="text-sm text-orange-800 whitespace-pre-wrap mt-1">
                    {dpia.overruleReason}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form action={signOffDpo} className="space-y-3 mb-4 pb-4 border-b border-gray-100">
              <Textarea
                label="DPO Advice"
                name="dpoAdvice"
                placeholder="Provide written advice and sign off as DPO..."
                required
              />
              <Button type="submit" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Sign Off as DPO
              </Button>
            </form>
          )}
          {dpia.dpoSignedOff && !dpia.dpoOverruled && (
            <form action={overruleDpo} className="space-y-3">
              <Textarea
                label="Overrule Reason"
                name="overruleReason"
                placeholder="Document why DPO advice is being overruled..."
                required
              />
              <Button type="submit" variant="outline" size="sm">
                Overrule DPO Decision
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* CSO Sign-off section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Clinical Safety Officer Sign-off
            </h2>
            {dpia.csoSignedOff && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {dpia.csoSignedOff ? (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm font-medium text-green-900">
                Signed off {formatDate(dpia.csoSignedOffAt!)} by{" "}
                {dpia.csoName}
              </p>
            </div>
          ) : (
            <form action={signOffCso}>
              <input type="hidden" name="csoSignedOff" value="on" />
              <Button type="submit" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Sign Off as CSO
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Risk Register */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Risk Register</h2>
        </CardHeader>
        <CardContent>
          {/* Add Risk Form */}
          <form action={addRisk} className="space-y-3 mb-6 pb-6 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Add New Risk</h3>
            <Textarea
              label="Risk Description"
              name="description"
              placeholder="What is the risk?"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Likelihood"
                name="likelihood"
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "VERY_HIGH", label: "Very High" },
                ]}
                required
              />
              <Select
                label="Severity"
                name="severity"
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "VERY_HIGH", label: "Very High" },
                ]}
                required
              />
            </div>
            <Textarea
              label="Mitigation Actions"
              name="mitigation"
              placeholder="How will this risk be mitigated?"
            />
            <Select
              label="Residual Risk (after mitigation)"
              name="residualRisk"
              options={[
                { value: "LOW", label: "Low" },
                { value: "MEDIUM", label: "Medium" },
                { value: "HIGH", label: "High" },
                { value: "VERY_HIGH", label: "Very High" },
              ]}
            />
            <Input
              label="Risk Owner"
              name="riskOwner"
              placeholder="Who is responsible for this risk?"
            />
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Risk
            </Button>
          </form>

          {/* Risk table */}
          {dpia.risks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No risks identified yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                      Likelihood
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                      Severity
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                      Risk Level
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                      Residual
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                      Owner
                    </th>
                    <th className="text-center py-2 text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dpia.risks.map((risk) => (
                    <tr key={risk.id} className="hover:bg-gray-50">
                      <td className="py-2 text-gray-900 font-medium text-xs">
                        {risk.description}
                      </td>
                      <td className="py-2">
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          {risk.likelihood}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          {risk.severity}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge
                          className={
                            riskLevelColors[risk.riskLevel] || ""
                          }
                        >
                          {risk.riskLevel}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-600 text-xs">
                        {risk.residualRisk || "—"}
                      </td>
                      <td className="py-2 text-gray-600 text-xs">
                        {risk.riskOwner || "—"}
                      </td>
                      <td className="py-2 text-center">
                        <form action={deleteRisk}>
                          <input type="hidden" name="riskId" value={risk.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete DPIA */}
      <div className="flex justify-end">
        <form action={deleteDpia}>
          <Button variant="outline" type="submit" className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete DPIA
          </Button>
        </form>
      </div>
    </div>
  );
}
