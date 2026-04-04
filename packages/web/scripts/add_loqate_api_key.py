#!/usr/bin/env python3
"""
Migration script to add loqateApiKey column to SystemSettings table.
This script uses psycopg2 to directly manage the column addition.
"""

import psycopg2
from psycopg2 import sql
import sys

# Database connection details
DATABASE_URL = "postgresql://postgres:yjSVCgwnJabUGzuXzZXrbpvQNnmHXJZD@gondola.proxy.rlwy.net:34856/railway"

def add_loqate_api_key_column():
    """Add loqateApiKey column to SystemSettings table if it doesn't exist."""
    try:
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Check if the column already exists
        check_column_sql = """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'SystemSettings'
        AND column_name = 'loqateApiKey';
        """
        cursor.execute(check_column_sql)

        if cursor.fetchone():
            print("✓ loqateApiKey column already exists in SystemSettings table")
            cursor.close()
            conn.close()
            return True

        # Add the loqateApiKey column
        add_column_sql = """
        ALTER TABLE "SystemSettings"
        ADD COLUMN "loqateApiKey" TEXT;
        """

        cursor.execute(add_column_sql)
        conn.commit()

        print("✓ loqateApiKey column added successfully to SystemSettings table")

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
    success = add_loqate_api_key_column()
    sys.exit(0 if success else 1)
