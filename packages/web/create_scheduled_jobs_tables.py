#!/usr/bin/env python3
"""
Migration script for Scheduled Jobs/Reminders Improvements feature
Creates ScheduledJob and JobRun tables for managing scheduled tasks
"""

import psycopg2
from psycopg2 import sql

# Database connection details
DATABASE_URL = "postgresql://postgres:yjSVCgwnJabUGzuXzZXrbpvQNnmHXJZD@gondola.proxy.rlwy.net:34856/railway"

def get_connection():
    """Create and return a database connection"""
    return psycopg2.connect(DATABASE_URL)

def table_exists(cursor, table):
    """Check if a table exists"""
    cursor.execute("""
        SELECT EXISTS(
            SELECT 1 FROM information_schema.tables
            WHERE table_name = %s
        )
    """, (table,))
    return cursor.fetchone()[0]

def run_migrations():
    """Run all migration steps"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        print("Starting migrations for Scheduled Jobs feature...")

        # Step 1: Create ScheduledJob table
        print("\n1. Creating ScheduledJob table...")

        if not table_exists(cursor, 'ScheduledJob'):
            cursor.execute("""
                CREATE TABLE "ScheduledJob" (
                    id VARCHAR(25) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    type VARCHAR(100) NOT NULL,
                    description TEXT,
                    schedule VARCHAR(255),
                    "isActive" BOOLEAN DEFAULT true,
                    "lastRunAt" TIMESTAMP,
                    "lastRunStatus" VARCHAR(50),
                    "lastRunDuration" INTEGER,
                    "nextRunAt" TIMESTAMP,
                    config JSONB DEFAULT '{}',
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("   ✓ Created ScheduledJob table")

            # Create indexes
            cursor.execute('CREATE INDEX "ScheduledJob_type_idx" ON "ScheduledJob"(type)')
            cursor.execute('CREATE INDEX "ScheduledJob_isActive_idx" ON "ScheduledJob"("isActive")')
            cursor.execute('CREATE INDEX "ScheduledJob_createdAt_idx" ON "ScheduledJob"("createdAt")')
            cursor.execute('CREATE INDEX "ScheduledJob_nextRunAt_idx" ON "ScheduledJob"("nextRunAt")')
            print("   ✓ Created indexes on ScheduledJob")
        else:
            print("   ✓ ScheduledJob table already exists")

        conn.commit()

        # Step 2: Create JobRun table
        print("\n2. Creating JobRun table...")

        if not table_exists(cursor, 'JobRun'):
            cursor.execute("""
                CREATE TABLE "JobRun" (
                    id VARCHAR(25) PRIMARY KEY,
                    "jobId" VARCHAR(25) NOT NULL,
                    status VARCHAR(50) DEFAULT 'RUNNING',
                    "startedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    "completedAt" TIMESTAMP,
                    duration INTEGER,
                    result JSONB,
                    error TEXT,
                    CONSTRAINT "JobRun_jobId_fkey"
                        FOREIGN KEY ("jobId") REFERENCES "ScheduledJob"(id) ON DELETE CASCADE
                )
            """)
            print("   ✓ Created JobRun table")

            # Create indexes
            cursor.execute('CREATE INDEX "JobRun_jobId_idx" ON "JobRun"("jobId")')
            cursor.execute('CREATE INDEX "JobRun_status_idx" ON "JobRun"(status)')
            cursor.execute('CREATE INDEX "JobRun_startedAt_idx" ON "JobRun"("startedAt")')
            print("   ✓ Created indexes on JobRun")
        else:
            print("   ✓ JobRun table already exists")

        conn.commit()
        print("\n✓ All migrations completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"\n✗ Migration failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migrations()
