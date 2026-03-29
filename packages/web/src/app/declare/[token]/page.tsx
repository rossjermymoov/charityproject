import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { DeclarationForm } from "./declaration-form";

export default async function DigitalDeclarationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const giftAid = await prisma.giftAid.findUnique({
    where: { digitalToken: token },
    include: { contact: true },
  });

  if (!giftAid) notFound();

  const isRetail = giftAid.type === "RETAIL";

  // Already signed
  if (giftAid.digitalSignedAt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Declaration Already Completed
          </h1>
          <p className="text-gray-600">
            This {isRetail ? "Retail " : ""}Gift Aid declaration was signed by{" "}
            <strong>{giftAid.digitalSignedName}</strong> on{" "}
            {formatDate(giftAid.digitalSignedAt)}.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Thank you for your support. If you need to make changes, please
            contact the charity directly.
          </p>
        </div>
      </div>
    );
  }

  // Expired or cancelled
  if (giftAid.status !== "ACTIVE") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Declaration No Longer Available
          </h1>
          <p className="text-gray-600">
            This Gift Aid declaration link is no longer active. Please contact
            the charity if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className={`${isRetail ? "bg-purple-600" : "bg-indigo-600"} px-8 py-6 text-white`}>
            <h1 className="text-2xl font-bold">
              {isRetail ? "Retail Gift Aid Declaration" : "Gift Aid Declaration"}
            </h1>
            <p className={`${isRetail ? "text-purple-200" : "text-indigo-200"} mt-1`}>
              {isRetail
                ? "Gift Aid the proceeds from your donated goods"
                : "Boost your donation by 25p for every £1 you give"}
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Donor info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Declaration for</p>
              <p className="text-lg font-semibold text-gray-900">
                {giftAid.contact.firstName} {giftAid.contact.lastName}
              </p>
              {giftAid.contact.addressLine1 && (
                <p className="text-sm text-gray-600 mt-1">
                  {[
                    giftAid.contact.addressLine1,
                    giftAid.contact.city,
                    giftAid.contact.postcode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>

            {/* HMRC-compliant declaration text */}
            <div className={`border-l-4 ${isRetail ? "border-purple-500" : "border-indigo-500"} pl-4 py-2`}>
              <p className="text-sm font-semibold text-gray-900 mb-2">
                {isRetail ? "Retail Gift Aid Declaration" : "Gift Aid Declaration"}
              </p>
              {isRetail ? (
                <>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    I want to Gift Aid the proceeds from the sale of any goods I
                    donate to this charity. I authorise the charity to act as my
                    agent in selling my donated goods, and I agree to a commission
                    for this service. I confirm that I own the goods I am donating
                    and I am not acting as a business in selling them.
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed mt-2">
                    I am a UK taxpayer and understand that if I pay less Income Tax
                    and/or Capital Gains Tax than the amount of Gift Aid claimed on
                    all my donations in that tax year it is my responsibility to pay
                    any difference.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    I want to Gift Aid my donation and any donations I make in the
                    future or have made in the past 4 years to this charity.
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed mt-2">
                    I am a UK taxpayer and understand that if I pay less Income Tax
                    and/or Capital Gains Tax than the amount of Gift Aid claimed on
                    all my donations in that tax year it is my responsibility to pay
                    any difference.
                  </p>
                </>
              )}
            </div>

            {/* Important notes */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-900 mb-2">
                Please note:
              </p>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>
                  - You can cancel this declaration at any time by notifying the
                  charity.
                </li>
                <li>
                  - If your circumstances change and you no longer pay sufficient
                  tax, please notify the charity.
                </li>
                <li>
                  - Gift Aid is reclaimed by the charity from the tax you pay for
                  the current tax year.
                </li>
                {isRetail ? (
                  <li>
                    - The charity will send you an annual statement of the amounts
                    raised from the sale of your donated goods.
                  </li>
                ) : (
                  <li>
                    - If you pay Income Tax at the higher or additional rate and want
                    to receive the additional tax relief due to you, you must include
                    all your Gift Aid donations on your Self-Assessment tax return or
                    ask HM Revenue and Customs to adjust your tax code.
                  </li>
                )}
              </ul>
            </div>

            {/* Signature form — client component */}
            <DeclarationForm
              token={token}
              contactName={`${giftAid.contact.firstName} ${giftAid.contact.lastName}`}
              isRetail={isRetail}
            />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This is a secure digital {isRetail ? "Retail " : ""}Gift Aid declaration form. Your information
          is recorded for HMRC compliance purposes including your name, the date,
          and your IP address.
        </p>
      </div>
    </div>
  );
}
