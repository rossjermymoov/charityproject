"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { testEmailProvider } from "@/lib/email-providers";

export async function addEmailProvider(formData: FormData) {
  const session = await requireAuth();

  const provider = formData.get("provider") as string;
  const name = formData.get("name") as string;
  const fromEmail = formData.get("fromEmail") as string;
  const fromName = formData.get("fromName") as string;
  const replyToEmail = (formData.get("replyToEmail") as string) || null;
  const returnTo = (formData.get("returnTo") as string) || "/settings/integrations";

  const data: any = {
    name,
    provider,
    fromEmail,
    fromName,
    replyToEmail,
    createdById: session.id,
  };

  if (provider === "SENDGRID") {
    data.apiKey = formData.get("apiKey") as string;
  } else if (provider === "SES") {
    data.accessKeyId = formData.get("accessKeyId") as string;
    data.secretAccessKey = formData.get("secretAccessKey") as string;
    data.region = formData.get("region") as string;
  } else if (provider === "MAILGUN") {
    data.apiKey = formData.get("apiKey") as string;
    data.domain = formData.get("domain") as string;
    data.region = formData.get("mgRegion") as string || "US";
  } else if (provider === "MAILCHIMP") {
    data.apiKey = formData.get("apiKey") as string;
  } else if (provider === "DOTDIGITAL") {
    data.apiKey = formData.get("apiKey") as string; // API user email
    data.domain = formData.get("domain") as string; // API password
    data.region = formData.get("region") as string || "r1";
  }

  // If no other providers exist, make this the default
  const existingCount = await prisma.emailProvider.count();
  if (existingCount === 0) {
    data.isDefault = true;
  }

  await prisma.emailProvider.create({ data });
  redirect(returnTo);
}

export async function removeEmailProvider(formData: FormData) {
  await requireAuth();
  const id = formData.get("id") as string;
  const returnTo = (formData.get("returnTo") as string) || "/settings/integrations";
  await prisma.emailProvider.delete({ where: { id } });
  revalidatePath(returnTo);
}

export async function setDefaultProvider(formData: FormData) {
  await requireAuth();
  const id = formData.get("id") as string;
  const returnTo = (formData.get("returnTo") as string) || "/settings/integrations";

  await prisma.emailProvider.updateMany({
    where: { isDefault: true },
    data: { isDefault: false },
  });

  await prisma.emailProvider.update({
    where: { id },
    data: { isDefault: true },
  });

  revalidatePath(returnTo);
}

export async function sendTestEmail(formData: FormData) {
  await requireAuth();
  const id = formData.get("id") as string;
  const returnTo = (formData.get("returnTo") as string) || "/settings/integrations";

  const provider = await prisma.emailProvider.findUnique({ where: { id } });
  if (!provider) return;

  const result = await testEmailProvider(provider);

  await prisma.emailProvider.update({
    where: { id },
    data: {
      lastTestedAt: new Date(),
      lastTestResult: result.success ? "success" : result.error || "Unknown error",
    },
  });

  revalidatePath(returnTo);
}
