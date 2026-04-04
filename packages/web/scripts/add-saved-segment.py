#!/usr/bin/env python3
"""
Migration script to add SavedSegment table to the database.
This script uses psycopg2 to directly manage the table creation.
"""

import psycopg2
from psycopg2 import sql
import sys

# Database connection details
DATABASE_URL = "postgresql://postgres:yjSVCgwnJabUGzuXzZXrbpvQNnmHXJZD@gondola.proxy.rlwy.net:34856/railway"

def create_saved_segment_table():
    """Create the SavedSegment table if it doesn't exist."""
    try:
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Create the SavedSegment table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS "SavedSegment" (
            id VARCHAR(191) PRIMARY KEY,
            name VARCHAR(191) NOT NULL,
            description TEXT,
            filters TEXT NOT NULL,
            "createdById" VARCHAR(191) NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("createdById") REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
        );
        """

        cursor.execute(create_table_sql)

        # Create an index on createdById
        create_index_sql = """
        CREATE INDEX IF NOT EXISTS "SavedSegment_createdById_idx"
        ON "SavedSegment"("createdById");
        """

        cursor.execute(create_index_sql)

        # Commit the changes
        conn.commit()

        print("✓ SavedSegment table created successfully")
        print("✓ Index on createdById created successfully")

        cursor.close()
        conn.close()
        return True

    except psycopg2.Error as e:
        print(f"✗ Database error: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    success = create_saved_segment_table()
    sys.exit(0 if success else 1)
