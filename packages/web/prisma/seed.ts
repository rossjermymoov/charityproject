import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.broadcastResponse.deleteMany();
  await prisma.broadcastSkill.deleteMany();
  await prisma.broadcast.deleteMany();
  await prisma.assignmentReminder.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.activityRecord.deleteMany();
  await prisma.volunteerHoursLog.deleteMany();
  await prisma.specialConsideration.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.volunteerSkill.deleteMany();
  await prisma.volunteerDepartment.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.note.deleteMany();
  await prisma.contactTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.organisation.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password", 12);

  // Users
  const admin = await prisma.user.create({
    data: { email: "admin@charity.org", name: "Sarah Mitchell", passwordHash, role: "ADMIN" },
  });
  const staff1 = await prisma.user.create({
    data: { email: "james@charity.org", name: "James Wilson", passwordHash, role: "STAFF" },
  });
  const staff2 = await prisma.user.create({
    data: { email: "emma@charity.org", name: "Emma Thompson", passwordHash, role: "STAFF" },
  });

  // Departments
  const kitchen = await prisma.department.create({
    data: { name: "Kitchen", description: "Food preparation and service" },
  });
  const reception = await prisma.department.create({
    data: { name: "Reception", description: "Front desk and visitor management" },
  });
  const events = await prisma.department.create({
    data: { name: "Events", description: "Event planning and coordination" },
  });
  const warehouse = await prisma.department.create({
    data: { name: "Warehouse", description: "Stock management and distribution" },
  });
  const admin_dept = await prisma.department.create({
    data: { name: "Administration", description: "Office and administrative support" },
  });
  const outreach = await prisma.department.create({
    data: { name: "Outreach", description: "Community outreach and engagement" },
  });

  // Skills
  const skillKitchen = await prisma.skill.create({ data: { name: "Kitchen", description: "Food preparation and cooking", departmentId: kitchen.id } });
  const skillFirstAid = await prisma.skill.create({ data: { name: "First Aid", description: "Basic first aid certification" } });
  const skillDriving = await prisma.skill.create({ data: { name: "Driving", description: "Valid driving licence" } });
  const skillReception = await prisma.skill.create({ data: { name: "Reception", description: "Front desk and phone skills", departmentId: reception.id } });
  const skillEvents = await prisma.skill.create({ data: { name: "Event Planning", description: "Event coordination and setup", departmentId: events.id } });
  const skillWarehouse = await prisma.skill.create({ data: { name: "Warehouse", description: "Stock handling and logistics", departmentId: warehouse.id } });
  const skillIT = await prisma.skill.create({ data: { name: "IT Support", description: "Technical support" } });
  const skillFundraising = await prisma.skill.create({ data: { name: "Fundraising", description: "Fundraising experience" } });

  // Tags
  const tagRegular = await prisma.tag.create({ data: { name: "Regular", colour: "#3B82F6" } });
  const tagNewStarter = await prisma.tag.create({ data: { name: "New Starter", colour: "#10B981" } });
  const tagMajorDonor = await prisma.tag.create({ data: { name: "Major Donor", colour: "#F59E0B" } });
  const tagCorporate = await prisma.tag.create({ data: { name: "Corporate Partner", colour: "#8B5CF6" } });
  const tagNewsletter = await prisma.tag.create({ data: { name: "Newsletter", colour: "#EC4899" } });

  // Organisations
  const org1 = await prisma.organisation.create({
    data: { name: "Acme Corporation", type: "Corporate", website: "https://acme.example.com", city: "London", country: "UK" },
  });
  const org2 = await prisma.organisation.create({
    data: { name: "Smith Family Foundation", type: "Foundation", city: "Manchester", country: "UK" },
  });
  const org3 = await prisma.organisation.create({
    data: { name: "City Council", type: "Government", city: "Birmingham", country: "UK" },
  });

  // Contacts — mix of donors and volunteers (a contact can be both)
  const contacts = await Promise.all([
    prisma.contact.create({ data: { firstName: "Alice", lastName: "Johnson", email: "alice@example.com", phone: "07700 900001", type: "VOLUNTEER", types: ["VOLUNTEER"], city: "London", postcode: "SW1A 1AA", country: "UK", createdById: admin.id } }),
    prisma.contact.create({ data: { firstName: "Bob", lastName: "Smith", email: "bob@example.com", phone: "07700 900002", type: "VOLUNTEER", types: ["VOLUNTEER"], city: "Manchester", postcode: "M1 1AA", country: "UK", createdById: admin.id } }),
    prisma.contact.create({ data: { firstName: "Charlie", lastName: "Davis", email: "charlie@example.com", phone: "07700 900003", type: "VOLUNTEER", types: ["VOLUNTEER", "DONOR"], city: "London", postcode: "EC1A 1BB", country: "UK", createdById: staff1.id } }),
    prisma.contact.create({ data: { firstName: "Diana", lastName: "Williams", email: "diana@example.com", phone: "07700 900004", type: "VOLUNTEER", types: ["VOLUNTEER"], city: "Birmingham", postcode: "B1 1AA", country: "UK", createdById: staff1.id } }),
    prisma.contact.create({ data: { firstName: "Edward", lastName: "Brown", email: "edward@example.com", phone: "07700 900005", type: "VOLUNTEER", types: ["VOLUNTEER"], city: "Leeds", postcode: "LS1 1AA", country: "UK", createdById: staff2.id } }),
    prisma.contact.create({ data: { firstName: "Fiona", lastName: "Taylor", email: "fiona@example.com", phone: "07700 900006", type: "VOLUNTEER", types: ["VOLUNTEER"], city: "London", postcode: "N1 1AA", country: "UK", createdById: admin.id } }),
    prisma.contact.create({ data: { firstName: "George", lastName: "Anderson", email: "george@acme.com", phone: "07700 900007", type: "DONOR", types: ["DONOR"], organisationId: org1.id, city: "London", country: "UK", createdById: admin.id } }),
    prisma.contact.create({ data: { firstName: "Hannah", lastName: "Smith", email: "hannah@smithfoundation.org", phone: "07700 900008", type: "DONOR", types: ["DONOR"], organisationId: org2.id, city: "Manchester", country: "UK", createdById: staff1.id } }),
    prisma.contact.create({ data: { firstName: "Ian", lastName: "Clark", email: "ian.clark@council.gov.uk", phone: "07700 900009", type: "DONOR", types: ["DONOR"], organisationId: org3.id, city: "Birmingham", country: "UK", createdById: staff2.id } }),
    prisma.contact.create({ data: { firstName: "Julia", lastName: "Martin", email: "julia@example.com", phone: "07700 900010", type: "DONOR", types: ["DONOR", "VOLUNTEER"], city: "London", country: "UK", createdById: admin.id } }),
  ]);

  // Contact tags
  await prisma.contactTag.createMany({
    data: [
      { contactId: contacts[0].id, tagId: tagRegular.id },
      { contactId: contacts[1].id, tagId: tagRegular.id },
      { contactId: contacts[2].id, tagId: tagNewStarter.id },
      { contactId: contacts[5].id, tagId: tagNewStarter.id },
      { contactId: contacts[6].id, tagId: tagMajorDonor.id },
      { contactId: contacts[6].id, tagId: tagCorporate.id },
      { contactId: contacts[7].id, tagId: tagMajorDonor.id },
      { contactId: contacts[8].id, tagId: tagNewsletter.id },
      { contactId: contacts[9].id, tagId: tagNewsletter.id },
    ],
  });

  // Volunteer users
  const volUser1 = await prisma.user.create({ data: { email: "alice.vol@charity.org", name: "Alice Johnson", passwordHash, role: "VOLUNTEER" } });
  const volUser2 = await prisma.user.create({ data: { email: "bob.vol@charity.org", name: "Bob Smith", passwordHash, role: "VOLUNTEER" } });

  // Volunteer Profiles
  const vol1 = await prisma.volunteerProfile.create({
    data: { contactId: contacts[0].id, userId: volUser1.id, status: "ACTIVE", startDate: "2024-03-15", desiredHoursPerWeek: 8 },
  });
  const vol2 = await prisma.volunteerProfile.create({
    data: { contactId: contacts[1].id, userId: volUser2.id, status: "ACTIVE", startDate: "2024-06-01", desiredHoursPerWeek: 12 },
  });
  const vol3 = await prisma.volunteerProfile.create({
    data: { contactId: contacts[2].id, status: "ACTIVE", startDate: "2025-01-10", desiredHoursPerWeek: 6 },
  });
  const vol4 = await prisma.volunteerProfile.create({
    data: { contactId: contacts[3].id, status: "ACTIVE", startDate: "2024-09-20", desiredHoursPerWeek: 10 },
  });
  const vol5 = await prisma.volunteerProfile.create({
    data: { contactId: contacts[4].id, status: "ON_LEAVE", startDate: "2024-01-05", desiredHoursPerWeek: 4 },
  });
  const vol6 = await prisma.volunteerProfile.create({
    data: { contactId: contacts[5].id, status: "APPLICANT", desiredHoursPerWeek: 6 },
  });

  // Volunteer-Department assignments
  await prisma.volunteerDepartment.createMany({
    data: [
      { volunteerId: vol1.id, departmentId: kitchen.id },
      { volunteerId: vol1.id, departmentId: events.id },
      { volunteerId: vol2.id, departmentId: kitchen.id },
      { volunteerId: vol2.id, departmentId: warehouse.id },
      { volunteerId: vol3.id, departmentId: reception.id },
      { volunteerId: vol3.id, departmentId: admin_dept.id },
      { volunteerId: vol4.id, departmentId: events.id },
      { volunteerId: vol4.id, departmentId: outreach.id },
      { volunteerId: vol5.id, departmentId: warehouse.id },
      { volunteerId: vol6.id, departmentId: kitchen.id },
    ],
  });

  // Volunteer Skills
  await prisma.volunteerSkill.createMany({
    data: [
      { volunteerId: vol1.id, skillId: skillKitchen.id, proficiency: "EXPERIENCED" },
      { volunteerId: vol1.id, skillId: skillFirstAid.id, proficiency: "COMPETENT" },
      { volunteerId: vol1.id, skillId: skillEvents.id, proficiency: "COMPETENT" },
      { volunteerId: vol2.id, skillId: skillKitchen.id, proficiency: "COMPETENT" },
      { volunteerId: vol2.id, skillId: skillDriving.id, proficiency: "EXPERIENCED" },
      { volunteerId: vol2.id, skillId: skillWarehouse.id, proficiency: "EXPERIENCED" },
      { volunteerId: vol3.id, skillId: skillReception.id, proficiency: "EXPERIENCED" },
      { volunteerId: vol3.id, skillId: skillIT.id, proficiency: "COMPETENT" },
      { volunteerId: vol4.id, skillId: skillEvents.id, proficiency: "EXPERIENCED" },
      { volunteerId: vol4.id, skillId: skillFundraising.id, proficiency: "COMPETENT" },
      { volunteerId: vol4.id, skillId: skillDriving.id, proficiency: "BEGINNER" },
      { volunteerId: vol5.id, skillId: skillWarehouse.id, proficiency: "COMPETENT" },
      { volunteerId: vol5.id, skillId: skillDriving.id, proficiency: "EXPERIENCED" },
    ],
  });

  // Availability
  await prisma.availability.createMany({
    data: [
      { volunteerId: vol1.id, dayOfWeek: "MON", startTime: "09:00", endTime: "13:00" },
      { volunteerId: vol1.id, dayOfWeek: "WED", startTime: "09:00", endTime: "17:00" },
      { volunteerId: vol1.id, dayOfWeek: "FRI", startTime: "10:00", endTime: "15:00" },
      { volunteerId: vol2.id, dayOfWeek: "TUE", startTime: "08:00", endTime: "16:00" },
      { volunteerId: vol2.id, dayOfWeek: "THU", startTime: "08:00", endTime: "16:00" },
      { volunteerId: vol2.id, dayOfWeek: "SAT", startTime: "09:00", endTime: "13:00" },
      { volunteerId: vol3.id, dayOfWeek: "MON", startTime: "10:00", endTime: "14:00" },
      { volunteerId: vol3.id, dayOfWeek: "WED", startTime: "10:00", endTime: "14:00" },
      { volunteerId: vol4.id, dayOfWeek: "MON", startTime: "09:00", endTime: "17:00" },
      { volunteerId: vol4.id, dayOfWeek: "TUE", startTime: "09:00", endTime: "17:00" },
      { volunteerId: vol4.id, dayOfWeek: "WED", startTime: "09:00", endTime: "17:00" },
      { volunteerId: vol4.id, dayOfWeek: "THU", startTime: "09:00", endTime: "17:00" },
      { volunteerId: vol4.id, dayOfWeek: "FRI", startTime: "09:00", endTime: "17:00" },
    ],
  });

  // Special Considerations
  await prisma.specialConsideration.create({
    data: {
      volunteerId: vol1.id,
      category: "DIETARY",
      description: "Vegetarian - cannot handle raw meat",
      accommodations: "Assign to vegetarian prep station when possible",
      isConfidential: false,
    },
  });
  await prisma.specialConsideration.create({
    data: {
      volunteerId: vol4.id,
      category: "PHYSICAL",
      description: "Mild hearing impairment in left ear",
      accommodations: "Position on right side during briefings, provide written instructions",
      isConfidential: true,
    },
  });

  // Hours Logs
  const hoursData = [
    { volunteerId: vol1.id, departmentId: kitchen.id, date: "2026-03-01", hours: 4, description: "Morning kitchen prep", status: "VERIFIED", verifiedById: staff1.id },
    { volunteerId: vol1.id, departmentId: kitchen.id, date: "2026-03-05", hours: 6, description: "Weekend meal service", status: "VERIFIED", verifiedById: staff1.id },
    { volunteerId: vol1.id, departmentId: events.id, date: "2026-03-10", hours: 8, description: "Spring fundraiser setup", status: "VERIFIED", verifiedById: admin.id },
    { volunteerId: vol1.id, departmentId: kitchen.id, date: "2026-03-15", hours: 4, description: "Wednesday cooking session", status: "LOGGED" },
    { volunteerId: vol1.id, departmentId: kitchen.id, date: "2026-03-22", hours: 4, description: "Friday lunch prep", status: "LOGGED" },
    { volunteerId: vol2.id, departmentId: kitchen.id, date: "2026-03-02", hours: 8, description: "Full day kitchen shift", status: "VERIFIED", verifiedById: staff1.id },
    { volunteerId: vol2.id, departmentId: warehouse.id, date: "2026-03-06", hours: 6, description: "Stock intake and sorting", status: "VERIFIED", verifiedById: staff2.id },
    { volunteerId: vol2.id, departmentId: warehouse.id, date: "2026-03-13", hours: 8, description: "Delivery run to centres", status: "VERIFIED", verifiedById: staff2.id },
    { volunteerId: vol2.id, departmentId: kitchen.id, date: "2026-03-20", hours: 6, description: "Thursday cooking", status: "LOGGED" },
    { volunteerId: vol3.id, departmentId: reception.id, date: "2026-03-03", hours: 4, description: "Front desk morning shift", status: "VERIFIED", verifiedById: admin.id },
    { volunteerId: vol3.id, departmentId: reception.id, date: "2026-03-10", hours: 4, description: "Visitor registration", status: "LOGGED" },
    { volunteerId: vol4.id, departmentId: events.id, date: "2026-03-08", hours: 10, description: "Community outreach event", status: "VERIFIED", verifiedById: staff2.id },
    { volunteerId: vol4.id, departmentId: outreach.id, date: "2026-03-15", hours: 6, description: "School visits programme", status: "LOGGED" },
  ];
  await prisma.volunteerHoursLog.createMany({ data: hoursData });

  // Activity Records
  await prisma.activityRecord.createMany({
    data: [
      { volunteerId: vol1.id, type: "TRAINING", title: "Food Hygiene Level 2", description: "Completed Level 2 food hygiene certificate", date: new Date("2024-04-10"), departmentId: kitchen.id },
      { volunteerId: vol1.id, type: "MILESTONE", title: "100 Hours Milestone", description: "Reached 100 hours of volunteering", date: new Date("2025-06-15") },
      { volunteerId: vol1.id, type: "EVENT", title: "Spring Fundraiser 2026", description: "Helped organise and run the spring fundraiser", date: new Date("2026-03-10"), departmentId: events.id },
      { volunteerId: vol2.id, type: "TRAINING", title: "Manual Handling", description: "Completed manual handling training", date: new Date("2024-07-05"), departmentId: warehouse.id },
      { volunteerId: vol2.id, type: "TRAINING", title: "Food Hygiene Level 2", description: "Completed food hygiene certificate", date: new Date("2024-08-20"), departmentId: kitchen.id },
      { volunteerId: vol3.id, type: "TRAINING", title: "Safeguarding Awareness", description: "Completed safeguarding training", date: new Date("2025-02-15") },
      { volunteerId: vol4.id, type: "EVENT", title: "Community Open Day", description: "Led community engagement activities", date: new Date("2026-03-08"), departmentId: outreach.id },
      { volunteerId: vol4.id, type: "MILESTONE", title: "6 Months Service", description: "Completed 6 months of volunteering", date: new Date("2025-03-20") },
    ],
  });

  // Interactions
  await prisma.interaction.createMany({
    data: [
      { contactId: contacts[6].id, type: "DONATION", subject: "Annual donation - £5,000", description: "Corporate annual charitable donation from Acme Corp", date: new Date("2026-01-15"), createdById: admin.id },
      { contactId: contacts[6].id, type: "MEETING", subject: "Partnership review meeting", description: "Discussed ongoing partnership and CSR goals", date: new Date("2026-02-20"), createdById: staff1.id },
      { contactId: contacts[7].id, type: "DONATION", subject: "Foundation grant - £10,000", description: "Annual grant from Smith Family Foundation", date: new Date("2026-02-01"), createdById: admin.id },
      { contactId: contacts[8].id, type: "CALL", subject: "Funding application update", description: "Discussed status of council funding application", date: new Date("2026-03-10"), createdById: staff2.id },
      { contactId: contacts[0].id, type: "EMAIL", subject: "Availability update", description: "Alice confirmed new availability for March", date: new Date("2026-03-01"), createdById: staff1.id },
    ],
  });

  // Notes
  await prisma.note.createMany({
    data: [
      { contactId: contacts[0].id, content: "Excellent volunteer - very reliable and always on time. Has expressed interest in taking on team lead responsibilities.", createdById: staff1.id },
      { contactId: contacts[1].id, content: "Bob has a van and is happy to help with deliveries when needed. Great asset for the warehouse team.", createdById: staff2.id },
      { contactId: contacts[6].id, content: "Key contact at Acme Corp. George is very supportive and keen to expand the partnership. Schedule follow-up for Q2.", createdById: admin.id },
    ],
  });

  // Assignments
  const assignment1 = await prisma.assignment.create({
    data: { volunteerId: vol1.id, departmentId: kitchen.id, title: "Monday morning kitchen prep", date: "2026-03-30", startTime: "09:00", endTime: "13:00", status: "CONFIRMED", createdById: staff1.id },
  });
  const assignment2 = await prisma.assignment.create({
    data: { volunteerId: vol2.id, departmentId: warehouse.id, title: "Thursday stock delivery run", date: "2026-04-02", startTime: "08:00", endTime: "16:00", status: "SCHEDULED", createdById: staff2.id },
  });
  const assignment3 = await prisma.assignment.create({
    data: { volunteerId: vol3.id, departmentId: reception.id, title: "Wednesday reception cover", date: "2026-04-01", startTime: "10:00", endTime: "14:00", status: "SCHEDULED", createdById: admin.id },
  });
  await prisma.assignment.create({
    data: { volunteerId: vol4.id, departmentId: events.id, title: "Easter event coordination", date: "2026-04-05", startTime: "09:00", endTime: "17:00", status: "CONFIRMED", createdById: staff1.id },
  });

  // Broadcasts
  const broadcast1 = await prisma.broadcast.create({
    data: {
      title: "Urgent: Kitchen cover needed tomorrow",
      message: "Sarah called in sick and we need someone to cover the morning kitchen shift tomorrow. Experience with food prep preferred.",
      urgency: "CRITICAL",
      departmentId: kitchen.id,
      targetDate: "2026-03-29",
      targetStartTime: "09:00",
      targetEndTime: "14:00",
      maxRespondents: 1,
      createdById: staff1.id,
      expiresAt: new Date("2026-03-29T08:00:00"),
      status: "OPEN",
      skills: { create: [{ skillId: skillKitchen.id }] },
    },
  });

  // Broadcast responses
  await prisma.broadcastResponse.create({
    data: { broadcastId: broadcast1.id, volunteerId: vol1.id, response: "ACCEPTED", message: "I can cover this!" },
  });
  await prisma.broadcastResponse.create({
    data: { broadcastId: broadcast1.id, volunteerId: vol2.id, response: "TENTATIVE", message: "Might be able to rearrange - let me check" },
  });

  const broadcast2 = await prisma.broadcast.create({
    data: {
      title: "Warehouse help needed for donation delivery",
      message: "Large donation delivery arriving Thursday. Need extra hands for unloading and sorting.",
      urgency: "HIGH",
      departmentId: warehouse.id,
      targetDate: "2026-04-02",
      targetStartTime: "10:00",
      targetEndTime: "15:00",
      maxRespondents: 3,
      createdById: staff2.id,
      expiresAt: new Date("2026-04-01T18:00:00"),
      status: "OPEN",
      skills: { create: [{ skillId: skillWarehouse.id }] },
    },
  });

  // Reminders
  await prisma.reminder.createMany({
    data: [
      { volunteerId: vol1.id, type: "HOURS_MILESTONE", title: "Approaching 200 hours!", message: "Alice is close to 200 hours - consider a thank you.", triggerDate: new Date("2026-04-15"), isAutomatic: true, createdById: admin.id },
      { volunteerId: vol2.id, type: "ANNIVERSARY", title: "2 Year Anniversary", message: "Bob's 2-year volunteering anniversary is coming up.", triggerDate: new Date("2026-06-01"), isAutomatic: true, createdById: admin.id },
      { volunteerId: vol1.id, type: "THANK_YOU", title: "Thank you for spring fundraiser", message: "Send a personal thank you for the extra effort at the spring fundraiser.", triggerDate: new Date("2026-03-12"), isSent: true, sentAt: new Date("2026-03-12"), createdById: staff1.id },
      { volunteerId: vol4.id, type: "CUSTOM", title: "Follow up: team lead interest", message: "Diana mentioned interest in becoming a team lead - schedule a chat.", triggerDate: new Date("2026-04-10"), createdById: staff2.id },
    ],
  });

  // Notification preferences
  await prisma.notificationPreference.createMany({
    data: [
      { userId: volUser1.id, pushEnabled: true, emailEnabled: true, inAppEnabled: true, broadcastOptIn: true, quietHoursStart: "22:00", quietHoursEnd: "07:00" },
      { userId: volUser2.id, pushEnabled: true, emailEnabled: false, inAppEnabled: true, broadcastOptIn: true, quietHoursStart: "23:00", quietHoursEnd: "08:00" },
    ],
  });

  // ============================================
  // COMPLIANCE SEED DATA
  // ============================================

  // DPIAs (Data Protection Impact Assessments)
  const dpia1 = await prisma.dpia.create({
    data: {
      title: "CRM System Implementation",
      description: "Introduction of new CharityOS CRM system for contact and donor management",
      projectOrSystem: "CharityOS CRM",
      dataController: "Hospice Care UK",
      dpoName: "Jane Smith",
      dpoEmail: "dpo@hospice.org.uk",
      status: "APPROVED",
      legalBasis: "LEGITIMATE_INTEREST",
      dataSubjects: "Donors, Volunteers, Service Users, Staff",
      dataCategories: "Contact details, Donation history, Volunteering records, Health information",
      specialCategories: true,
      dataMinimisation: "Only collect data necessary for relationship management and compliance",
      retentionPeriod: "7 years after last interaction for donors; 3 years for volunteers post-departure",
      securityMeasures: "Encrypted at rest (AES-256), TLS in transit, role-based access control, MFA enabled",
      internationalTransfers: false,
      consultationRequired: false,
      dpoAdvice: "DPIA approved. Ensure staff complete data protection training before system access.",
      dpoSignedOff: true,
      dpoSignedOffAt: new Date("2026-01-15"),
      reviewDate: new Date("2027-01-15"),
      createdById: admin.id,
      risks: {
        create: [
          {
            description: "Unauthorized access to sensitive donor and health data",
            likelihood: "LOW",
            severity: "HIGH",
            riskLevel: "MEDIUM",
            mitigation: "Role-based access control, audit logging, encryption",
            residualRisk: "LOW",
            riskOwner: "IT Manager",
            status: "MITIGATED",
          },
          {
            description: "Data breach during migration from legacy system",
            likelihood: "MEDIUM",
            severity: "HIGH",
            riskLevel: "HIGH",
            mitigation: "Phased migration, data validation, encrypted transfers, staff supervision",
            residualRisk: "MEDIUM",
            riskOwner: "Data Manager",
            status: "MITIGATED",
          },
          {
            description: "Accidental deletion of contact records",
            likelihood: "LOW",
            severity: "MEDIUM",
            riskLevel: "LOW",
            mitigation: "Daily automated backups, immutable audit trail, deletion confirmations",
            residualRisk: "VERY_LOW",
            riskOwner: "Backup Administrator",
            status: "MITIGATED",
          },
        ],
      },
    },
  });

  const dpia2 = await prisma.dpia.create({
    data: {
      title: "Volunteer Monitoring and Scheduling System",
      description: "New system to track volunteer hours, skills, and schedule assignments",
      projectOrSystem: "Volunteer Management Module",
      dataController: "Hospice Care UK",
      dpoName: "Jane Smith",
      dpoEmail: "dpo@hospice.org.uk",
      status: "IN_REVIEW",
      legalBasis: "CONTRACT",
      dataSubjects: "Volunteers, Staff",
      dataCategories: "Name, Phone, Email, Address, Availability, Skills, Hours worked, Special considerations",
      specialCategories: false,
      dataMinimisation: "Collect only essential volunteer information for scheduling and hour tracking",
      retentionPeriod: "3 years post-departure",
      securityMeasures: "Encrypted database, access logs, staff training on data handling",
      internationalTransfers: false,
      consultationRequired: false,
      dpoAdvice: "Under review. Need to clarify special category data handling for medical accommodations.",
      dpoSignedOff: false,
      reviewDate: new Date("2026-04-30"),
      createdById: admin.id,
      risks: {
        create: [
          {
            description: "Special consideration data (medical/disability) mishandled",
            likelihood: "MEDIUM",
            severity: "HIGH",
            riskLevel: "HIGH",
            mitigation: "Separate confidential field, restrict access to managers only, staff training",
            residualRisk: "MEDIUM",
            riskOwner: "HR Manager",
            status: "OPEN",
          },
          {
            description: "Inaccurate hour tracking leading to disputes",
            likelihood: "LOW",
            severity: "MEDIUM",
            riskLevel: "LOW",
            mitigation: "Volunteer self-reporting with manager verification, audit trail",
            residualRisk: "LOW",
            riskOwner: "Volunteer Coordinator",
            status: "MITIGATED",
          },
        ],
      },
    },
  });

  // Data Breaches
  await prisma.dataBreach.create({
    data: {
      title: "Phishing email compromise - resolved",
      description: "Staff member received phishing email and clicked malicious link. Quick action contained exposure.",
      discoveredAt: new Date("2026-02-15"),
      reportedAt: new Date("2026-02-15"),
      icoNotified: false,
      severity: "LOW",
      category: "CONFIDENTIALITY",
      dataSubjectsAffected: 0,
      dataTypesAffected: "None - no data accessed",
      cause: "Phishing attack",
      containmentActions: "Staff credentials reset, email blocked, antivirus updated",
      remediationActions: "Staff completed security awareness training, email filters strengthened",
      lessonsLearned: "Enhanced email filtering rules, increase frequency of phishing awareness training",
      status: "CONTAINED",
      dpoReview: "Incident contained quickly with no data loss. DPO notification not required.",
      createdById: admin.id,
    },
  });

  await prisma.dataBreach.create({
    data: {
      title: "Laptop with unencrypted data lost during transit",
      description: "Laptop containing contact database backups lost on public transport. Currently investigating.",
      discoveredAt: new Date("2026-03-10"),
      reportedAt: new Date("2026-03-10"),
      icoNotified: false,
      severity: "HIGH",
      category: "CONFIDENTIALITY",
      dataSubjectsAffected: 500,
      dataTypesAffected: "Contact details, Email addresses, Phone numbers, Donation records",
      cause: "Insecure data handling during staff relocation",
      containmentActions: "Notified police, monitoring for misuse, contacted affected donors/volunteers",
      remediationActions: "Investigating recovery options, mandatory encrypted backup policy",
      lessonsLearned: "Enforce encrypted storage on portable devices, implement mobile device management",
      status: "INVESTIGATING",
      dpoReview: "Under investigation. Planning to notify ICO within 72-hour window.",
      createdById: admin.id,
    },
  });

  // Subject Access Requests
  await prisma.subjectAccessRequest.create({
    data: {
      requesterName: "Margaret Johnson",
      requesterEmail: "margaret.j@email.com",
      requesterPhone: "07700 123456",
      requestDate: new Date("2026-03-15"),
      dueDate: new Date("2026-04-15"),
      description: "Request for all personal data held about me as a former volunteer",
      idVerified: true,
      idVerifiedAt: new Date("2026-03-16"),
      status: "IN_PROGRESS",
      assignedToId: staff1.id,
      createdById: admin.id,
    },
  });

  await prisma.subjectAccessRequest.create({
    data: {
      requesterName: "Robert Chen",
      requesterEmail: "robert.chen@company.co.uk",
      requestDate: new Date("2025-11-20"),
      dueDate: new Date("2025-12-20"),
      description: "SAR for donor records and communications",
      idVerified: true,
      idVerifiedAt: new Date("2025-11-21"),
      status: "CLOSED",
      dataSentAt: new Date("2025-12-19"),
      dataSentMethod: "EMAIL",
      responseNotes: "Full records sent including donation history and event attendance records",
      assignedToId: staff2.id,
      createdById: admin.id,
    },
  });

  // Processing Activities (ROPA - Record of Processing Activities)
  await prisma.processingActivity.create({
    data: {
      name: "Donor Contact Management",
      purpose: "Maintain relationships with donors, send updates and appeals, manage giving preferences",
      legalBasis: "LEGITIMATE_INTEREST",
      dataController: "Hospice Care UK",
      dataProcessor: "Mailchimp (for email campaigns)",
      dataSubjectCategories: "Donors, Supporters, Grant-making foundations",
      dataCategories: "Name, Email, Address, Phone, Donation history, Communication preferences",
      recipientCategories: "Finance team, Fundraising team, Executive team (for reports)",
      internationalTransfers: false,
      retentionPeriod: "7 years after last contact or transaction",
      securityMeasures: "Data encrypted at rest, restricted access by role, audit logging, GDPR-compliant DPA in place",
      dpaInPlace: true,
      dpaReference: "DPA-MAILCHIMP-2026-001",
      lastReviewDate: new Date("2026-01-10"),
      nextReviewDate: new Date("2027-01-10"),
      isActive: true,
    },
  });

  await prisma.processingActivity.create({
    data: {
      name: "Volunteer Management and Hour Tracking",
      purpose: "Recruit, onboard, schedule, and track volunteer activity; manage availability and skills",
      legalBasis: "CONTRACT",
      dataController: "Hospice Care UK",
      dataSubjectCategories: "Volunteers, Staff managing volunteers",
      dataCategories: "Name, Email, Phone, Address, Availability, Skills, Hours logged, References",
      specialCategories: "Special considerations, Health accommodations, Dietary requirements",
      recipientCategories: "Volunteer coordinators, Department leads, Finance (for records)",
      internationalTransfers: false,
      retentionPeriod: "3 years after volunteer departure",
      securityMeasures: "Role-based access control, confidential marking for health data, encrypted storage",
      dpaInPlace: false,
      lastReviewDate: new Date("2025-10-15"),
      nextReviewDate: new Date("2026-10-15"),
      isActive: true,
    },
  });

  await prisma.processingActivity.create({
    data: {
      name: "Service User Care Records",
      purpose: "Document care provided to hospice service users, clinical decision support, outcomes tracking",
      legalBasis: "VITAL_INTEREST",
      dataController: "Hospice Care UK",
      dataSubjectCategories: "Hospice service users, Family members, Clinical staff",
      dataCategories: "Health records, Care history, Clinical notes, Contact information, Medication records",
      specialCategories: "Health data, Genetic data, Biometric data",
      recipientCategories: "Clinical staff, Care coordinators, Medical professionals, Family members",
      internationalTransfers: false,
      retentionPeriod: "8 years post-death or discharge per NHS guidelines",
      securityMeasures: "HL7 encryption, audit trails, access logging, physical security, staff clearances",
      dpaInPlace: true,
      dpaReference: "DATA-CONTROL-2025-001",
      lastReviewDate: new Date("2026-02-20"),
      nextReviewDate: new Date("2027-02-20"),
      isActive: true,
    },
  });

  // Information Assets
  await prisma.informationAsset.create({
    data: {
      name: "CharityOS CRM Database",
      description: "PostgreSQL database containing all contact, donor, and volunteer information",
      assetOwner: "IT Manager",
      assetType: "DATABASE",
      location: "AWS Cloud (eu-west-2 region)",
      dataClassification: "OFFICIAL_SENSITIVE",
      personalData: true,
      specialCategoryData: false,
      riskLevel: "HIGH",
      encryptionAtRest: true,
      encryptionInTransit: true,
      accessControls: "Role-based access (RBAC), database encryption, MFA required",
      backupFrequency: "Daily automated backups with weekly offsite copies",
      retentionPeriod: "7 years",
      disposalMethod: "Secure overwrite with 3-pass deletion, certificate of destruction",
      lastReviewDate: new Date("2026-02-28"),
      nextReviewDate: new Date("2026-08-28"),
      isActive: true,
    },
  });

  await prisma.informationAsset.create({
    data: {
      name: "Donor Finance Records (Spreadsheet Archive)",
      description: "Legacy spreadsheet containing historical donor records and major gift information",
      assetOwner: "Finance Manager",
      assetType: "FILE_SYSTEM",
      location: "Secure shared drive (OneDrive for Business, encrypted)",
      dataClassification: "OFFICIAL_SENSITIVE",
      personalData: true,
      specialCategoryData: false,
      riskLevel: "MEDIUM",
      encryptionAtRest: true,
      encryptionInTransit: true,
      accessControls: "Password protected, restricted to finance team and admin",
      backupFrequency: "Weekly",
      retentionPeriod: "7 years",
      disposalMethod: "Secure deletion of file, confirmation from IT",
      lastReviewDate: new Date("2025-12-10"),
      nextReviewDate: new Date("2026-12-10"),
      isActive: true,
    },
  });

  await prisma.informationAsset.create({
    data: {
      name: "Volunteer Paper Records and References",
      description: "Physical files containing volunteer application forms, references, and special considerations",
      assetOwner: "Volunteer Coordinator",
      assetType: "PAPER",
      location: "Locked filing cabinet in admin office (Building A, Room 102)",
      dataClassification: "OFFICIAL_SENSITIVE",
      personalData: true,
      specialCategoryData: true,
      riskLevel: "MEDIUM",
      encryptionAtRest: false,
      accessControls: "Locked storage, access by volunteer staff only, signing in/out log maintained",
      backupFrequency: "Manual scanning of key documents quarterly",
      retentionPeriod: "3 years after volunteer departure",
      disposalMethod: "Cross-cut shredding, witnessed disposal",
      lastReviewDate: new Date("2026-01-15"),
      nextReviewDate: new Date("2026-07-15"),
      isActive: true,
    },
  });

  // Clinical Hazards
  await prisma.clinicalHazard.create({
    data: {
      hazardNumber: "HAZ-001",
      name: "System unavailability affecting care delivery",
      description: "CRM or volunteer scheduling system becomes unavailable, disrupting care team schedules",
      cause: "Database outage, network failure, or infrastructure issue",
      effect: "Staff unable to access volunteer schedules, potential service disruption",
      category: "SYSTEM_FAILURE",
      initialSeverity: "MAJOR",
      initialLikelihood: "LOW",
      initialRiskLevel: "MEDIUM",
      controls: "Redundant systems, failover database, alternative communication channels, daily backups",
      residualSeverity: "MAJOR",
      residualLikelihood: "VERY_LOW",
      residualRiskLevel: "LOW",
      riskAcceptability: "TOLERABLE",
      status: "OPEN",
      assignedTo: "IT Director",
      csoReview: "Risk mitigated to tolerable level with current infrastructure. Review annually.",
      csoSignedOff: true,
      csoSignedOffAt: new Date("2026-01-20"),
    },
  });

  await prisma.clinicalHazard.create({
    data: {
      hazardNumber: "HAZ-002",
      name: "Incorrect care instructions due to data entry errors",
      description: "Special medical considerations or allergies entered incorrectly leading to wrong care",
      cause: "Manual data entry errors, transcription mistakes from paper to system",
      effect: "Patient safety risk - staff may provide incorrect care based on inaccurate data",
      category: "CLINICAL_DECISION",
      initialSeverity: "CATASTROPHIC",
      initialLikelihood: "MEDIUM",
      initialRiskLevel: "VERY_HIGH",
      controls: "Data validation rules, double-entry verification, flags for critical fields, staff training",
      residualSeverity: "CATASTROPHIC",
      residualLikelihood: "LOW",
      residualRiskLevel: "MEDIUM",
      riskAcceptability: "ACCEPTABLE",
      status: "MITIGATED",
      assignedTo: "Clinical Lead",
      csoReview: "Control measures are effective. Recommend monthly audit of critical data fields.",
      csoSignedOff: true,
      csoSignedOffAt: new Date("2026-02-15"),
    },
  });

  // Consent Records (various consent changes)
  await prisma.consentRecord.createMany({
    data: [
      {
        contactId: contacts[0].id,
        consentType: "EMAIL",
        action: "GRANTED",
        previousValue: false,
        newValue: true,
        source: "WEB_PORTAL",
        notes: "Volunteer opted in to email communications",
        recordedById: admin.id,
      },
      {
        contactId: contacts[1].id,
        consentType: "MARKETING",
        action: "WITHDRAWN",
        previousValue: true,
        newValue: false,
        source: "PHONE",
        notes: "Donor called to withdraw consent for marketing emails",
        recordedById: staff1.id,
      },
      {
        contactId: contacts[6].id,
        consentType: "POST",
        action: "GRANTED",
        previousValue: false,
        newValue: true,
        source: "IN_PERSON",
        notes: "Corporate contact signed consent form at meeting",
        recordedById: staff2.id,
      },
      {
        contactId: contacts[9].id,
        consentType: "SMS",
        action: "GRANTED",
        previousValue: false,
        newValue: true,
        source: "WEB_FORM",
        notes: "Service user consented to SMS reminders",
        recordedById: admin.id,
      },
      {
        contactId: contacts[0].id,
        consentType: "DATA_PROCESSING",
        action: "GRANTED",
        previousValue: null,
        newValue: true,
        source: "WEB_PORTAL",
        notes: "Initial consent for data processing in CRM system",
        recordedById: admin.id,
      },
      {
        contactId: contacts[3].id,
        consentType: "PHONE",
        action: "WITHDRAWN",
        previousValue: true,
        newValue: false,
        source: "LETTER",
        notes: "Volunteer requested removal from phone contact list",
        recordedById: staff2.id,
      },
    ],
  });

  console.log("Seed completed successfully!");
  console.log("Login credentials:");
  console.log("  Admin: admin@charity.org / password");
  console.log("  Staff: james@charity.org / password");
  console.log("  Staff: emma@charity.org / password");
  console.log("  Volunteer: alice.vol@charity.org / password");
  console.log("  Volunteer: bob.vol@charity.org / password");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
