#!/bin/bash
set -e

echo "=== DeepCharity: Running database migrations ==="
npx prisma db push --accept-data-loss

echo "=== DeepCharity: Checking if seed needed ==="
if npx tsx prisma/seed-if-empty.ts; then
  echo "=== DeepCharity: Seed not needed ==="
else
  echo "=== DeepCharity: Running seed ==="
  npx tsx prisma/seed.ts || echo "Seed failed (non-fatal), continuing..."
fi

echo "=== DeepCharity: Starting server on port ${PORT:-3000} ==="
exec npx next start -H 0.0.0.0 -p ${PORT:-3000}
