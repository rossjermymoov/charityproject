import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EmailConsentForm } from "./email-consent-form";

export default async function RetailGiftAidEmailConsentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const notification = await prisma.retailGiftAidNotification.findUnique({
    where: { token },
    include: {
      contact: {
        select: { email: true, consentEmail: true },
      },
    },
  });

  if (!notification) notFound();

  // Already consented
  if (notification.emailConsented || notification.contact.consentEmail) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-teal-600 px-8 py-6 text-white">
              <h1 className="text-2xl font-bold">Email Already Approved</h1>
              <p className="text-teal-200 mt-1">Retail Gift Aid Communications</p>
            </div>
            <div className="p-8">
              <p className="text-gray-700">
                Thank you, {notification.contactName}! You have already approved
                email communications. We will send future Gift Aid notifications
                to your email address, saving printing and postage costs.
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
          <div className="bg-teal-600 px-8 py-6 text-white">
            <h1 className="text-2xl font-bold">Go Paperless</h1>
            <p className="text-teal-200 mt-1">
              Receive Gift Aid notifications by email
            </p>
          </div>

          <div className="p-8 space-y-6">
            <p className="text-gray-700">
              Hi {notification.contactName}, currently we send you a printed
              letter each year about your Retail Gift Aid. By switching to email,
              you can help {charityName} save on printing and postage costs — money
              that goes directly to our charitable work.
            </p>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h3 className="font-semibold text-teal-900 text-sm mb-2">
                By approving email communications, you agree to:
              </h3>
              <ul className="text-sm text-teal-800 space-y-1 ml-4 list-disc">
                <li>
                  Receive your annual Retail Gift Aid notification by email instead
                  of post
                </li>
                <li>
                  Receive any updates about your Gift Aid declarations by email
                </li>
              </ul>
              <p className="text-xs text-teal-700 mt-3">
                You can withdraw this consent at any time by contacting the
                charity.
              </p>
            </div>

            <EmailConsentForm
              token={token}
              contactName={notification.contactName}
              contactEmail={notification.contactEmail || ""}
            />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This is a secure page. Your consent will be recorded for compliance
          purposes.
        </p>
      </div>
    </div>
  );
}
