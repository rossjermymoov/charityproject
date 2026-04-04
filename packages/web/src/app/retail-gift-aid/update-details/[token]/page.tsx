import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UpdateDetailsForm } from "./update-details-form";

export default async function UpdateDetailsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const notification = await prisma.retailGiftAidNotification.findUnique({
    where: { token },
    include: {
      claim: {
        select: {
          claimReference: true,
          status: true,
        },
      },
      contact: {
        select: {
          firstName: true,
          lastName: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          postcode: true,
        },
      },
    },
  });

  if (!notification) notFound();

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { orgName: true },
  });

  const charityName = settings?.orgName || "The charity";
  const charityPhone = ""; // TODO: add phone field to SystemSettings

  // If claim is already submitted/accepted, too late for changes
  if (["SUBMITTED", "ACCEPTED", "PARTIAL"].includes(notification.claim.status)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gray-600 px-8 py-6 text-white">
              <h1 className="text-2xl font-bold">Claim Already Submitted</h1>
              <p className="text-gray-300 mt-1">Unable to update details</p>
            </div>
            <div className="p-8">
              <p className="text-gray-700">
                This Gift Aid claim has already been submitted to HMRC. If you need
                to update your details, please contact {charityName} directly
                {charityPhone ? ` on ${charityPhone}` : ""}.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-blue-600 px-8 py-6 text-white">
            <h1 className="text-2xl font-bold">Update Your Details</h1>
            <p className="text-blue-200 mt-1">
              {charityName} — Claim {notification.claim.claimReference}
            </p>
          </div>

          <div className="p-8 space-y-6">
            <p className="text-gray-700">
              Hi {notification.contactName}, please check your details below are
              correct. If anything has changed (e.g. your name or address), please
              update the fields and confirm.
            </p>

            <p className="text-sm text-gray-500">
              Keeping your details up to date ensures your Gift Aid declaration
              remains valid with HMRC.
            </p>

            <UpdateDetailsForm
              token={token}
              contactName={notification.contactName}
              currentDetails={{
                firstName: notification.contact.firstName,
                lastName: notification.contact.lastName,
                addressLine1: notification.contact.addressLine1 || "",
                addressLine2: notification.contact.addressLine2 || "",
                city: notification.contact.city || "",
                postcode: notification.contact.postcode || "",
              }}
            />

            {charityPhone && (
              <p className="text-xs text-gray-500 text-center">
                You can also call {charityName} on {charityPhone} to update your details.
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This is a secure page. Any changes will be recorded for compliance purposes.
        </p>
      </div>
    </div>
  );
}
