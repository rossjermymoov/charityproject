import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get the admin user to use as createdBy
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("No admin user found");

  console.log(`Using admin: ${admin.name} (${admin.id})`);

  // ── Departments ──
  const deptData = [
    { name: "Fundraising", description: "Planning and running fundraising campaigns and events" },
    { name: "Retail", description: "Charity shop operations and stock management" },
    { name: "Communications", description: "Marketing, social media, and public relations" },
    { name: "Welfare & Support", description: "Frontline support services for beneficiaries" },
    { name: "Events", description: "Organising and managing charity events" },
    { name: "Finance", description: "Financial administration and reporting" },
    { name: "Transport", description: "Driving and delivery services" },
  ];

  const departments: Record<string, string> = {};
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
    departments[d.name] = dept.id;
  }
  console.log(`Created ${Object.keys(departments).length} departments`);

  // ── Skills ──
  const skillData = [
    { name: "First Aid", departmentId: departments["Welfare & Support"] },
    { name: "Driving", departmentId: departments["Transport"] },
    { name: "Social Media", departmentId: departments["Communications"] },
    { name: "Photography", departmentId: departments["Communications"] },
    { name: "Public Speaking", departmentId: departments["Fundraising"] },
    { name: "Cash Handling", departmentId: departments["Retail"] },
    { name: "Stock Sorting", departmentId: departments["Retail"] },
    { name: "Event Setup", departmentId: departments["Events"] },
    { name: "Safeguarding", departmentId: departments["Welfare & Support"] },
    { name: "Bookkeeping", departmentId: departments["Finance"] },
    { name: "IT Support", description: "General tech support and troubleshooting" },
    { name: "Counselling", departmentId: departments["Welfare & Support"] },
  ];

  const skills: Record<string, string> = {};
  for (const s of skillData) {
    const skill = await prisma.skill.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
    skills[s.name] = skill.id;
  }
  console.log(`Created ${Object.keys(skills).length} skills`);

  // ── 20 Fake Contacts ──
  const people = [
    { firstName: "Emma", lastName: "Thompson", email: "emma.thompson@example.com", phone: "07700 900101", addressLine1: "14 Riverside Drive", city: "Oxford", postcode: "OX1 4AJ", types: ["DONOR"], role: "donor" },
    { firstName: "James", lastName: "Patel", email: "james.patel@example.com", phone: "07700 900102", addressLine1: "8 Church Lane", city: "Bristol", postcode: "BS1 5TJ", types: ["VOLUNTEER"], role: "volunteer", deptNames: ["Fundraising", "Events"], skillNames: ["Public Speaking", "Event Setup"] },
    { firstName: "Sophie", lastName: "Williams", email: "sophie.williams@example.com", phone: "07700 900103", addressLine1: "22 Mill Road", city: "Cambridge", postcode: "CB1 2AD", types: ["DONOR", "VOLUNTEER"], role: "both", deptNames: ["Retail"], skillNames: ["Cash Handling", "Stock Sorting"] },
    { firstName: "Oliver", lastName: "Brown", email: "oliver.brown@example.com", phone: "07700 900104", addressLine1: "5 Station Road", city: "Manchester", postcode: "M1 2JB", types: ["DONOR"], role: "donor" },
    { firstName: "Amira", lastName: "Hassan", email: "amira.hassan@example.com", phone: "07700 900105", addressLine1: "31 Victoria Street", city: "Birmingham", postcode: "B1 1BD", types: ["VOLUNTEER"], role: "volunteer", deptNames: ["Welfare & Support"], skillNames: ["First Aid", "Safeguarding", "Counselling"] },
    { firstName: "Thomas", lastName: "Clarke", email: "thomas.clarke@example.com", phone: "07700 900106", addressLine1: "17 High Street", city: "Bath", postcode: "BA1 5EB", types: ["DONOR"], role: "donor" },
    { firstName: "Priya", lastName: "Sharma", email: "priya.sharma@example.com", phone: "07700 900107", addressLine1: "9 Park Avenue", city: "Leeds", postcode: "LS1 3HG", types: ["VOLUNTEER"], role: "volunteer", deptNames: ["Communications"], skillNames: ["Social Media", "Photography"] },
    { firstName: "Daniel", lastName: "O'Brien", email: "daniel.obrien@example.com", phone: "07700 900108", addressLine1: "42 Queen's Road", city: "Liverpool", postcode: "L1 4JQ", types: ["DONOR", "VOLUNTEER"], role: "both", deptNames: ["Transport"], skillNames: ["Driving", "First Aid"] },
    { firstName: "Lucy", lastName: "Evans", email: "lucy.evans@example.com", phone: "07700 900109", addressLine1: "6 Elm Close", city: "Sheffield", postcode: "S1 2GD", types: ["DONOR"], role: "donor" },
    { firstName: "Mohammed", lastName: "Ali", email: "mohammed.ali@example.com", phone: "07700 900110", addressLine1: "15 Crescent Road", city: "Leicester", postcode: "LE1 7RH", types: ["VOLUNTEER"], role: "volunteer", deptNames: ["Finance"], skillNames: ["Bookkeeping", "IT Support"] },
    { firstName: "Charlotte", lastName: "Taylor", email: "charlotte.taylor@example.com", phone: "07700 900111", addressLine1: "28 Maple Drive", city: "Nottingham", postcode: "NG1 5FT", types: ["DONOR"], role: "donor" },
    { firstName: "William", lastName: "Hughes", email: "william.hughes@example.com", phone: "07700 900112", addressLine1: "3 Castle Street", city: "Cardiff", postcode: "CF10 1BZ", types: ["VOLUNTEER"], role: "volunteer", deptNames: ["Events", "Fundraising"], skillNames: ["Event Setup", "Public Speaking", "Photography"] },
    { firstName: "Fatima", lastName: "Khan", email: "fatima.khan@example.com", phone: "07700 900113", addressLine1: "19 Meadow Way", city: "Bradford", postcode: "BD1 1PR", types: ["DONOR", "VOLUNTEER"], role: "both", deptNames: ["Welfare & Support", "Communications"], skillNames: ["Safeguarding", "Social Media"] },
    { firstName: "George", lastName: "Mitchell", email: "george.mitchell@example.com", phone: "07700 900114", addressLine1: "11 Brook Lane", city: "Edinburgh", postcode: "EH1 1YZ", types: ["DONOR"], role: "donor" },
    { firstName: "Hannah", lastName: "Cooper", email: "hannah.cooper@example.com", phone: "07700 900115", addressLine1: "7 Oak Terrace", city: "Newcastle", postcode: "NE1 8AG", types: ["VOLUNTEER"], role: "volunteer", deptNames: ["Retail", "Finance"], skillNames: ["Cash Handling", "Bookkeeping"] },
    { firstName: "Raj", lastName: "Gupta", email: "raj.gupta@example.com", phone: "07700 900116", addressLine1: "35 Willow Gardens", city: "Coventry", postcode: "CV1 2NE", types: ["DONOR"], role: "donor" },
    { firstName: "Emily", lastName: "Roberts", email: "emily.roberts@example.com", phone: "07700 900117", addressLine1: "24 Birch Avenue", city: "Southampton", postcode: "SO14 3DJ", types: ["VOLUNTEER"], role: "volunteer", deptNames: ["Transport", "Events"], skillNames: ["Driving", "Event Setup"] },
    { firstName: "Liam", lastName: "Murphy", email: "liam.murphy@example.com", phone: "07700 900118", addressLine1: "13 Ivy Lane", city: "Glasgow", postcode: "G1 5QE", types: ["DONOR", "VOLUNTEER"], role: "both", deptNames: ["Fundraising"], skillNames: ["Public Speaking"] },
    { firstName: "Zara", lastName: "Begum", email: "zara.begum@example.com", phone: "07700 900119", addressLine1: "20 Cedar Close", city: "Plymouth", postcode: "PL1 3RD", types: ["DONOR"], role: "donor" },
    { firstName: "Jack", lastName: "Stewart", email: "jack.stewart@example.com", phone: "07700 900120", addressLine1: "16 Hawthorn Rise", city: "York", postcode: "YO1 7HN", types: ["VOLUNTEER"], role: "volunteer", deptNames: ["Welfare & Support", "Transport"], skillNames: ["First Aid", "Driving", "Safeguarding"] },
  ];

  let contactCount = 0;
  let volunteerCount = 0;
  let donationCount = 0;

  for (const p of people) {
    // Create contact (skip if email already exists)
    const existing = await prisma.contact.findFirst({ where: { email: p.email } });
    if (existing) {
      console.log(`  Skipping ${p.firstName} ${p.lastName} — already exists`);
      continue;
    }

    const contact = await prisma.contact.create({
      data: {
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        addressLine1: p.addressLine1,
        city: p.city,
        postcode: p.postcode,
        types: p.types,
        status: "ACTIVE",
        createdById: admin.id,
      },
    });
    contactCount++;

    // If volunteer, create volunteer profile with departments and skills
    if (p.role === "volunteer" || p.role === "both") {
      const profile = await prisma.volunteerProfile.create({
        data: {
          contactId: contact.id,
          status: "ACTIVE",
          startDate: randomDate(2023, 2025),
          desiredHoursPerWeek: Math.floor(Math.random() * 12) + 2,
        },
      });

      // Assign departments
      const deptNames = (p as any).deptNames as string[] | undefined;
      if (deptNames) {
        for (const dn of deptNames) {
          if (departments[dn]) {
            await prisma.volunteerDepartment.create({
              data: { volunteerId: profile.id, departmentId: departments[dn] },
            });
          }
        }
      }

      // Assign skills
      const skillNames = (p as any).skillNames as string[] | undefined;
      if (skillNames) {
        const profs = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
        for (const sn of skillNames) {
          if (skills[sn]) {
            await prisma.volunteerSkill.create({
              data: {
                volunteerId: profile.id,
                skillId: skills[sn],
                proficiency: profs[Math.floor(Math.random() * profs.length)],
              },
            });
          }
        }
      }

      // Add some hours logs
      const numLogs = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < numLogs; i++) {
        const deptIds = deptNames?.map((dn) => departments[dn]).filter(Boolean) || [];
        await prisma.volunteerHoursLog.create({
          data: {
            volunteerId: profile.id,
            date: randomDate(2025, 2026),
            hours: Math.floor(Math.random() * 6) + 1,
            description: randomActivity(),
            departmentId: deptIds.length > 0 ? deptIds[Math.floor(Math.random() * deptIds.length)] : null,
            status: "LOGGED",
          },
        });
      }

      volunteerCount++;
    }

    // If donor, add some donations
    if (p.types.includes("DONOR")) {
      const numDonations = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < numDonations; i++) {
        const amount = [10, 20, 25, 50, 75, 100, 150, 250, 500][Math.floor(Math.random() * 9)];
        const methods = ["CARD", "BANK_TRANSFER", "DIRECT_DEBIT", "CASH", "ONLINE"];
        await prisma.donation.create({
          data: {
            contactId: contact.id,
            amount,
            type: "DONATION",
            method: methods[Math.floor(Math.random() * methods.length)],
            date: new Date(randomDate(2025, 2026)),
            status: "RECEIVED",
            isGiftAidable: Math.random() > 0.3,
            createdById: admin.id,
          },
        });
        donationCount++;
      }
    }

    console.log(`  Created ${p.firstName} ${p.lastName} (${p.role})`);
  }

  console.log(`\nDone! Created ${contactCount} contacts, ${volunteerCount} volunteer profiles, ${donationCount} donations`);
}

function randomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().split("T")[0];
}

function randomActivity(): string {
  const activities = [
    "Shop floor duties",
    "Sorting donations",
    "Fundraising event support",
    "Delivering food parcels",
    "Answering helpline calls",
    "Social media content creation",
    "Event setup and teardown",
    "Client support session",
    "Training new volunteers",
    "Stock room organisation",
    "Photography for newsletter",
    "Driving beneficiaries to appointments",
    "Cash counting and banking",
    "Community outreach visit",
    "Data entry and admin",
  ];
  return activities[Math.floor(Math.random() * activities.length)];
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
