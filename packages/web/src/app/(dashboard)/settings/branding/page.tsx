import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Palette } from "lucide-react";
import { BrandingPreview } from "./branding-preview";

export default async function BrandingPage() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") redirect("/");

  const settings = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  async function saveBranding(formData: FormData) {
    "use server";
    const session = await requireAuth();
    if (session.role !== "ADMIN") redirect("/");

    const orgName = (formData.get("orgName") as string) || null;
    const logoUrl = (formData.get("logoUrl") as string) || null;
    const primaryColour = (formData.get("primaryColour") as string) || "#4f46e5";
    const sidebarColour = (formData.get("sidebarColour") as string) || "#111827";
    const sidebarTextColour = (formData.get("sidebarTextColour") as string) || "#d1d5db";

    await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {
        orgName,
        logoUrl,
        primaryColour,
        sidebarColour,
        sidebarTextColour,
      },
      create: {
        id: "default",
        orgName,
        logoUrl,
        primaryColour,
        sidebarColour,
        sidebarTextColour,
      },
    });

    redirect("/settings/branding");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">Settings</Link>
          <span>/</span>
          <span>Branding</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">White Label Branding</h1>
            <p className="text-gray-500 mt-1">
              Customise the look and feel of the system to match your organisation
            </p>
          </div>
        </div>
      </div>

      <form action={saveBranding} className="space-y-6">
        {/* Organisation Identity */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Palette className="h-5 w-5" /> Organisation Identity
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Organisation Name"
                name="orgName"
                defaultValue={settings.orgName || ""}
                placeholder="Your Charity Name"
              />
              <Input
                label="Logo URL"
                name="logoUrl"
                defaultValue={settings.logoUrl || ""}
                placeholder="/uploads/logo.png or https://..."
              />
            </div>
            <p className="text-xs text-gray-500">
              The organisation name replaces &quot;CharityOS&quot; in the sidebar. The logo appears next to it.
              Upload your logo to your hosting and paste the URL, or use a relative path.
            </p>
          </CardContent>
        </Card>

        {/* Colour Settings */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Brand Colours</h2>
            <p className="text-sm text-gray-500">
              Set your primary brand colour — this will be used for buttons, links, active states, and accents throughout the system.
              Choose colours using the picker, or enter values as HEX, RGB, or HSL.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Colour */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Primary Colour</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="primaryColour"
                    defaultValue={settings.primaryColour}
                    className="h-12 w-12 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    name="primaryColourText"
                    defaultValue={settings.primaryColour}
                    placeholder="#4f46e5"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-gray-500">Buttons, links, active indicators, accents</p>
              </div>

              {/* Sidebar Background */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Sidebar Background</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="sidebarColour"
                    defaultValue={settings.sidebarColour}
                    className="h-12 w-12 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    name="sidebarColourText"
                    defaultValue={settings.sidebarColour}
                    placeholder="#111827"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-gray-500">Navigation sidebar background</p>
              </div>

              {/* Sidebar Text */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Sidebar Text</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="sidebarTextColour"
                    defaultValue={settings.sidebarTextColour}
                    className="h-12 w-12 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    name="sidebarTextColourText"
                    defaultValue={settings.sidebarTextColour}
                    placeholder="#d1d5db"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-gray-500">Navigation link and label text</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
            <BrandingPreview
              defaultPrimary={settings.primaryColour}
              defaultSidebar={settings.sidebarColour}
              defaultSidebarText={settings.sidebarTextColour}
              defaultOrgName={settings.orgName || "CharityOS"}
            />
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Changes will take effect immediately for all users after saving.
          </p>
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
            Save Branding
          </Button>
        </div>
      </form>
    </div>
  );
}
