import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Palette,
  Settings,
  Package,
  PoundSterling,
  Heart,
  GripVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { logAudit } from "@/lib/audit";
import { CopyLinkButton } from "@/components/ui/copy-link-button";

export default async function EventRegistrationFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      registrationForm: {
        include: {
          items: { orderBy: { sortOrder: "asc" } },
          orders: { select: { id: true } },
        },
      },
    },
  });

  if (!event) notFound();

  const form = event.registrationForm;
  const publicUrl = `/register/${form?.id || ""}`;
  const orderCount = form?.orders.length || 0;

  // Create or update the registration form
  async function saveForm(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const data = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      logoUrl: (formData.get("logoUrl") as string) || null,
      primaryColor: (formData.get("primaryColor") as string) || "#4F46E5",
      accentColor: (formData.get("accentColor") as string) || "#10B981",
      headerText: (formData.get("headerText") as string) || null,
      thankYouMessage: (formData.get("thankYouMessage") as string) || null,
      isActive: formData.get("isActive") === "on",
      requiresPayment: formData.get("requiresPayment") === "on",
      allowDonations: formData.get("allowDonations") === "on",
      collectPhone: formData.get("collectPhone") === "on",
      collectAddress: formData.get("collectAddress") === "on",
      giftAidEnabled: formData.get("giftAidEnabled") === "on",
      stripeEnabled: formData.get("stripeEnabled") === "on",
      goCardlessEnabled: formData.get("goCardlessEnabled") === "on",
    };

    const existing = await prisma.eventRegistrationForm.findUnique({
      where: { eventId: id },
    });

    if (existing) {
      await prisma.eventRegistrationForm.update({
        where: { id: existing.id },
        data,
      });
      await logAudit({
        userId: session.id,
        action: "UPDATE",
        entityType: "EventRegistrationForm",
        entityId: existing.id,
      });
    } else {
      const created = await prisma.eventRegistrationForm.create({
        data: { ...data, eventId: id },
      });
      await logAudit({
        userId: session.id,
        action: "CREATE",
        entityType: "EventRegistrationForm",
        entityId: created.id,
      });
    }

    redirect(`/events/${id}/registration`);
  }

  // Add a form item
  async function addItem(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    let regForm = await prisma.eventRegistrationForm.findUnique({
      where: { eventId: id },
    });

    if (!regForm) {
      regForm = await prisma.eventRegistrationForm.create({
        data: { eventId: id, title: `${event!.name} Registration` },
      });
    }

    const itemCount = await prisma.eventFormItem.count({
      where: { formId: regForm.id },
    });

    const price = formData.get("price") as string;
    const options = (formData.get("options") as string)?.trim() || null;

    await prisma.eventFormItem.create({
      data: {
        formId: regForm.id,
        name: formData.get("name") as string,
        description: (formData.get("itemDescription") as string) || null,
        type: formData.get("type") as string,
        price: price ? parseFloat(price) : null,
        isRequired: formData.get("isRequired") === "on",
        isGiftAidEligible: formData.get("isGiftAidEligible") === "on",
        maxQuantity: formData.get("maxQuantity")
          ? parseInt(formData.get("maxQuantity") as string)
          : null,
        options,
        imageUrl: (formData.get("imageUrl") as string)?.trim() || null,
        sortOrder: itemCount,
      },
    });

    await logAudit({
      userId: session.id,
      action: "CREATE",
      entityType: "EventFormItem",
      entityId: regForm.id,
    });

    redirect(`/events/${id}/registration`);
  }

  // Delete a form item
  async function deleteItem(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const itemId = formData.get("itemId") as string;
    await prisma.eventFormItem.delete({ where: { id: itemId } });
    await logAudit({
      userId: session.id,
      action: "DELETE",
      entityType: "EventFormItem",
      entityId: itemId,
    });

    redirect(`/events/${id}/registration`);
  }

  const typeIcons: Record<string, typeof PoundSterling> = {
    REGISTRATION_FEE: PoundSterling,
    MERCHANDISE: Package,
    DONATION: Heart,
  };

  const typeColors: Record<string, string> = {
    REGISTRATION_FEE: "bg-blue-100 text-blue-800",
    MERCHANDISE: "bg-purple-100 text-purple-800",
    DONATION: "bg-green-100 text-green-800",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/events/${id}`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Registration Form
            </h1>
            <p className="text-sm text-gray-500">{event.name}</p>
          </div>
        </div>
        {form && (
          <div className="flex items-center gap-2">
            <Badge className={form.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {form.isActive ? "Live" : "Inactive"}
            </Badge>
            <span className="text-sm text-gray-500">{orderCount} registrations</span>
          </div>
        )}
      </div>

      {/* Public URL */}
      {form && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-900">
                  Public Registration Link
                </p>
                <p className="text-sm text-indigo-700 font-mono mt-1">
                  /register/{form.id}
                </p>
              </div>
              <div className="flex gap-2">
                <CopyLinkButton path={publicUrl} />
                <Link href={publicUrl} target="_blank">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Form Settings & Branding
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <form action={saveForm} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Form Title"
                name="title"
                defaultValue={form?.title || `${event.name} Registration`}
                required
              />
              <Input
                label="Logo URL"
                name="logoUrl"
                defaultValue={form?.logoUrl || ""}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <Textarea
              label="Description"
              name="description"
              defaultValue={form?.description || ""}
              placeholder="Describe the event and what registrants should expect..."
            />

            <Input
              label="Header Text"
              name="headerText"
              defaultValue={form?.headerText || ""}
              placeholder="e.g., Join us for an unforgettable night!"
            />

            <Textarea
              label="Thank You Message"
              name="thankYouMessage"
              defaultValue={form?.thankYouMessage || ""}
              placeholder="Message shown after successful registration..."
            />

            {/* Colours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Colour
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="primaryColor"
                    defaultValue={form?.primaryColor || "#4F46E5"}
                    className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">
                    Buttons & headings
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accent Colour
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="accentColor"
                    defaultValue={form?.accentColor || "#10B981"}
                    className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">
                    Highlights & success
                  </span>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={form?.isActive ?? true}
                  className="rounded border-gray-300"
                />
                Form is live
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="requiresPayment"
                  defaultChecked={form?.requiresPayment ?? true}
                  className="rounded border-gray-300"
                />
                Requires payment
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="allowDonations"
                  defaultChecked={form?.allowDonations ?? true}
                  className="rounded border-gray-300"
                />
                Allow donations
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="collectPhone"
                  defaultChecked={form?.collectPhone ?? true}
                  className="rounded border-gray-300"
                />
                Collect phone number
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="collectAddress"
                  defaultChecked={form?.collectAddress ?? false}
                  className="rounded border-gray-300"
                />
                Collect address
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="giftAidEnabled"
                  defaultChecked={form?.giftAidEnabled ?? true}
                  className="rounded border-gray-300"
                />
                Gift Aid prompt
              </label>
            </div>

            {/* Payment Gateways */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Payment Gateways
              </p>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="stripeEnabled"
                    defaultChecked={form?.stripeEnabled ?? false}
                    className="rounded border-gray-300"
                  />
                  Stripe (Cards, Apple Pay)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="goCardlessEnabled"
                    defaultChecked={form?.goCardlessEnabled ?? false}
                    className="rounded border-gray-300"
                  />
                  GoCardless (Direct Debit)
                </label>
              </div>
            </div>

            <Button type="submit">
              {form ? "Save Settings" : "Create Registration Form"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Form Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Form Items
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              Registration fees, merchandise, and donation options
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {/* Existing items */}
          {form?.items && form.items.length > 0 ? (
            <div className="space-y-3 mb-6">
              {form.items.map((item) => {
                const Icon = typeIcons[item.type] || Package;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <Icon className="h-5 w-5 text-gray-600" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <Badge className={typeColors[item.type] || ""}>
                          {item.type.replace("_", " ")}
                        </Badge>
                        {item.isRequired && (
                          <Badge className="bg-red-100 text-red-800">
                            Required
                          </Badge>
                        )}
                        {item.isGiftAidEligible && (
                          <Badge className="bg-amber-100 text-amber-800">
                            Gift Aid Eligible
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.description}
                        </p>
                      )}
                      {item.options && (
                        <p className="text-xs text-gray-400 mt-1">
                          Options: {item.options}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {item.price != null ? (
                        <p className="text-sm font-bold text-gray-900">
                          £{item.price.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Custom amount
                        </p>
                      )}
                    </div>
                    <form action={deleteItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4 mb-4">
              No items yet. Add your first item below.
            </p>
          )}

          {/* Add item form */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Add New Item
            </h4>
            <form action={addItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="REGISTRATION_FEE">Registration Fee</option>
                    <option value="MERCHANDISE">Merchandise</option>
                    <option value="DONATION">Donation (custom amount)</option>
                  </select>
                </div>
                <Input
                  label="Item Name"
                  name="name"
                  placeholder="e.g., Adult Entry, T-Shirt, Donation"
                  required
                />
                <Input
                  label="Price (£)"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Leave blank for donations"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Description (optional)"
                  name="itemDescription"
                  placeholder="Brief description of this item"
                />
                <Input
                  label="Options / Variants"
                  name="options"
                  placeholder='e.g., S, M, L, XL or Red, Blue'
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Max Quantity (stock limit)"
                  name="maxQuantity"
                  type="number"
                  min="0"
                  placeholder="Leave blank for unlimited"
                />
                <Input
                  label="Image URL"
                  name="imageUrl"
                  placeholder="https://example.com/tshirt.jpg"
                />
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm pb-2">
                    <input
                      type="checkbox"
                      name="isRequired"
                      className="rounded border-gray-300"
                    />
                    Required
                  </label>
                  <label className="flex items-center gap-2 text-sm pb-2">
                    <input
                      type="checkbox"
                      name="isGiftAidEligible"
                      className="rounded border-gray-300"
                    />
                    Gift Aid Eligible
                  </label>
                </div>
              </div>
              <Button type="submit" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Orders list link */}
      {form && orderCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {orderCount} registration{orderCount !== 1 ? "s" : ""} received
                </p>
                <p className="text-sm text-gray-500">
                  View all registrations and payment status
                </p>
              </div>
              <Link href={`/events/${id}/registration/orders`}>
                <Button variant="outline" size="sm">
                  View Orders
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
