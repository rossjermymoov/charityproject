#!/usr/bin/env python3
"""
Create the RenewalReminder table in PostgreSQL.
"""
import psycopg2
import os
import sys
from datetime import datetime

# Database connection string
DATABASE_URL = "postgresql://postgres:yjSVCgwnJabUGzuXzZXrbpvQNnmHXJZD@gondola.proxy.rlwy.net:34856/railway"

def create_renewal_reminder_table():
    """Create the RenewalReminder table."""
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Create RenewalReminder table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS "RenewalReminder" (
            id TEXT PRIMARY KEY,
            "membershipId" TEXT NOT NULL,
            type TEXT NOT NULL,
            "sentAt" TIMESTAMP NOT NULL,
            "emailId" TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY ("membershipId") REFERENCES "Membership"(id) ON DELETE CASCADE
        );
        """

        cursor.execute(create_table_sql)

        # Create indexes for better query performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS "RenewalReminder_membershipId_idx"
            ON "RenewalReminder"("membershipId");
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS "RenewalReminder_type_idx"
            ON "RenewalReminder"(type);
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS "RenewalReminder_createdAt_idx"
            ON "RenewalReminder"("createdAt");
        """)

        # Commit changes
        conn.commit()
        print(f"✓ RenewalReminder table created successfully at {datetime.now().isoformat()}")

    except Exception as e:
        print(f"✗ Error creating RenewalReminder table: {e}", file=sys.stderr)
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    create_renewal_reminder_table()
