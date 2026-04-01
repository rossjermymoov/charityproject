import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Calendar, Plus } from "lucide-react";
import { getNextClaimReference } from "@/lib/hmrc";
import { createClaim } from "../actions";

export default async function NewGiftAidClaimPage() {
  await requireAuth();

  const now = new Date();
  const currentYear = now.getFullYear();
  const defaultPeriodStart = new Date(currentYear, 3, 1); // 1 April (UK tax year)
  const defaultPeriodEnd = new Date(currentYear, now.getMonth(), now.getDate());

  // Get count of claims in current year for reference generation
  const claimsInYear = await prisma.giftAidClaim.count({
    where: {
      createdAt: {
        gte: new Date(currentYear, 0, 1),
        lt: new Date(currentYear + 1, 0, 1),
      },
    },
  });

  const nextReference = getNextClaimReference(currentYear, claimsInYear);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/finance" className="hover:text-gray-700">
            Finance
          </Link>
          <span>/</span>
          <Link href="/finance/gift-aid" className="hover:text-gray-700">
            Gift Aid
          </Link>
          <span>/</span>
          <Link href="/finance/gift-aid/claims" className="hover:text-gray-700">
            Claims
          </Link>
          <span>/</span>
          <span>New Claim</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/finance/gift-aid/claims" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Gift Aid Claim</h1>
            <p className="text-gray-500 mt-1">
              Create a new claim and find eligible donations
            </p>
          </div>
        </div>
      </div>

      {/* Create Claim Form */}
      <Card>
        <CardContent className="pt-6">
          <form action={createClaim} className="space-y-6">
            {/* Auto-generated Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Claim Reference
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <code className="font-mono font-bold text-lg text-gray-900">
                  {nextReference}
                </code>
              </div>
              <input type="hidden" name="reference" value={nextReference} />
              <p className="text-xs text-gray-500 mt-2">
                Auto-generated in the format GA-YYYY-NNN
              </p>
            </div>

            {/* Period Selection */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Period Start"
                name="periodStart"
                type="date"
                defaultValue={defaultPeriodStart.toISOString().split("T")[0]}
                required
              />
              <Input
                label="Period End"
                name="periodEnd"
                type="date"
                defaultValue={defaultPeriodEnd.toISOString().split("T")[0]}
                required
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Link href="/finance/gift-aid/claims">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                <Plus className="h-4 w-4" /> Create Claim
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex gap-3">
              <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">How to create a claim:</p>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1 mt-2">
                  <li>Set the period start and end dates</li>
                  <li>Click "Create Claim" to generate the reference</li>
                  <li>
                    The system will automatically find all eligible donations in that period
                  </li>
                  <li>
                    Review the eligible donations and make any adjustments if needed
                  </li>
                  <li>Mark as "Ready" to prepare for submission</li>
                  <li>Submit to HMRC when you're ready</li>
                </ol>
              </div>
            </div>
            <div className="text-xs text-blue-800 pt-3 border-t border-blue-200">
              <p className="font-medium mb-1">Eligible donations must have:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>isGiftAidable = true</li>
                <li>Donation date within the selected period</li>
                <li>Donor with an active Gift Aid declaration</li>
                <li>Not already included in another claim</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
