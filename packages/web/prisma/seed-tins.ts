import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface Business {
  name: string;
  address: string;
  city: string;
  postcode: string;
  type: string;
  lat: number;
  lng: number;
}

function derivePostcodeArea(postcode: string): string {
  // Take the outward code + first digit of inward code, e.g. "SY11 1" from "SY11 1PZ"
  const parts = postcode.trim().split(/\s+/);
  if (parts.length === 2) {
    return `${parts[0]} ${parts[1][0]}`;
  }
  return parts[0];
}

function generateTinNumber(index: number): string {
  // Format: CT-XXXX where XXXX is zero-padded
  return `CT-${String(index).padStart(4, "0")}`;
}

async function main() {
  // Load business data
  const dataPath = path.join(__dirname, "../../../charity_businesses.json");
  const rawData = fs.readFileSync(dataPath, "utf-8");
  const businesses: Business[] = JSON.parse(rawData);

  console.log(`Loaded ${businesses.length} businesses`);

  // Get the admin user for createdBy
  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@charity.org" },
  });

  if (!adminUser) {
    console.error("Admin user not found! Please ensure admin@charity.org exists.");
    process.exit(1);
  }

  console.log(`Using admin user: ${adminUser.id} (${adminUser.email})`);

  // Check existing tin count to determine starting number
  const existingTins = await prisma.collectionTin.count();
  let tinIndex = existingTins + 1;
  console.log(`Starting tin numbers from CT-${String(tinIndex).padStart(4, "0")}`);

  let created = 0;
  let skipped = 0;

  for (const biz of businesses) {
    // Check if location already exists (by name + city)
    const existingLocation = await prisma.tinLocation.findFirst({
      where: { name: biz.name, city: biz.city },
    });

    let locationId: string;

    if (existingLocation) {
      locationId = existingLocation.id;
      console.log(`  Location exists: ${biz.name} (${biz.city})`);
    } else {
      const location = await prisma.tinLocation.create({
        data: {
          name: biz.name,
          address: biz.address,
          city: biz.city,
          postcode: biz.postcode,
          postcodeArea: derivePostcodeArea(biz.postcode),
          type: biz.type,
          latitude: biz.lat,
          longitude: biz.lng,
          isActive: true,
        },
      });
      locationId = location.id;
    }

    // Create a collection tin at this location
    const tinNumber = generateTinNumber(tinIndex);

    // Check if tin number already exists
    const existingTin = await prisma.collectionTin.findUnique({
      where: { tinNumber },
    });

    if (existingTin) {
      console.log(`  Tin ${tinNumber} already exists, skipping`);
      skipped++;
      tinIndex++;
      continue;
    }

    // Random deployed date in last 6 months
    const deployedDaysAgo = Math.floor(Math.random() * 180) + 1;
    const deployedAt = new Date(Date.now() - deployedDaysAgo * 24 * 60 * 60 * 1000);

    await prisma.collectionTin.create({
      data: {
        tinNumber,
        locationName: biz.name,
        locationAddress: `${biz.address}, ${biz.city}, ${biz.postcode}`,
        locationId,
        status: "DEPLOYED",
        deployedAt,
        createdById: adminUser.id,
      },
    });

    // Create a DEPLOYED movement record
    await prisma.collectionTinMovement.create({
      data: {
        tinId: (await prisma.collectionTin.findUnique({ where: { tinNumber } }))!.id,
        type: "DEPLOYED",
        date: deployedAt,
        notes: `Initial deployment to ${biz.name}`,
      },
    });

    // For ~30% of tins, create some historical return data to build up averages
    if (Math.random() < 0.3) {
      const tin = await prisma.collectionTin.findUnique({ where: { tinNumber } });
      if (tin) {
        const numReturns = Math.floor(Math.random() * 3) + 1;
        for (let r = 0; r < numReturns; r++) {
          const returnDaysAgo = deployedDaysAgo + Math.floor(Math.random() * 180) + 30;
          const returnDate = new Date(Date.now() - returnDaysAgo * 24 * 60 * 60 * 1000);
          // Random amount between £2 and £85
          const amount = Math.round((Math.random() * 83 + 2) * 100) / 100;

          await prisma.tinReturn.create({
            data: {
              tinId: tin.id,
              amount,
              countedById: adminUser.id,
              returnedAt: returnDate,
              notes: `Historical return - £${amount.toFixed(2)}`,
            },
          });

          await prisma.collectionTinMovement.create({
            data: {
              tinId: tin.id,
              type: "COUNTED",
              date: returnDate,
              amount,
              notes: `Counted: £${amount.toFixed(2)} from ${biz.name}`,
            },
          });
        }
      }
    }

    created++;
    tinIndex++;

    if (created % 25 === 0) {
      console.log(`  Created ${created}/${businesses.length} tins...`);
    }
  }

  console.log(`\nDone! Created ${created} tins, skipped ${skipped}`);

  // Summary stats
  const totalTins = await prisma.collectionTin.count();
  const totalLocations = await prisma.tinLocation.count();
  const totalReturns = await prisma.tinReturn.count();
  console.log(`Total tins in DB: ${totalTins}`);
  console.log(`Total locations in DB: ${totalLocations}`);
  console.log(`Total return records: ${totalReturns}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
