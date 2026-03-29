import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Store, Plus, QrCode, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { QRCodeDisplay } from "@/components/ui/qr-code";
import { headers } from "next/headers";
import crypto from "crypto";

export default async function ShopsSettingsPage() {
  const user = await requireRole(["ADMIN"]);

  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: true },
  });

  // Get the base URL from the request
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  async function createShop(formData: FormData) {
    "use server";
    const session = await requireRole(["ADMIN"]);

    const name = (formData.get("name") as string)?.trim();
    if (!name) return;

    const qrToken = crypto.randomBytes(16).toString("hex");

    await prisma.shop.create({
      data: {
        name,
        address: (formData.get("address") as string) || null,
        city: (formData.get("city") as string) || null,
        postcode: (formData.get("postcode") as string) || null,
        qrToken,
        createdById: session.id,
      },
    });

    revalidatePath("/settings/shops");
    redirect("/settings/shops");
  }

  async function deleteShop(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);

    const shopId = formData.get("shopId") as string;
    await prisma.shop.delete({ where: { id: shopId } });

    revalidatePath("/settings/shops");
    redirect("/settings/shops");
  }

  async function toggleShop(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);

    const shopId = formData.get("shopId") as string;
    const current = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!current) return;

    await prisma.shop.update({
      where: { id: shopId },
      data: { isActive: !current.isActive },
    });

    revalidatePath("/settings/shops");
    redirect("/settings/shops");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shops & Locations</h1>
          <p className="text-gray-500 mt-1">Manage shop locations for Retail Gift Aid QR codes</p>
        </div>
      </div>

      {/* How it works */}
      <Card className="bg-purple-50 border-purple-100">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <QrCode className="h-6 w-6 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-purple-900 mb-1">How Retail Gift Aid QR Codes Work</p>
              <p className="text-sm text-purple-800">
                Each shop gets a unique QR code. Print it and display it in-store. When a customer scans it, they can sign a Retail Gift Aid declaration on their phone. If they are already a contact (matched by email), the declaration links to their existing record. New customers are added automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add new shop */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Add New Shop</h3>
          </div>
        </CardHeader>
        <CardContent>
          <form action={createShop} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Shop Name" name="name" required placeholder="e.g. High Street Shop" />
              <Input label="Address" name="address" placeholder="123 High Street" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" name="city" placeholder="e.g. London" />
              <Input label="Postcode" name="postcode" placeholder="e.g. SW1A 1AA" />
            </div>
            <Button type="submit">
              <Store className="h-4 w-4 mr-2" />
              Add Shop & Generate QR Code
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing shops */}
      {shops.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Shops</h3>
          {shops.map((shop) => {
            const qrUrl = `${baseUrl}/retail-gift-aid/${shop.qrToken}`;
            return (
              <Card key={shop.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-6">
                    {/* QR Code */}
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      <QRCodeDisplay url={qrUrl} size={160} />
                      <p className="text-[10px] text-gray-400 text-center max-w-[160px] break-all">
                        {qrUrl}
                      </p>
                    </div>

                    {/* Shop details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold text-gray-900">{shop.name}</h4>
                          <Badge className={shop.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {shop.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <form action={toggleShop}>
                            <input type="hidden" name="shopId" value={shop.id} />
                            <Button type="submit" variant="outline" size="sm">
                              {shop.isActive ? "Disable" : "Enable"}
                            </Button>
                          </form>
                          <form action={deleteShop}>
                            <input type="hidden" name="shopId" value={shop.id} />
                            <ConfirmButton message={`Delete ${shop.name}? This cannot be undone.`} variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </ConfirmButton>
                          </form>
                        </div>
                      </div>

                      {(shop.address || shop.city || shop.postcode) && (
                        <p className="text-sm text-gray-600">
                          {[shop.address, shop.city, shop.postcode].filter(Boolean).join(", ")}
                        </p>
                      )}

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">QR Code URL</p>
                        <code className="text-xs text-gray-700 break-all">{qrUrl}</code>
                      </div>

                      <p className="text-xs text-gray-400">
                        Created by {shop.createdBy.name} on {shop.createdAt.toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
