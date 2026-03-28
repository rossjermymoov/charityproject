#!/bin/bash
set -e

echo "=== CharityOS: Running database migrations ==="
npx prisma db push --accept-data-loss

echo "=== CharityOS: Checking if seed needed ==="
if npx tsx prisma/seed-if-empty.ts; then
  echo "=== CharityOS: Seed not needed ==="
else
  echo "=== CharityOS: Running seed ==="
  npx tsx prisma/seed.ts || echo "Seed failed (non-fatal), continuing..."
fi

echo "=== CharityOS: Starting server on port ${PORT:-3000} ==="
exec npx next start -H 0.0.0.0 -p ${PORT:-3000}
