import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RetailGiftAidForm } from "./retail-form";

export default async function RetailGiftAidPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const shop = await prisma.shop.findUnique({
    where: { qrToken: token },
  });

  if (!shop || !shop.isActive) notFound();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 px-8 py-6 text-white">
            <h1 className="text-2xl font-bold">Retail Gift Aid Declaration</h1>
            <p className="text-purple-200 mt-1">
              Gift Aid the proceeds from your donated goods
            </p>
            <p className="text-purple-200 text-sm mt-2">
              {shop.name}
              {(shop.city || shop.postcode) && (
                <span>
                  {" — "}
                  {[shop.city, shop.postcode].filter(Boolean).join(", ")}
                </span>
              )}
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* HMRC-compliant declaration text */}
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Retail Gift Aid Declaration
              </p>
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
                <li>
                  - The charity will send you an annual statement of the amounts
                  raised from the sale of your donated goods.
                </li>
              </ul>
            </div>

            {/* Interactive form — client component */}
            <RetailGiftAidForm shopToken={token} shopName={shop.name} />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This is a secure digital Retail Gift Aid declaration form. Your
          information is recorded for HMRC compliance purposes including your
          name, the date, and your IP address.
        </p>
      </div>
    </div>
  );
}
