import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Trash2, Edit2, Link2, Copy, CheckCircle, Pause, Play } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ImageUpload } from "./image-upload";
import { CopyLinkButton } from "./copy-link-button";
import crypto from "crypto";
import { ceaseGiftAid, pauseGiftAid, resumeGiftAid } from "../actions";

export default async function GiftAidDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const giftAid = await prisma.giftAid.findUnique({
    where: { id },
    include: {
      contact: true,
      createdBy: true,
      pauses: true,
    },
  });

  if (!giftAid) notFound();

  async function updateDeclaration(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const endDate = formData.get("endDate") as string;

    await prisma.giftAid.update({
      where: { id },
      data: {
        declarationDate: new Date(formData.get("declarationDate") as string),
        startDate: new Date(formData.get("startDate") as string),
        endDate: endDate ? new Date(endDate) : null,
        notes: (formData.get("notes") as string) || null,
      },
    });

    revalidatePath(`/finance/gift-aid/${id}`);
  }

  async function updateStatus(formData: FormData) {
    "use server";
    const session = await requireAuth();

    await prisma.giftAid.update({
      where: { id },
      data: {
        status: formData.get("status") as string,
      },
    });

    revalidatePath(`/finance/gift-aid/${id}`);
  }

  async function generateDigitalLink() {
    "use server";
    const session = await requireAuth();

    const token = crypto.randomBytes(32).toString("hex");

    await prisma.giftAid.update({
      where: { id },
      data: { digitalToken: token },
    });

    revalidatePath(`/finance/gift-aid/${id}`);
  }

  async function deleteGiftAid() {
    "use server";
    const session = await requireAuth();

    await prisma.giftAid.delete({
      where: { id },
    });

    revalidatePath("/finance/gift-aid");
    redirect("/finance/gift-aid");
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    EXPIRED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const sourceLabels: Record<string, string> = {
    MANUAL: "Manually entered",
    DIGITAL: "Signed digitally",
    PAPER: "Paper declaration",
  };

  const cessationReasons = [
    { value: "DONOR_REQUEST", label: "Donor Request" },
    { value: "DECEASED", label: "Donor Deceased" },
    { value: "HMRC_INSTRUCTION", label: "HMRC Instruction" },
    { value: "OTHER", label: "Other" },
  ];

  const activePauses = giftAid.pauses.filter(p => !p.resumedAt);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/gift-aid" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Gift Aid Declaration</h1>
        <Badge className={statusColors[giftAid.status]}>{giftAid.status}</Badge>
        <Badge className={giftAid.type === "RETAIL" ? "bg-purple-100 text-purple-800" : "bg-indigo-100 text-indigo-800"}>
          {giftAid.type === "RETAIL" ? "Retail Gift Aid" : "Standard Gift Aid"}
        </Badge>
        <Badge variant="outline">{sourceLabels[giftAid.source] || giftAid.source}</Badge>
      </div>

      {/* Main details */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </p>
                <Link
                  href={`/crm/contacts/${giftAid.contact.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-1 block"
                >
                  {giftAid.contact.firstName} {giftAid.contact.lastName}
                </Link>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Declaration Date
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(giftAid.declarationDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(giftAid.startDate)}</p>
              </div>
              {giftAid.backdateFrom && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Backdated From
                  </p>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(giftAid.backdateFrom)}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {giftAid.endDate ? formatDate(giftAid.endDate) : "Ongoing"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recorded by
                </p>
                <p className="text-sm text-gray-900 mt-1">{giftAid.createdBy.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(giftAid.createdAt)}</p>
              </div>
            </div>
          </div>

          {giftAid.notes && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</p>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{giftAid.notes}</p>
            </div>
          )}

          {giftAid.cessationReason && (
            <div className="mt-8 pt-8 border-t border-red-100 bg-red-50 rounded-lg p-4">
              <p className="text-xs font-medium text-red-700 uppercase tracking-wider">Cessation Details</p>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <p className="text-red-600 font-medium">Reason</p>
                  <p className="text-red-900">{giftAid.cessationReason}</p>
                </div>
                <div>
                  <p className="text-red-600 font-medium">Date</p>
                  <p className="text-red-900">{formatDate(giftAid.cessationDate!)}</p>
                </div>
              </div>
              {giftAid.cessationNotes && (
                <p className="text-red-800 mt-3 text-sm">{giftAid.cessationNotes}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Declaration Text */}
      <Card className={giftAid.type === "RETAIL" ? "border-purple-200 bg-purple-50/30" : "border-indigo-200 bg-indigo-50/30"}>
        <CardContent className="pt-6">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {giftAid.type === "RETAIL" ? "Retail Gift Aid Declaration" : "Standard Gift Aid Declaration"}
          </p>
          {giftAid.type === "RETAIL" ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700 leading-relaxed">
                I want to Gift Aid the proceeds from the sale of any goods I donate to this charity. I authorise the charity to act as my agent in selling my donated goods, and I agree to a commission for this service. I confirm that I own the goods I am donating and I am not acting as a business in selling them.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year it is my responsibility to pay any difference.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-700 leading-relaxed">
                I want to Gift Aid my donation and any donations I make in the future or have made in the past 4 years to this charity.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year it is my responsibility to pay any difference.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digital Signature Audit Trail */}
      {giftAid.digitalSignedAt && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Digital Signature Record</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase">Signed by</p>
                <p className="text-green-900 font-medium mt-1">{giftAid.digitalSignedName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-green-700 uppercase">Date & Time</p>
                <p className="text-green-900 mt-1">{giftAid.digitalSignedAt.toISOString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-green-700 uppercase">IP Address</p>
                <p className="text-green-900 mt-1">{giftAid.digitalSignedIp || "Not recorded"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-green-700 uppercase">Method</p>
                <p className="text-green-900 mt-1">Electronic signature via secure web form</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Declaration Image */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Declaration Document</h3>
          </CardHeader>
          <CardContent>
            <ImageUpload
              giftAidId={id}
              currentImageUrl={giftAid.declarationImageUrl}
            />
          </CardContent>
        </Card>

        {/* Digital Declaration Link */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Digital Declaration</h3>
            </div>
          </CardHeader>
          <CardContent>
            {giftAid.digitalToken ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Send this link to the donor so they can sign the Gift Aid
                  declaration digitally. The link is unique and can only be used once.
                </p>
                <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                  <code className="text-xs text-gray-700 flex-1 break-all">
                    /declare/{giftAid.digitalToken}
                  </code>
                  <CopyLinkButton token={giftAid.digitalToken} />
                </div>
                {giftAid.digitalSignedAt ? (
                  <Badge className="bg-green-100 text-green-800">
                    Signed on {formatDate(giftAid.digitalSignedAt)}
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800">Awaiting signature</Badge>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Generate a unique link that you can send to the donor. They can
                  complete a legally compliant Gift Aid declaration digitally —
                  their name, IP address, and timestamp are recorded as an audit
                  trail.
                </p>
                <form action={generateDigitalLink}>
                  <Button type="submit" variant="outline">
                    <Link2 className="h-4 w-4 mr-2" />
                    Generate Declaration Link
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pause/Resume Section */}
      {activePauses.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-900">Active Pauses</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activePauses.map(pause => (
                <div key={pause.id} className="border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="text-yellow-900 font-medium">
                        Paused from {formatDate(pause.pauseFrom)}
                        {pause.pauseUntil && ` until ${formatDate(pause.pauseUntil)}`}
                      </p>
                      {pause.reason && (
                        <p className="text-yellow-700 text-xs mt-1">{pause.reason}</p>
                      )}
                    </div>
                    <form action={resumeGiftAid}>
                      <input type="hidden" name="pauseId" value={pause.id} />
                      <input type="hidden" name="giftAidId" value={id} />
                      <Button type="submit" size="sm" variant="outline">
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pause Form */}
      {giftAid.status === "ACTIVE" && activePauses.length === 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Pause Declaration</h3>
          </CardHeader>
          <CardContent>
            <form action={pauseGiftAid} className="space-y-4">
              <input type="hidden" name="giftAidId" value={id} />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Pause From"
                  name="pauseFrom"
                  type="date"
                  required
                />
                <Input
                  label="Resume On (optional)"
                  name="pauseUntil"
                  type="date"
                />
              </div>
              <Input
                label="Reason"
                name="reason"
                placeholder="e.g., Donor on holiday, address under review"
              />
              <Button type="submit">
                <Pause className="h-4 w-4 mr-2" />
                Pause Declaration
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Cessation Form */}
      {giftAid.status === "ACTIVE" && !giftAid.cessationReason && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Cease Declaration</h3>
          </CardHeader>
          <CardContent>
            <form action={ceaseGiftAid} className="space-y-4">
              <input type="hidden" name="giftAidId" value={id} />
              <Select
                label="Cessation Reason"
                name="cessationReason"
                required
                options={cessationReasons}
              />
              <Input
                label="Cessation Date"
                name="cessationDate"
                type="date"
                required
              />
              <Input
                label="Notes"
                name="cessationNotes"
                placeholder="Additional details about the cessation"
              />
              <Button type="submit" variant="destructive">
                Cease Declaration
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Declaration Details */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Edit Declaration</h3>
        </CardHeader>
        <CardContent>
          <form action={updateDeclaration} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Declaration Date"
                name="declarationDate"
                type="date"
                required
                defaultValue={giftAid.declarationDate.toISOString().split("T")[0]}
              />
              <Input
                label="Start Date"
                name="startDate"
                type="date"
                required
                defaultValue={giftAid.startDate.toISOString().split("T")[0]}
              />
            </div>

            <Input
              label="End Date (optional - leave blank for ongoing)"
              name="endDate"
              type="date"
              placeholder="Leave blank if ongoing"
              defaultValue={giftAid.endDate ? giftAid.endDate.toISOString().split("T")[0] : ""}
            />

            <Input
              label="Notes"
              name="notes"
              placeholder="Additional notes..."
              defaultValue={giftAid.notes || ""}
            />

            <Button type="submit">
              <Edit2 className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Status update */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Change Status</h3>
        </CardHeader>
        <CardContent>
          <form action={updateStatus} className="flex items-end gap-4">
            <div className="flex-1">
              <Select
                label="Status"
                name="status"
                defaultValue={giftAid.status}
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "EXPIRED", label: "Expired" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
              />
            </div>
            <Button type="submit">Update Status</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/finance/gift-aid">
          <Button variant="outline">Back</Button>
        </Link>
        <form action={deleteGiftAid}>
          <ConfirmButton message="Are you sure you want to delete this declaration?" variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
