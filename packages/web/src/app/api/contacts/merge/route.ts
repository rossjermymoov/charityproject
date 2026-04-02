import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { primaryId, secondaryId, fieldChoices } = body;

    if (!primaryId || !secondaryId) {
      return NextResponse.json(
        { error: "primaryId and secondaryId are required" },
        { status: 400 }
      );
    }

    if (primaryId === secondaryId) {
      return NextResponse.json(
        { error: "Cannot merge a contact with itself" },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get both contacts
      const primaryContact = await tx.contact.findUnique({
        where: { id: primaryId },
      });
      const secondaryContact = await tx.contact.findUnique({
        where: { id: secondaryId },
      });

      if (!primaryContact || !secondaryContact) {
        throw new Error("One or both contacts not found");
      }

      // 2. Merge field values based on user's choices or keep primary's data
      const mergedData: Record<string, any> = {};

      if (fieldChoices) {
        // User specified which fields to keep
        for (const [field, choice] of Object.entries(fieldChoices)) {
          if (choice === "primary") {
            mergedData[field] = (primaryContact as any)[field];
          } else if (choice === "secondary") {
            mergedData[field] = (secondaryContact as any)[field];
          }
        }
      }

      // Fill in blanks from secondary if not chosen
      const fieldsToMerge = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "addressLine1",
        "addressLine2",
        "city",
        "postcode",
        "country",
        "dateOfBirth",
      ];

      for (const field of fieldsToMerge) {
        if (mergedData[field] === undefined) {
          // Use choice if available, otherwise prefer primary, fill blanks from secondary
          const primaryValue = (primaryContact as any)[field];
          const secondaryValue = (secondaryContact as any)[field];
          mergedData[field] = primaryValue || secondaryValue;
        }
      }

      // 3. Update primary contact with merged data
      await tx.contact.update({
        where: { id: primaryId },
        data: mergedData,
      });

      // 4. Transfer donations
      await tx.donation.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      });

      // 5. Transfer notes
      await tx.note.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      });

      // 6. Transfer interactions
      await tx.interaction.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      });

      // 7. Transfer tags (avoid duplicates)
      const existingTags = await tx.contactTag.findMany({
        where: { contactId: primaryId },
        select: { tagId: true },
      });
      const existingTagIds = new Set(existingTags.map((ct) => ct.tagId));

      const secondaryTags = await tx.contactTag.findMany({
        where: { contactId: secondaryId },
      });

      for (const tag of secondaryTags) {
        if (!existingTagIds.has(tag.tagId)) {
          await tx.contactTag.create({
            data: {
              contactId: primaryId,
              tagId: tag.tagId,
            },
          });
        }
      }

      // Delete secondary contact's original tags
      await tx.contactTag.deleteMany({
        where: { contactId: secondaryId },
      });

      // 8. Transfer event attendees
      await tx.eventAttendee.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      });

      // 9. Transfer gift aid declarations
      await tx.giftAid.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      });

      // 10. Transfer cases
      await tx.caseRecord.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      });

      // 11. Transfer relationships (if the contact has relationship links)
      // Update "from" relationships
      await tx.contactRelationship.updateMany({
        where: { fromContactId: secondaryId },
        data: { fromContactId: primaryId },
      });

      // Update "to" relationships
      await tx.contactRelationship.updateMany({
        where: { toContactId: secondaryId },
        data: { toContactId: primaryId },
      });

      // 12. Transfer memberships
      await tx.membership.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      });

      // 13. Transfer payments
      await tx.payment.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      });

      // 14. Transfer subscriptions
      await tx.subscription.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      });

      // 15. Transfer legacies
      await tx.legacy.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      });

      // 16. Transfer tribute fund guardians
      await tx.tributeFundGuardian.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      });

      // 17. Transfer fundraising pages
      await tx.fundraisingPage.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      });

      // 18. Transfer volunteer profile if exists
      const secondaryVolunteerProfile = await tx.volunteerProfile.findUnique({
        where: { contactId: secondaryId },
      });

      if (secondaryVolunteerProfile) {
        const primaryVolunteerProfile = await tx.volunteerProfile.findUnique({
          where: { contactId: primaryId },
        });

        if (primaryVolunteerProfile) {
          // If primary already has volunteer profile, transfer secondary's records to primary's profile
          await tx.volunteerHoursLog.updateMany({
            where: {
              volunteerId: secondaryVolunteerProfile.id,
            },
            data: { volunteerId: primaryVolunteerProfile.id },
          });

          await tx.assignment.updateMany({
            where: {
              volunteerId: secondaryVolunteerProfile.id,
            },
            data: { volunteerId: primaryVolunteerProfile.id },
          });

          // Delete the secondary volunteer profile
          await tx.volunteerProfile.delete({
            where: { id: secondaryVolunteerProfile.id },
          });
        } else {
          // Update the volunteer profile's contact ID
          await tx.volunteerProfile.update({
            where: { id: secondaryVolunteerProfile.id },
            data: { contactId: primaryId },
          });
        }
      }

      // 19. Archive secondary contact with merge note
      const mergeNote = `Merged into contact ${primaryId} (${primaryContact.firstName} ${primaryContact.lastName}) on ${new Date().toISOString()}`;

      await tx.contact.update({
        where: { id: secondaryId },
        data: {
          isArchived: true,
          archivedAt: new Date(),
          status: "ARCHIVED",
        },
      });

      // 20. Create audit log entry in Note for visibility
      await tx.note.create({
        data: {
          contactId: primaryId,
          content: `[MERGE LOG] ${mergeNote}. Secondary contact was ${secondaryContact.firstName} ${secondaryContact.lastName} (ID: ${secondaryId})`,
          createdById: session.id,
        },
      });

      return {
        success: true,
        primaryId,
        secondaryId,
        mergedFields: mergedData,
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error merging contacts:", error);
    return NextResponse.json(
      { error: "Failed to merge contacts" },
      { status: 500 }
    );
  }
}
