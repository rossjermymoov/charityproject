import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!contact) notFound();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        {contact.firstName} {contact.lastName}
      </h1>
      <p>Contact ID: {contact.id}</p>
    </div>
  );
}
