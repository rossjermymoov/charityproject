import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Repeat, PoundSterling, Bell } from "lucide-react";

export default async function GoCardlessPage() {
  await requireAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">Settings</Link>
          <span>/</span>
          <Link href="/settings/integrations" className="hover:text-gray-700">Integrations</Link>
          <span>/</span>
          <span>GoCardless</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings/integrations" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GoCardless</h1>
            <p className="text-gray-500 mt-1">
              Collect recurring donations via Direct Debit
            </p>
          </div>
        </div>
      </div>

      {/* Connection Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <svg className="h-10 w-10 flex-shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="#1D1D3F" />
              <text x="24" y="31" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#2FCFA5">GC</text>
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900">Connect GoCardless</h3>
              <p className="text-sm text-gray-600 mt-1">
                Set up Direct Debit collection for recurring donations. GoCardless handles the bank mandates and payment collection automatically.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input label="Access Token" name="gcAccessToken" type="password" placeholder="live_xxxxxxxxxxxxxxxxxxxxxxxx" />
            <Input label="Webhook Secret" name="gcWebhookSecret" type="password" placeholder="xxxxxxxxxxxxxxxxxxxxxxxx" />
            <p className="text-xs text-gray-500">
              Find your access token at{" "}
              <a href="https://manage.gocardless.com/developers" target="_blank" rel="noopener" className="text-indigo-600 underline">
                GoCardless → Developers → Create → Access Token
              </a>
            </p>
          </div>

          <div className="flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Connect GoCardless
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <Repeat className="h-6 w-6 text-indigo-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Recurring Donations</h4>
          <p className="text-xs text-gray-500 mt-1">Collect monthly, quarterly, or annual donations via UK Direct Debit or SEPA</p>
        </Card>
        <Card className="p-5">
          <PoundSterling className="h-6 w-6 text-indigo-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Low Fees</h4>
          <p className="text-xs text-gray-500 mt-1">Direct Debit charges are typically 1-2% — significantly lower than card payments</p>
        </Card>
        <Card className="p-5">
          <Bell className="h-6 w-6 text-indigo-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Auto Reconciliation</h4>
          <p className="text-xs text-gray-500 mt-1">Payments are matched to donors and recorded in your finance module automatically</p>
        </Card>
      </div>
    </div>
  );
}
