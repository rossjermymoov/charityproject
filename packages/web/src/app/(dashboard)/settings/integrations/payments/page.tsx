import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CreditCard, ShieldCheck, Globe } from "lucide-react";

export default async function PaymentProvidersPage() {
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
          <span>Payment Providers</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings/integrations" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Providers</h1>
            <p className="text-gray-500 mt-1">
              Accept online donations via Stripe and other payment gateways
            </p>
          </div>
        </div>
      </div>

      {/* Stripe Connection */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <svg className="h-10 w-10 flex-shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="#635BFF" />
              <path d="M22.5 18.3c0-1.2 1-1.7 2.5-1.7 2.2 0 5 .7 7.2 1.9V12c-2.4-1-4.8-1.3-7.2-1.3-5.9 0-9.8 3.1-9.8 8.2 0 8 11 6.7 11 10.2 0 1.4-1.2 1.9-2.9 1.9-2.5 0-5.7-1-8.2-2.4v6.6c2.8 1.2 5.6 1.7 8.2 1.7 6 0 10.2-3 10.2-8.2C33.5 20.2 22.5 21.7 22.5 18.3z" fill="#fff" />
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900">Stripe</h3>
              <p className="text-sm text-gray-600 mt-1">
                Accept card payments, Apple Pay, and Google Pay for online donations
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Publishable Key" name="stripePublishableKey" type="password" placeholder="pk_live_..." />
              <Input label="Secret Key" name="stripeSecretKey" type="password" placeholder="sk_live_..." />
            </div>
            <Input label="Webhook Secret" name="stripeWebhookSecret" type="password" placeholder="whsec_..." />
            <p className="text-xs text-gray-500">
              Find your API keys at{" "}
              <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener" className="text-indigo-600 underline">
                Stripe Dashboard → Developers → API keys
              </a>
            </p>
          </div>

          <div className="flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Connect Stripe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <CreditCard className="h-6 w-6 text-indigo-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Card Payments</h4>
          <p className="text-xs text-gray-500 mt-1">Accept Visa, Mastercard, Amex and digital wallet payments for one-off and recurring donations</p>
        </Card>
        <Card className="p-5">
          <ShieldCheck className="h-6 w-6 text-indigo-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">PCI Compliant</h4>
          <p className="text-xs text-gray-500 mt-1">Stripe handles all card data so CharityOS never stores sensitive payment information</p>
        </Card>
        <Card className="p-5">
          <Globe className="h-6 w-6 text-indigo-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Gift Aid Compatible</h4>
          <p className="text-xs text-gray-500 mt-1">Donations are linked to contact records for seamless Gift Aid declarations</p>
        </Card>
      </div>
    </div>
  );
}
