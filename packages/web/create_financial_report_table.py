#!/usr/bin/env python3
"""
Database migration script to create FinancialReport table for SORP-compliant financial reporting.
Run this script to create the necessary database table and indexes.
"""

import psycopg2
from psycopg2 import sql
import sys

# Database connection details
DB_HOST = "gondola.proxy.rlwy.net"
DB_PORT = 34856
DB_NAME = "railway"
DB_USER = "postgres"
DB_PASSWORD = "yjSVCgwnJabUGzuXzZXrbpvQNnmHXJZD"

def create_financial_report_table():
    """Create the FinancialReport table with required columns and indexes."""

    conn = None
    try:
        # Connect to the database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )

        cursor = conn.cursor()

        # Create the FinancialReport table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS "FinancialReport" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'SOFA',
            "financialYear" TEXT NOT NULL,
            "startDate" TIMESTAMP NOT NULL,
            "endDate" TIMESTAMP NOT NULL,
            data JSONB DEFAULT '{}',
            status TEXT NOT NULL DEFAULT 'DRAFT',
            "generatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            "generatedById" TEXT NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "FinancialReport_generatedById_fkey"
                FOREIGN KEY ("generatedById")
                REFERENCES "User" (id) ON DELETE RESTRICT
        );
        """

        cursor.execute(create_table_sql)
        print("Created FinancialReport table")

        # Create indexes
        indexes = [
            ('CREATE INDEX IF NOT EXISTS "FinancialReport_type_idx" ON "FinancialReport" (type);', "type index"),
            ('CREATE INDEX IF NOT EXISTS "FinancialReport_status_idx" ON "FinancialReport" (status);', "status index"),
            ('CREATE INDEX IF NOT EXISTS "FinancialReport_generatedById_idx" ON "FinancialReport" ("generatedById");', "generatedById index"),
        ]

        for index_sql, index_name in indexes:
            cursor.execute(index_sql)
            print(f"Created {index_name}")

        # Commit all changes
        conn.commit()
        print("Successfully created FinancialReport table and indexes")
        return True

    except psycopg2.Error as e:
        print(f"Database error: {e}", file=sys.stderr)
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    success = create_financial_report_table()
    sys.exit(0 if success else 1)
