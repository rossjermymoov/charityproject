"use server";

import { requireAuth, requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function saveHmrcSettings(formData: FormData) {
  const session = await requireAuth();
  await requireRole(["ADMIN"]);

  const hmrcCharityRef = (formData.get("hmrcCharityRef") as string) || null;
  const hmrcGatewayUser = (formData.get("hmrcGatewayUser") as string) || null;
  const hmrcGatewayPassword = (formData.get("hmrcGatewayPassword") as string) || null;
  const hmrcSenderId = (formData.get("hmrcSenderId") as string) || null;
  const hmrcEnabled = formData.get("hmrcEnabled") === "on";

  // Validate that if enabled, all required fields are provided
  if (hmrcEnabled) {
    if (!hmrcCharityRef || !hmrcGatewayUser || !hmrcGatewayPassword) {
      redirect("/settings/integrations/hmrc?error=missing-required-fields");
    }
  }

  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {
      hmrcCharityRef,
      hmrcGatewayUser,
      hmrcGatewayPassword,
      hmrcSenderId,
      hmrcEnabled,
    },
    create: {
      id: "default",
      hmrcCharityRef,
      hmrcGatewayUser,
      hmrcGatewayPassword,
      hmrcSenderId,
      hmrcEnabled,
    },
  });

  revalidatePath("/settings/integrations/hmrc");
  redirect("/settings/integrations/hmrc");
}
