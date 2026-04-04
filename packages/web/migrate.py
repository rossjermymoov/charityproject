#!/usr/bin/env python3
"""
Migration script for Donor Preference Centre feature
Adds PreferenceToken table and preference fields to Contact table
"""

import psycopg2
from psycopg2 import sql

# Database connection details
DATABASE_URL = "postgresql://postgres:yjSVCgwnJabUGzuXzZXrbpvQNnmHXJZD@gondola.proxy.rlwy.net:34856/railway"

def get_connection():
    """Create and return a database connection"""
    return psycopg2.connect(DATABASE_URL)

def column_exists(cursor, table, column):
    """Check if a column exists in a table"""
    cursor.execute("""
        SELECT EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_name = %s AND column_name = %s
        )
    """, (table, column))
    return cursor.fetchone()[0]

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
        print("Starting migrations...")

        # Step 1: Add preference columns to Contact table if they don't exist
        print("\n1. Adding preference columns to Contact table...")

        columns_to_add = {
            'emailOptIn': 'BOOLEAN DEFAULT true',
            'smsOptIn': 'BOOLEAN DEFAULT false',
            'postOptIn': 'BOOLEAN DEFAULT true',
            'phoneOptIn': 'BOOLEAN DEFAULT false',
            'communicationFrequency': "VARCHAR(50) DEFAULT 'WEEKLY'",
            'interestCategories': "TEXT[] DEFAULT ARRAY[]::text[]"
        }

        for column, definition in columns_to_add.items():
            if not column_exists(cursor, 'Contact', column):
                alter_sql = sql.SQL("ALTER TABLE {} ADD COLUMN {} {}").format(
                    sql.Identifier('Contact'),
                    sql.Identifier(column),
                    sql.SQL(definition)
                )
                cursor.execute(alter_sql)
                print(f"   ✓ Added {column}")
            else:
                print(f"   ✓ {column} already exists")

        conn.commit()

        # Step 2: Create PreferenceToken table if it doesn't exist
        print("\n2. Creating PreferenceToken table...")

        if not table_exists(cursor, 'PreferenceToken'):
            cursor.execute("""
                CREATE TABLE "PreferenceToken" (
                    id VARCHAR(25) PRIMARY KEY,
                    "contactId" VARCHAR(25) NOT NULL,
                    token VARCHAR(255) UNIQUE NOT NULL,
                    "expiresAt" TIMESTAMP,
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "PreferenceToken_contactId_fkey"
                        FOREIGN KEY ("contactId") REFERENCES "Contact"(id) ON DELETE CASCADE
                )
            """)
            print("   ✓ Created PreferenceToken table")

            # Create indexes
            cursor.execute('CREATE INDEX "PreferenceToken_token_idx" ON "PreferenceToken"(token)')
            cursor.execute('CREATE INDEX "PreferenceToken_contactId_idx" ON "PreferenceToken"("contactId")')
            cursor.execute('CREATE INDEX "PreferenceToken_expiresAt_idx" ON "PreferenceToken"("expiresAt")')
            print("   ✓ Created indexes")
        else:
            print("   ✓ PreferenceToken table already exists")

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
