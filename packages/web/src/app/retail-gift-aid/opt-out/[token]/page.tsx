import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { OptOutForm } from "./opt-out-form";

export default async function RetailGiftAidOptOutPage({
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
          periodStart: true,
          periodEnd: true,
          status: true,
        },
      },
    },
  });

  if (!notification) notFound();

  // If already opted out, show confirmation
  if (notification.optedOut) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-amber-600 px-8 py-6 text-white">
              <h1 className="text-2xl font-bold">Already Opted Out</h1>
              <p className="text-amber-200 mt-1">Retail Gift Aid Notification</p>
            </div>
            <div className="p-8">
              <p className="text-gray-700">
                You have already opted out of this Gift Aid claim. Your opt-out was
                recorded on{" "}
                {notification.optOutAt
                  ? new Date(notification.optOutAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
                  : "a previous date"}
                .
              </p>
              {notification.optOutReason && (
                <p className="text-gray-500 mt-2 text-sm">
                  Reason: {notification.optOutReason}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If claim is already submitted/accepted, too late
  if (["SUBMITTED", "ACCEPTED", "PARTIAL"].includes(notification.claim.status)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gray-600 px-8 py-6 text-white">
              <h1 className="text-2xl font-bold">Claim Already Submitted</h1>
              <p className="text-gray-300 mt-1">Retail Gift Aid Notification</p>
            </div>
            <div className="p-8">
              <p className="text-gray-700">
                This Gift Aid claim has already been submitted to HMRC. If you need
                to make changes, please contact the charity directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { orgName: true },
  });

  const charityName = settings?.orgName || "The charity";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-amber-600 px-8 py-6 text-white">
            <h1 className="text-2xl font-bold">Retail Gift Aid — Opt Out</h1>
            <p className="text-amber-200 mt-1">
              {charityName} — Claim {notification.claim.claimReference}
            </p>
          </div>

          <div className="p-8 space-y-6">
            <p className="text-gray-700">
              Hi {notification.contactName}, you are receiving this because{" "}
              {charityName} is preparing a Retail Gift Aid claim with HMRC for
              the tax year{" "}
              {new Date(notification.claim.periodStart).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}{" "}
              to{" "}
              {new Date(notification.claim.periodEnd).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
              .
            </p>

            <p className="text-gray-700">
              If you wish to opt out of this claim, please complete the form
              below. Common reasons for opting out include:
            </p>

            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>You have not paid enough Income Tax or Capital Gains Tax to cover the Gift Aid claimed</li>
              <li>You no longer wish to Gift Aid proceeds from donated goods</li>
              <li>Any other reason you wish to withdraw from this claim</li>
            </ul>

            <OptOutForm token={token} contactName={notification.contactName} />

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Need to update your details?</h3>
              <p className="text-sm text-gray-600 mb-3">
                If your name or address has changed, you don&apos;t need to opt out — you can update
                your details instead so we have the correct information for your Gift Aid declaration.
              </p>
              <a
                href={`/retail-gift-aid/update-details/${token}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update my details
              </a>
              <p className="text-xs text-gray-500 mt-2">
                You can also call {charityName} directly to update your details over the phone.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This is a secure page. Your response will be recorded for HMRC
          compliance purposes.
        </p>
      </div>
    </div>
  );
}
