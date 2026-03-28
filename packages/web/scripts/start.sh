#!/bin/bash
set -e

echo "Running database migrations..."
npx prisma db push --accept-data-loss

echo "Checking if seed data is needed..."
USERS_EXIST=$(npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const c = await p.user.count();
console.log(c);
await p.\$disconnect();
" 2>/dev/null || echo "0")

if [ "$USERS_EXIST" = "0" ]; then
  echo "No users found — seeding database..."
  npx tsx prisma/seed.ts
  echo "Seed complete."
else
  echo "Database already seeded ($USERS_EXIST users found). Skipping."
fi

echo "Starting Next.js on port ${PORT:-3000}..."
npx next start -p ${PORT:-3000}
