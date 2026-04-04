import psycopg2

conn = psycopg2.connect("postgresql://postgres:yjSVCgwnJabUGzuXzZXrbpvQNnmHXJZD@gondola.proxy.rlwy.net:34856/railway")
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS "BoardReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'QUARTERLY_SUMMARY',
    "period" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "narrative" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BoardReport_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BoardReport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BoardReport_type_idx" ON "BoardReport"("type");
CREATE INDEX IF NOT EXISTS "BoardReport_status_idx" ON "BoardReport"("status");
CREATE INDEX IF NOT EXISTS "BoardReport_generatedById_idx" ON "BoardReport"("generatedById");
CREATE INDEX IF NOT EXISTS "BoardReport_createdAt_idx" ON "BoardReport"("createdAt");
""")

conn.commit()
print("BoardReport table created successfully")
cur.close()
conn.close()
